import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/channels/[id]/messages
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const channelId = params.id;

    const messages = await prisma.chatMessage.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        take: 100,
        include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
            mentions: { include: { user: { select: { id: true, name: true } }, card: { select: { id: true, name: true } } } },
        },
    });

    // Mark as read
    await prisma.channelMember.updateMany({
        where: { channelId, userId },
        data: { lastRead: new Date() },
    });

    return NextResponse.json(messages);
}

// POST /api/channels/[id]/messages — send a message
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const channelId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    // Create message
    const message = await prisma.chatMessage.create({
        data: { content: content.trim(), channelId, userId },
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    // Parse @mentions
    const userMentionRegex = /@(\w+)/g;
    const cardMentionRegex = /#(\w+)/g;
    let match;

    // Find @user mentions
    while ((match = userMentionRegex.exec(content)) !== null) {
        const mentionName = match[1];
        const mentionedUser = await prisma.user.findFirst({ where: { name: { contains: mentionName } } });
        if (mentionedUser) {
            await prisma.mention.create({ data: { messageId: message.id, userId: mentionedUser.id, mentionType: 'USER' } });
            // Create notification
            await prisma.notification.create({
                data: { userId: mentionedUser.id, title: 'ذكرك شخص في المحادثة', body: `${session.user.name}: ${content.substring(0, 100)}`, type: 'MENTION', linkUrl: `/chat?channel=${channelId}` },
            });
        }
    }

    // Update channel timestamp
    await prisma.channel.update({ where: { id: channelId }, data: { updatedAt: new Date() } });

    return NextResponse.json(message, { status: 201 });
}
