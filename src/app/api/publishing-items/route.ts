import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';
import { publishingItemCreateSchema } from '@/lib/validations';

// GET — List with pagination + filters
export async function GET(req: Request) {
    const auth = await requirePermission('publishing.view');
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['clientId', 'status', 'platform']);
        const search = new URL(req.url).searchParams.get('search') || undefined;

        const where = buildWhere(filters, ['title', 'titleAr', 'content'], search);
        const [items, total] = await Promise.all([
            prisma.publishingItem.findMany({
                where,
                include: {
                    client: true,
                    campaign: true,
                    reviewer: { include: { profile: true } },
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'title', 'status']),
                take,
                skip,
            }),
            prisma.publishingItem.count({ where }),
        ]);
        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create
export async function POST(req: Request) {
    const auth = await requirePermission('publishing.manage');
    if (auth.error) return auth.error;

    try {
        const data = await validateBody(req, publishingItemCreateSchema);
        const item = await prisma.publishingItem.create({
            data,
            include: {
                client: true,
                campaign: true,
            }
        });
        await logAudit(auth.session.user.id, 'created', 'publishing_items', { id: item.id, title: item.title });
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
