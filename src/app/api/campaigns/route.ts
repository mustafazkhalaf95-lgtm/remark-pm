import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';
import { campaignCreateSchema } from '@/lib/validations';

// GET — List with pagination + filters
export async function GET(req: Request) {
    const auth = await requirePermission('view:clients');
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['clientId', 'status']);
        const search = new URL(req.url).searchParams.get('search') || undefined;

        const where = buildWhere(filters, ['name', 'nameAr', 'description'], search);
        const [items, total] = await Promise.all([
            prisma.campaign.findMany({
                where,
                include: {
                    client: true,
                    _count: {
                        select: {
                            marketingTasks: true,
                            creativeRequests: true,
                            productionJobs: true,
                            publishingItems: true,
                        }
                    }
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'name', 'status']),
                take,
                skip,
            }),
            prisma.campaign.count({ where }),
        ]);
        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create
export async function POST(req: Request) {
    const auth = await requirePermission('manage:clients');
    if (auth.error) return auth.error;

    try {
        const data = await validateBody(req, campaignCreateSchema);
        const item = await prisma.campaign.create({
            data,
            include: {
                client: true,
                _count: {
                    select: {
                        marketingTasks: true,
                        creativeRequests: true,
                        productionJobs: true,
                        publishingItems: true,
                    }
                }
            }
        });
        await logAudit(auth.session.user.id, 'created', 'campaigns', { id: item.id, name: item.name });
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
