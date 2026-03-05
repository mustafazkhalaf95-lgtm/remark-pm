import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST /api/automations/execute — Run automations for a card event
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { cardId, trigger, fieldName, fromValue, toValue, listId, fromListId } = await request.json();
        if (!cardId || !trigger) return NextResponse.json({ error: 'cardId and trigger required' }, { status: 400 });

        // Get card with full relations
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            include: {
                list: { include: { board: { include: { workspace: true } } } },
                assignees: { include: { user: true } },
                fieldValues: { include: { field: true } },
                taskPhases: { include: { assignee: true } },
            },
        });
        if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

        const workspaceId = card.list.board.workspaceId;

        // Get all enabled rules
        const rules = await prisma.automationRule.findMany({
            where: { workspaceId, enabled: true, trigger },
        });

        const executedActions: any[] = [];

        for (const rule of rules) {
            const config = JSON.parse(rule.triggerConfig || '{}');
            const actions = JSON.parse(rule.actions || '[]');

            // Check trigger conditions
            let shouldExecute = false;

            if (trigger === 'FIELD_CHANGE') {
                if (config.fieldName && config.fieldName !== fieldName) continue;
                if (config.toValue && config.toValue !== toValue) continue;
                if (config.fromValue && config.fromValue !== fromValue) continue;
                shouldExecute = true;
            } else if (trigger === 'CARD_MOVE') {
                if (config.toListId && config.toListId !== listId) continue;
                if (config.fromListId && config.fromListId !== fromListId) continue;
                shouldExecute = true;
            } else if (trigger === 'CARD_CREATE') {
                if (config.listId && config.listId !== listId) continue;
                shouldExecute = true;
            } else if (trigger === 'DUE_DATE') {
                shouldExecute = true;
            }

            if (!shouldExecute) continue;

            // Execute actions
            for (const action of actions) {
                try {
                    if (action.type === 'MIRROR') {
                        // Mirror card to target board
                        const targetBoard = await prisma.board.findUnique({
                            where: { id: action.boardId },
                            include: { lists: { orderBy: { position: 'asc' } } },
                        });
                        if (!targetBoard || targetBoard.lists.length === 0) continue;

                        // Find target list (specific or first)
                        const targetList = action.listName
                            ? targetBoard.lists.find(l => l.name === action.listName) || targetBoard.lists[0]
                            : targetBoard.lists[0];

                        // Check if already mirrored
                        const existingMirror = await prisma.cardMirror.findFirst({
                            where: { sourceCardId: cardId, mirrorCard: { listId: { in: targetBoard.lists.map(l => l.id) } } },
                        });
                        if (existingMirror) continue;

                        // Create mirror
                        const mirrorCard = await prisma.card.create({
                            data: {
                                name: card.name,
                                description: card.description,
                                listId: targetList.id,
                                position: 0,
                                status: card.status,
                                priority: card.priority,
                                dueDate: card.dueDate,
                                currentPhase: card.currentPhase,
                                mirrorGroupId: card.mirrorGroupId || card.id,
                            },
                        });

                        await prisma.cardMirror.create({
                            data: {
                                sourceCardId: cardId,
                                mirrorCardId: mirrorCard.id,
                                mirrorGroupId: card.mirrorGroupId || card.id,
                            },
                        });

                        // Copy assignees
                        for (const a of card.assignees) {
                            await prisma.cardAssignee.create({
                                data: { cardId: mirrorCard.id, userId: a.userId },
                            }).catch(() => { });
                        }

                        executedActions.push({ type: 'MIRROR', ruleId: rule.id, targetBoard: targetBoard.name, cardId: mirrorCard.id });

                    } else if (action.type === 'MOVE') {
                        // Move card to list
                        if (action.listId) {
                            await prisma.card.update({
                                where: { id: cardId },
                                data: { listId: action.listId },
                            });
                            executedActions.push({ type: 'MOVE', ruleId: rule.id, listId: action.listId });
                        }

                    } else if (action.type === 'ASSIGN') {
                        // Auto-assign user
                        if (action.userId) {
                            await prisma.cardAssignee.create({
                                data: { cardId, userId: action.userId },
                            }).catch(() => { });
                            executedActions.push({ type: 'ASSIGN', ruleId: rule.id, userId: action.userId });
                        }

                    } else if (action.type === 'NOTIFY') {
                        // Send notification
                        const targetUserId = action.userId || (session.user as any).id;
                        await prisma.notification.create({
                            data: {
                                title: action.title || `🤖 أتمتة: ${rule.name}`,
                                body: action.body || `تم تنفيذ أتمتة "${rule.name}" على البطاقة "${card.name}"`,
                                type: 'AUTOMATION',
                                userId: targetUserId,
                                linkUrl: `/board/${card.list.boardId}`,
                            },
                        });
                        executedActions.push({ type: 'NOTIFY', ruleId: rule.id });

                    } else if (action.type === 'SET_FIELD') {
                        // Set a custom field value
                        if (action.fieldId && action.value !== undefined) {
                            await prisma.cardFieldValue.upsert({
                                where: { cardId_fieldId: { cardId, fieldId: action.fieldId } },
                                create: { cardId, fieldId: action.fieldId, value: action.value },
                                update: { value: action.value },
                            });
                            executedActions.push({ type: 'SET_FIELD', ruleId: rule.id, fieldId: action.fieldId });
                        }

                    } else if (action.type === 'CREATE_PHASES') {
                        // Auto-create task phases based on content type
                        const phases = action.phases || [];
                        for (let i = 0; i < phases.length; i++) {
                            await prisma.taskPhase.create({
                                data: {
                                    cardId,
                                    phase: phases[i].phase,
                                    position: i,
                                    assigneeId: phases[i].assigneeId || null,
                                    deadline: phases[i].deadlineDays ? new Date(Date.now() + phases[i].deadlineDays * 86400000) : null,
                                },
                            }).catch(() => { });
                        }
                        executedActions.push({ type: 'CREATE_PHASES', ruleId: rule.id, phaseCount: phases.length });

                    } else if (action.type === 'ADVANCE_PHASE') {
                        // Auto-advance the current phase
                        const currentPhase = await prisma.taskPhase.findFirst({
                            where: { cardId, status: 'IN_PROGRESS' },
                        });
                        if (currentPhase) {
                            await prisma.taskPhase.update({
                                where: { id: currentPhase.id },
                                data: { status: 'COMPLETED', completedAt: new Date() },
                            });
                            // Start next phase
                            const nextPhase = await prisma.taskPhase.findFirst({
                                where: { cardId, status: 'PENDING', position: { gt: currentPhase.position } },
                                orderBy: { position: 'asc' },
                            });
                            if (nextPhase) {
                                await prisma.taskPhase.update({
                                    where: { id: nextPhase.id },
                                    data: { status: 'IN_PROGRESS', startedAt: new Date() },
                                });
                                await prisma.card.update({
                                    where: { id: cardId },
                                    data: { currentPhase: nextPhase.phase },
                                });
                            }
                            executedActions.push({ type: 'ADVANCE_PHASE', ruleId: rule.id });
                        }
                    }
                } catch (actionErr: any) {
                    executedActions.push({ type: action.type, ruleId: rule.id, error: actionErr.message });
                }
            }

            // Log activity
            await prisma.activityLog.create({
                data: {
                    action: 'AUTOMATION_EXECUTED',
                    entityType: 'AUTOMATION',
                    entityId: rule.id,
                    details: JSON.stringify({ trigger, actions: executedActions, cardName: card.name }),
                    userId: (session.user as any).id,
                    workspaceId,
                    boardId: card.list.boardId,
                    cardId,
                },
            });
        }

        return NextResponse.json({
            success: true,
            executedRules: executedActions.length,
            actions: executedActions,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
