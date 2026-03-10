import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single invoice with items and payments
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, nameAr: true, avatar: true, sector: true } },
                items: { orderBy: { sortOrder: 'asc' } },
                payments: { orderBy: { paidAt: 'desc' } },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found', error_ar: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        return sendSuccess(invoice);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update invoice
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { status, dueDate, taxRate, discount, currency, notes, notesAr, items } = body;

        const existing = await prisma.invoice.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Invoice not found', error_ar: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        // Build update data
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (currency !== undefined) updateData.currency = currency;
        if (notes !== undefined) updateData.notes = notes;
        if (notesAr !== undefined) updateData.notesAr = notesAr;

        // If status changed to 'sent', set sentAt
        if (status === 'sent' && existing.status !== 'sent') {
            updateData.sentAt = new Date();
        }

        // Recalculate if items are provided
        if (items !== undefined) {
            // Delete old items and recreate
            await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

            const invoiceItems = (items || []) as Array<{ description: string; descriptionAr?: string; quantity: number; rate: number; sortOrder?: number }>;
            const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity || 1) * (item.rate || 0), 0);
            const rate = taxRate !== undefined ? taxRate : existing.taxRate;
            const disc = discount !== undefined ? discount : existing.discount;
            const tax = rate ? subtotal * (rate / 100) : 0;
            const total = subtotal + tax - (disc || 0);

            updateData.subtotal = subtotal;
            updateData.taxRate = rate;
            updateData.taxAmount = tax;
            updateData.discount = disc;
            updateData.total = total;

            await prisma.invoiceItem.createMany({
                data: invoiceItems.map((item, idx) => ({
                    invoiceId: id,
                    description: item.description || '',
                    descriptionAr: item.descriptionAr || '',
                    quantity: item.quantity || 1,
                    rate: item.rate || 0,
                    amount: (item.quantity || 1) * (item.rate || 0),
                    sortOrder: item.sortOrder ?? idx,
                })),
            });
        } else {
            // Recalculate totals if tax/discount changed
            if (taxRate !== undefined || discount !== undefined) {
                const rate = taxRate !== undefined ? taxRate : existing.taxRate;
                const disc = discount !== undefined ? discount : existing.discount;
                const tax = rate ? existing.subtotal * (rate / 100) : 0;
                updateData.taxRate = rate;
                updateData.taxAmount = tax;
                updateData.discount = disc;
                updateData.total = existing.subtotal + tax - (disc || 0);
            }
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: updateData,
            include: {
                client: { select: { id: true, name: true, nameAr: true, avatar: true } },
                items: { orderBy: { sortOrder: 'asc' } },
                payments: { orderBy: { paidAt: 'desc' } },
            },
        });

        await logAudit(auth.session.user.id, 'updated', 'invoices', { id, number: invoice.number });
        return sendSuccess(invoice);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete invoice (only drafts)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const existing = await prisma.invoice.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Invoice not found', error_ar: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        if (existing.status !== 'draft') {
            return NextResponse.json(
                { error: 'Only draft invoices can be deleted', error_ar: 'يمكن حذف المسودات فقط' },
                { status: 400 }
            );
        }

        await prisma.invoice.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'invoices', { id, number: existing.number });
        return sendSuccess({ success: true, id });
    } catch (error) {
        return errorToResponse(error);
    }
}
