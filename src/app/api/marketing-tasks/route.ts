import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';
import { marketingTaskCreateSchema } from '@/lib/validations';

// GET — List with pagination + filters
export async function GET(req: Request) {
    const auth = await requirePermission('view:marketing');
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['clientId', 'status', 'priority', 'assignedTo', 'campaignId']);
        const search = new URL(req.url).searchParams.get('search') || undefined;

        const where = buildWhere(filters, ['title', 'titleAr', 'description'], search);
        const [items, total] = await Promise.all([
            prisma.marketingTask.findMany({
                where,
                include: {
                    client: true,
                    campaign: true,
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'title', 'priority', 'status']),
                take,
                skip,
            }),
            prisma.marketingTask.count({ where }),
        ]);
        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create
export async function POST(req: Request) {
    const auth = await requirePermission('manage:marketing');
    if (auth.error) return auth.error;

    try {
        const data = await validateBody(req, marketingTaskCreateSchema);
        const item = await prisma.marketingTask.create({
            data,
            include: {
                client: true,
                campaign: true,
            }
        });
        await logAudit(auth.session.user.id, 'created', 'marketing_tasks', { id: item.id, title: item.title });
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
