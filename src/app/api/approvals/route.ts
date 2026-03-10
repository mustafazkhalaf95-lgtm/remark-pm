import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess, sendPaginated, parsePagination, buildOrderBy } from '@/lib/routeHandlers';
import { approvalCreateSchema } from '@/lib/validations';

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
            prisma.approval.findMany({
                where,
                include: {
                    user: { include: { profile: true } }
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt']),
                take,
                skip,
            }),
            prisma.approval.count({ where }),
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
        const data = approvalCreateSchema.parse(body);

        // Check if user has approval authority for this entityType
        const entityTypeMap: Record<string, string> = {
            'creative_concept': 'concept_preliminary',
            'creative_final': 'concept_final',
            'production_review': 'export',
            'publishing': 'publishing',
        };

        const scope = entityTypeMap[data.entityType];
        if (scope) {
            const hasAuthority = await prisma.approvalAuthority.findFirst({
                where: {
                    userId: auth.session.user.id,
                    scope,
                }
            });

            if (!hasAuthority) {
                return NextResponse.json(
                    { error: 'User does not have approval authority for this type' },
                    { status: 403 }
                );
            }
        }

        const item = await prisma.approval.create({
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
            'approvals',
            { id: item.id, entityType: item.entityType, entityId: item.entityId, decision: item.decision }
        );
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
