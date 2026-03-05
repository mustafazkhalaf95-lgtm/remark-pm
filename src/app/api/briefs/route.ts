import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const briefs = await prisma.brief.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            createdBy: { select: { id: true, name: true, avatar: true, role: true } },
            cards: {
                include: {
                    taskPhases: { include: { assignee: { select: { id: true, name: true } } } },
                    list: { include: { board: { select: { id: true, name: true } } } },
                    assignees: { include: { user: { select: { id: true, name: true } } } },
                },
            },
        },
    });

    return NextResponse.json(briefs);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        const { title, content, clientBoard, contentType, publishDate } = await request.json();
        if (!title || !content || !clientBoard || !publishDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const brief = await prisma.brief.create({
            data: {
                title,
                content,
                clientBoard,
                contentType: contentType || 'VIDEO',
                publishDate: new Date(publishDate),
                createdById: userId,
            },
            include: { createdBy: { select: { id: true, name: true } } },
        });

        return NextResponse.json(brief);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
