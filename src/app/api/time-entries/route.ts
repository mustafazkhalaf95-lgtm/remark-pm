import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess, sendPaginated, parsePagination } from '@/lib/routeHandlers';

// GET — List time entries with filters
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { take, skip } = parsePagination(req.url);
        const { searchParams } = new URL(req.url);

        const userId = searchParams.get('userId') || undefined;
        const clientId = searchParams.get('clientId') || undefined;
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const billable = searchParams.get('billable');
        const taskType = searchParams.get('taskType') || undefined;
        const status = searchParams.get('status') || undefined;

        const where: Record<string, any> = {};

        if (userId) where.userId = userId;
        if (clientId) where.clientId = clientId;
        if (taskType) where.taskType = taskType;
        if (status) where.status = status;
        if (billable === 'true') where.billable = true;
        if (billable === 'false') where.billable = false;

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate);
            if (endDate) where.startTime.lte = new Date(endDate);
        }

        const [items, total] = await Promise.all([
            prisma.timeEntry.findMany({
                where,
                include: {
                    user: {
                        include: {
                            profile: {
                                select: { fullName: true, fullNameAr: true, avatar: true },
                            },
                        },
                    },
                },
                orderBy: { startTime: 'desc' },
                take,
                skip,
            }),
            prisma.timeEntry.count({ where }),
        ]);

        // Compute summary for the filtered set
        const summaryAgg = await prisma.timeEntry.aggregate({
            where,
            _sum: { duration: true },
            _count: true,
        });

        const billableAgg = await prisma.timeEntry.aggregate({
            where: { ...where, billable: true },
            _sum: { duration: true },
        });

        const response = {
            data: items,
            total,
            take,
            skip,
            hasMore: skip + take < total,
            pages: Math.ceil(total / take),
            summary: {
                totalMinutes: summaryAgg._sum.duration || 0,
                totalHours: Math.round((summaryAgg._sum.duration || 0) / 60 * 100) / 100,
                billableMinutes: billableAgg._sum.duration || 0,
                billableHours: Math.round((billableAgg._sum.duration || 0) / 60 * 100) / 100,
                entryCount: summaryAgg._count,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create or start a time entry
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();

        const data: Record<string, any> = {
            userId: body.userId || auth.session.user.id,
            clientId: body.clientId || null,
            taskType: body.taskType || 'general',
            taskId: body.taskId || '',
            description: body.description || '',
            descriptionAr: body.descriptionAr || '',
            billable: body.billable !== undefined ? body.billable : true,
            rate: body.rate || 0,
            startTime: body.startTime ? new Date(body.startTime) : new Date(),
            status: 'running',
        };

        // If endTime provided, mark as completed and calculate duration
        if (body.endTime) {
            data.endTime = new Date(body.endTime);
            data.duration = Math.round(
                (data.endTime.getTime() - data.startTime.getTime()) / 60000
            );
            data.status = 'completed';
        }

        // Manual duration entry (no start/end timer)
        if (body.duration && !body.endTime) {
            data.duration = body.duration;
            data.endTime = new Date(data.startTime.getTime() + body.duration * 60000);
            data.status = 'completed';
        }

        const item = await prisma.timeEntry.create({
            data: data as any,
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true, fullNameAr: true, avatar: true },
                        },
                    },
                },
            },
        });

        await logAudit(auth.session.user.id, 'created', 'time_entry', {
            id: item.id,
            taskType: item.taskType,
            clientId: item.clientId,
        });

        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
