import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/notifications
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return NextResponse.json(notifications);
}

// PUT /api/notifications — mark as read
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { ids } = await request.json();

    if (ids && ids.length > 0) {
        await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
    } else {
        await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    }

    return NextResponse.json({ success: true });
}
