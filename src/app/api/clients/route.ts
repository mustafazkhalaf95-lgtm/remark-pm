import { NextResponse } from 'next/server';
import { requireAuth, requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess, sendPaginated, parsePagination, parseFilters, buildWhere, buildOrderBy } from '@/lib/routeHandlers';
import { clientCreateSchema, clientUpdateSchema } from '@/lib/validations';
import { provisionNewClient } from '@/lib/clientAutomation';

// GET — List with pagination + filters
export async function GET(req: Request) {
    const auth = await requirePermission('clients.view');
    if (auth.error) return auth.error;

    try {
        const { take, skip, orderBy, orderDir } = parsePagination(req.url);
        const filters = parseFilters(req.url, ['status', 'sector']);
        const search = new URL(req.url).searchParams.get('search') || undefined;

        const where = buildWhere(filters, ['name', 'nameAr'], search);
        const [items, total] = await Promise.all([
            prisma.client.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            campaigns: true,
                            marketingTasks: true,
                            creativeRequests: true,
                        }
                    }
                },
                orderBy: buildOrderBy(orderBy, orderDir, ['createdAt', 'name', 'status']),
                take,
                skip,
            }),
            prisma.client.count({ where }),
        ]);
        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create
export async function POST(req: Request) {
    const auth = await requirePermission('clients.manage');
    if (auth.error) return auth.error;

    try {
        const data = await validateBody(req, clientCreateSchema);
        const item = await prisma.client.create({
            data,
            include: {
                _count: {
                    select: {
                        campaigns: true,
                        marketingTasks: true,
                        creativeRequests: true,
                    }
                }
            }
        });
        await logAudit(auth.session.user.id, 'created', 'clients', { id: item.id, name: item.name });

        // Auto-provision linked resources for the new client
        await provisionNewClient({
            clientId: item.id,
            clientName: item.name,
            clientNameAr: item.nameAr,
            accountManagerId: (data as any).accountManagerId || undefined,
            createdByUserId: auth.session.user.id,
        });

        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
