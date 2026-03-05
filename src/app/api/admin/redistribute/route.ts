import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST /api/admin/redistribute — Move cards from creative team to correct client boards
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const wm = await prisma.workspaceMember.findFirst({ where: { userId } });
    if (!wm) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const workspaceId = wm.workspaceId;

    // Get all boards with lists
    const boards = await prisma.board.findMany({
        where: { workspaceId },
        include: { lists: { orderBy: { position: 'asc' } } },
    });

    // Build board map (name → { id, lists })
    const boardMap: Record<string, { id: string; lists: { id: string; name: string; position: number }[] }> = {};
    boards.forEach(b => { boardMap[b.name.toLowerCase().trim()] = { id: b.id, lists: b.lists }; });

    // Find creative team board
    const creativeBoard = boards.find(b => b.name.toLowerCase().includes('creative team'));
    if (!creativeBoard) return NextResponse.json({ error: 'Creative team board not found' }, { status: 404 });

    // Client name mapping: creative team list names → client board names
    const clientMapping: Record<string, string> = {
        'الوردة': 'الوردة',
        'الشهيرة': 'الشهيرة',
        'كلفنك': 'كلفنك',
        'ريحانة السكني': 'ريحانة السكني',
        'زمزم': 'زمزم',
        'ريحانة بارك': 'ريحانة بارك',
        'ريحانة كروب': 'مجموعة ريحانة',
    };

    const results: any[] = [];

    for (const ctList of creativeBoard.lists) {
        const clientBoardName = clientMapping[ctList.name];
        if (!clientBoardName) continue; // Skip non-client lists (Briefes, my time, etc.)

        const targetBoard = boardMap[clientBoardName.toLowerCase().trim()];
        if (!targetBoard) {
            results.push({ list: ctList.name, status: 'SKIPPED', reason: `Board "${clientBoardName}" not found` });
            continue;
        }

        // Get cards in this creative team list
        const cards = await prisma.card.findMany({
            where: { listId: ctList.id, closed: false },
            include: {
                assignees: true,
                fieldValues: true,
                labels: true,
            },
        });

        if (cards.length === 0) {
            results.push({ list: ctList.name, status: 'EMPTY', cardsMoved: 0 });
            continue;
        }

        // Determine target list: "Creative" if available, else first list
        const creativeList = targetBoard.lists.find(l => l.name.toLowerCase() === 'creative')
            || targetBoard.lists.find(l => l.name.toLowerCase().includes('creative'))
            || targetBoard.lists[0];

        // Move cards to the target board's Creative list
        for (const card of cards) {
            await prisma.card.update({
                where: { id: card.id },
                data: { listId: creativeList.id },
            });
        }

        results.push({
            list: ctList.name,
            targetBoard: clientBoardName,
            targetList: creativeList.name,
            cardsMoved: cards.length,
            status: 'SUCCESS',
        });
    }

    // Also handle Briefes → move to respective client boards' Marketing list
    const briefesList = creativeBoard.lists.find(l => l.name.toLowerCase().includes('brief'));
    if (briefesList) {
        const briefCards = await prisma.card.findMany({
            where: { listId: briefesList.id, closed: false },
        });

        let briefsMoved = 0;
        for (const card of briefCards) {
            // Try to determine the client from card name
            let targetBoardName: string | null = null;
            for (const [key, value] of Object.entries(clientMapping)) {
                if (card.name.includes(key) || card.name.includes(value)) {
                    targetBoardName = value;
                    break;
                }
            }

            if (targetBoardName) {
                const tb = boardMap[targetBoardName.toLowerCase().trim()];
                if (tb) {
                    const marketingList = tb.lists.find(l => l.name.toLowerCase() === 'marketing') || tb.lists[0];
                    await prisma.card.update({
                        where: { id: card.id },
                        data: { listId: marketingList.id },
                    });
                    briefsMoved++;
                }
            }
        }

        results.push({ list: 'Briefes', status: 'PROCESSED', briefsMoved, totalBriefs: briefCards.length });
    }

    return NextResponse.json({
        success: true,
        results,
        summary: `Redistributed cards across ${results.filter(r => r.status === 'SUCCESS').length} client boards`,
    });
}
