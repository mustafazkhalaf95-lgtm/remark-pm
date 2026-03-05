import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Complete a phase and activate the next one
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { phaseId, action } = await request.json(); // action: 'complete', 'block', 'start'
        if (!phaseId || !action) return NextResponse.json({ error: 'Missing phaseId or action' }, { status: 400 });

        const phase = await prisma.taskPhase.findUnique({
            where: { id: phaseId },
            include: { card: true },
        });
        if (!phase) return NextResponse.json({ error: 'Phase not found' }, { status: 404 });

        if (action === 'start') {
            await prisma.taskPhase.update({
                where: { id: phaseId },
                data: { status: 'IN_PROGRESS', startedAt: new Date() },
            });
        } else if (action === 'complete') {
            // Mark current phase as complete
            await prisma.taskPhase.update({
                where: { id: phaseId },
                data: { status: 'COMPLETED', completedAt: new Date() },
            });

            // Find and activate the next phase
            const nextPhase = await prisma.taskPhase.findFirst({
                where: {
                    cardId: phase.cardId,
                    position: phase.position + 1,
                },
            });

            if (nextPhase) {
                await prisma.taskPhase.update({
                    where: { id: nextPhase.id },
                    data: { status: 'IN_PROGRESS', startedAt: new Date() },
                });

                // Update card's current phase
                await prisma.card.update({
                    where: { id: phase.cardId },
                    data: { currentPhase: nextPhase.phase },
                });

                // Notify the next assignee
                if (nextPhase.assigneeId) {
                    await prisma.notification.create({
                        data: {
                            userId: nextPhase.assigneeId,
                            title: `دورك الآن: ${phase.card.name}`,
                            body: `تم إكمال المرحلة السابقة وأصبحت مهمتك جاهزة للعمل عليها.`,
                            type: 'ASSIGNMENT',
                        },
                    });

                    // Auto-assign next phase user to the card
                    await prisma.cardAssignee.create({
                        data: { cardId: phase.cardId, userId: nextPhase.assigneeId },
                    }).catch(() => { });
                }
            } else {
                // All phases complete — mark card as completed
                await prisma.card.update({
                    where: { id: phase.cardId },
                    data: { status: 'COMPLETED', dueComplete: true, currentPhase: 'DONE' },
                });
            }
        } else if (action === 'block') {
            await prisma.taskPhase.update({
                where: { id: phaseId },
                data: { status: 'BLOCKED' },
            });

            // Notify COO about the block
            const coo = await prisma.user.findFirst({ where: { role: 'COO' } });
            if (coo) {
                await prisma.notification.create({
                    data: {
                        userId: coo.id,
                        title: `⚠️ مهمة متعثرة: ${phase.card.name}`,
                        body: `تم تعليق مرحلة "${phase.phase}" — تحتاج تدخل.`,
                        type: 'STATUS_CHANGE',
                    },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
