import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const rooms = await prisma.chatRoom.findMany({
            where: { isArchived: false },
            include: {
                members: { include: { user: { include: { profile: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                _count: { select: { messages: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return NextResponse.json({ items: rooms });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const room = await prisma.chatRoom.create({
            data: {
                name: body.name || '',
                nameAr: body.nameAr || '',
                type: body.type || 'department',
                departmentId: body.departmentId || null,
                clientId: body.clientId || null,
            },
        });
        // Add members if provided
        if (body.memberIds?.length) {
            await prisma.chatRoomMember.createMany({
                data: body.memberIds.map((uid: string) => ({ roomId: room.id, userId: uid })),
            });
        }
        return NextResponse.json(room, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
