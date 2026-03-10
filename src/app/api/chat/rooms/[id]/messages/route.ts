import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const take = parseInt(searchParams.get('take') || '50');
    const cursor = searchParams.get('cursor');

    try {
        const messages = await prisma.chatMessage.findMany({
            where: { roomId: id },
            include: {
                sender: { include: { profile: true } },
                replyTo: { include: { sender: { include: { profile: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        return NextResponse.json({ items: messages.reverse() });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        // Extract mentions from content
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(body.content)) !== null) {
            mentions.push(match[1]);
        }

        const message = await prisma.chatMessage.create({
            data: {
                roomId: id,
                senderId: body.senderId || (await prisma.user.findFirst())?.id || '',
                content: body.content || '',
                type: body.type || 'text',
                mentions: JSON.stringify(mentions),
                replyToId: body.replyToId || null,
                entityType: body.entityType || '',
                entityId: body.entityId || '',
            },
            include: {
                sender: { include: { profile: true } },
            },
        });

        // Update room timestamp
        await prisma.chatRoom.update({ where: { id }, data: { updatedAt: new Date() } });

        return NextResponse.json(message, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
