import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';
import { commentCreateSchema } from '@/lib/validations';

// GET — List by entityType + entityId
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const url = new URL(req.url);
        const entityType = url.searchParams.get('entityType');
        const entityId = url.searchParams.get('entityId');

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: 'Missing required filters: entityType, entityId' },
                { status: 400 }
            );
        }

        const { take, skip, orderBy, orderDir } = parsePagination(req.url);

        const where = { entityType, entityId };
        const [items, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: {
                    user: { include: { profile: true } }
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt']),
                take,
                skip,
            }),
            prisma.comment.count({ where }),
        ]);
        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const data = commentCreateSchema.parse(body);

        const item = await prisma.comment.create({
            data: {
                ...data,
                userId: auth.session.user.id,
            },
            include: {
                user: { include: { profile: true } }
            }
        });

        await logAudit(
            auth.session.user.id,
            'created',
            'comments',
            { id: item.id, entityType: item.entityType, entityId: item.entityId }
        );
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
