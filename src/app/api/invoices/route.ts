import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';

// GET — List invoices with filters (status, clientId, dateRange) + pagination
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['status', 'clientId']);
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const where: Record<string, any> = buildWhere(filters, ['number', 'notes'], search);

        // Date range filter on dueDate
        if (dateFrom || dateTo) {
            where.dueDate = {};
            if (dateFrom) where.dueDate.gte = new Date(dateFrom);
            if (dateTo) where.dueDate.lte = new Date(dateTo);
        }

        const [items, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    client: { select: { id: true, name: true, nameAr: true, avatar: true } },
                    items: true,
                    payments: true,
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'dueDate', 'total', 'number', 'status']),
                take,
                skip,
            }),
            prisma.invoice.count({ where }),
        ]);

        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create invoice with items
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const { clientId, campaignId, dueDate, taxRate, discount, currency, notes, notesAr, items } = body;

        if (!clientId || !dueDate) {
            return NextResponse.json(
                { error: 'clientId and dueDate are required', error_ar: 'معرّف العميل وتاريخ الاستحقاق مطلوبان' },
                { status: 400 }
            );
        }

        // Generate invoice number: INV-YYYY-NNN
        const year = new Date().getFullYear();
        const lastInvoice = await prisma.invoice.findFirst({
            where: { number: { startsWith: `INV-${year}-` } },
            orderBy: { number: 'desc' },
        });

        let nextNum = 1;
        if (lastInvoice) {
            const parts = lastInvoice.number.split('-');
            nextNum = parseInt(parts[2], 10) + 1;
        }
        const invoiceNumber = `INV-${year}-${String(nextNum).padStart(3, '0')}`;

        // Calculate totals from items
        const invoiceItems = (items || []) as Array<{ description: string; descriptionAr?: string; quantity: number; rate: number; sortOrder?: number }>;
        const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity || 1) * (item.rate || 0), 0);
        const tax = taxRate ? subtotal * (taxRate / 100) : 0;
        const total = subtotal + tax - (discount || 0);

        const invoice = await prisma.invoice.create({
            data: {
                number: invoiceNumber,
                clientId,
                campaignId: campaignId || null,
                status: 'draft',
                dueDate: new Date(dueDate),
                subtotal,
                taxRate: taxRate || 0,
                taxAmount: tax,
                discount: discount || 0,
                total,
                currency: currency || 'USD',
                notes: notes || '',
                notesAr: notesAr || '',
                createdBy: auth.session.user.id,
                items: {
                    create: invoiceItems.map((item, idx) => ({
                        description: item.description || '',
                        descriptionAr: item.descriptionAr || '',
                        quantity: item.quantity || 1,
                        rate: item.rate || 0,
                        amount: (item.quantity || 1) * (item.rate || 0),
                        sortOrder: item.sortOrder ?? idx,
                    })),
                },
            },
            include: {
                client: { select: { id: true, name: true, nameAr: true, avatar: true } },
                items: true,
                payments: true,
            },
        });

        await logAudit(auth.session.user.id, 'created', 'invoices', { id: invoice.id, number: invoice.number });
        return sendSuccess(invoice, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
