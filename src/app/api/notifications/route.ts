import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parsePagination, sendPaginated } from '@/lib/routeHandlers';
import { errorToResponse } from '@/lib/apiError';

// GET /api/notifications — list user's notifications
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const userId = auth.session.user.id;
        const { take, skip } = parsePagination(req.url);

        const [items, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            prisma.notification.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        return NextResponse.json({
            data: items,
            total,
            unreadCount,
            take,
            skip,
            hasMore: skip + take < total,
        });
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT /api/notifications — mark notifications as read (bulk)
export async function PUT(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const userId = auth.session.user.id;
        const body = await req.json().catch(() => ({}));
        const { ids } = body;

        if (ids && Array.isArray(ids) && ids.length > 0) {
            await prisma.notification.updateMany({
                where: { id: { in: ids }, userId },
                data: { isRead: true },
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorToResponse(error);
    }
}
