import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Mirror a card to another board
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { cardId, targetBoardId, targetListId } = await request.json();
        if (!cardId || !targetBoardId) return NextResponse.json({ error: 'cardId and targetBoardId required' }, { status: 400 });

        const source = await prisma.card.findUnique({
            where: { id: cardId },
            include: {
                assignees: true,
                taskPhases: { orderBy: { position: 'asc' } },
                list: { include: { board: { select: { id: true, name: true } } } },
            },
        });
        if (!source) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

        // Find target list
        let listId = targetListId;
        if (!listId) {
            const board = await prisma.board.findUnique({
                where: { id: targetBoardId },
                include: { lists: { orderBy: { position: 'asc' }, take: 1 } },
            });
            if (!board || board.lists.length === 0) {
                return NextResponse.json({ error: 'Target board has no lists' }, { status: 404 });
            }
            listId = board.lists[0].id;
        }

        // Create the mirrored card
        const mirrorCard = await prisma.card.create({
            data: {
                name: `🔗 ${source.name}`,
                description: `[مرآة من: ${source.list.board.name}]\n\n${source.description || ''}`,
                listId,
                dueDate: source.dueDate,
                priority: source.priority,
                status: source.status,
                currentPhase: source.currentPhase,
            },
        });

        // Create the mirror relation
        const mirrorGroupId = `mirror_${Date.now()}`;
        await prisma.cardMirror.create({
            data: {
                mirrorGroupId,
                sourceCardId: source.id,
                mirrorCardId: mirrorCard.id,
            },
        });

        // Copy assignees
        for (const a of source.assignees) {
            await prisma.cardAssignee.create({ data: { cardId: mirrorCard.id, userId: a.userId } }).catch(() => { });
        }

        // Copy task phases
        for (const tp of source.taskPhases) {
            await prisma.taskPhase.create({
                data: {
                    phase: tp.phase,
                    cardId: mirrorCard.id,
                    assigneeId: tp.assigneeId,
                    deadline: tp.deadline,
                    position: tp.position,
                    status: tp.status,
                },
            });
        }

        // Notify source card owner
        const userId = (session.user as any).id;
        await prisma.notification.create({
            data: {
                userId,
                title: `تم نسخ البطاقة`,
                body: `تم نسخ "${source.name}" إلى لوحة أخرى كبطاقة مرآة.`,
                type: 'STATUS_CHANGE',
            },
        }).catch(() => { });

        return NextResponse.json({ sourceCard: source.id, mirrorCard: mirrorCard.id, mirrorGroupId });
    } catch (error: any) {
        console.error('Mirror error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
