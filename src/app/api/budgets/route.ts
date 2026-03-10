import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';

// GET — List budgets with calculated remaining + filters
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['status', 'clientId', 'period']);
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;

        const where = buildWhere(filters, ['name', 'nameAr'], search);

        const [items, total] = await Promise.all([
            prisma.budget.findMany({
                where,
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'name', 'allocated', 'spent', 'status']),
                take,
                skip,
            }),
            prisma.budget.count({ where }),
        ]);

        // Add calculated remaining to each budget
        const enriched = items.map((b) => ({
            ...b,
            remaining: b.allocated - b.spent,
            percentUsed: b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0,
        }));

        return sendPaginated(enriched, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create budget
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const { clientId, campaignId, name, nameAr, allocated, period, startDate, endDate } = body;

        if (!name || allocated === undefined) {
            return NextResponse.json(
                { error: 'name and allocated amount are required', error_ar: 'الاسم والمبلغ المخصص مطلوبان' },
                { status: 400 }
            );
        }

        const budget = await prisma.budget.create({
            data: {
                clientId: clientId || null,
                campaignId: campaignId || null,
                name,
                nameAr: nameAr || '',
                allocated: allocated || 0,
                spent: 0,
                period: period || 'monthly',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: 'active',
            },
        });

        const enriched = {
            ...budget,
            remaining: budget.allocated - budget.spent,
            percentUsed: budget.allocated > 0 ? Math.round((budget.spent / budget.allocated) * 100) : 0,
        };

        await logAudit(auth.session.user.id, 'created', 'budgets', { id: budget.id, name, allocated });
        return sendSuccess(enriched, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
