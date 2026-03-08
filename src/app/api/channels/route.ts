import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { channelCreateSchema, parseBody } from '@/lib/validations';

// GET /api/channels — list user's channels
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const channels = await prisma.channel.findMany({
        where: { members: { some: { userId } } },
        include: {
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { user: { select: { name: true } } } },
            _count: { select: { messages: true, members: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });

    // Unread count per channel
    const channelsWithUnread = await Promise.all(channels.map(async (ch) => {
        const membership = ch.members.find(m => m.user.id === userId);
        const unreadCount = membership ? await prisma.chatMessage.count({
            where: { channelId: ch.id, createdAt: { gt: membership.lastRead } },
        }) : 0;
        return { ...ch, unreadCount };
    }));

    return NextResponse.json(channelsWithUnread);
}

// POST /api/channels — create a channel
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await request.json();
    const parsed = parseBody(channelCreateSchema, body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, description, channelType, memberIds } = parsed.data;

    // find workspace
    const wm = await prisma.workspaceMember.findFirst({ where: { userId } });
    if (!wm) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const channel = await prisma.channel.create({
        data: {
            name, description, channelType: channelType || 'PUBLIC',
            workspaceId: wm.workspaceId,
            members: {
                create: [
                    { userId },
                    ...(memberIds || []).filter((id: string) => id !== userId).map((id: string) => ({ userId: id })),
                ],
            },
        },
        include: { members: { include: { user: { select: { id: true, name: true } } } } },
    });

    return NextResponse.json(channel, { status: 201 });
}
