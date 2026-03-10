import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';

// GET — List expenses with filters (category, status, clientId, taskType, taskId, dateRange)
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['category', 'status', 'clientId', 'taskType', 'taskId']);
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const where: Record<string, any> = buildWhere(filters, ['description', 'descriptionAr'], search);

        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        const [items, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'date', 'amount', 'category', 'status']),
                take,
                skip,
            }),
            prisma.expense.count({ where }),
        ]);

        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create expense (with optional task link)
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const { category, description, descriptionAr, amount, currency, date, receiptUrl, clientId, campaignId, taskType, taskId, status } = body;

        if (!category || !description || amount === undefined) {
            return NextResponse.json(
                { error: 'category, description, and amount are required', error_ar: 'الفئة والوصف والمبلغ مطلوبة' },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                category,
                description,
                descriptionAr: descriptionAr || '',
                amount,
                currency: currency || 'USD',
                date: date ? new Date(date) : new Date(),
                receiptUrl: receiptUrl || '',
                clientId: clientId || null,
                campaignId: campaignId || null,
                taskType: taskType || null,
                taskId: taskId || null,
                status: status || 'pending',
                createdBy: auth.session.user.id,
            },
        });

        await logAudit(auth.session.user.id, 'created', 'expenses', { id: expense.id, category, amount, taskType, taskId });
        return sendSuccess(expense, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
