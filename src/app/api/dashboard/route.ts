import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const PHASE_LABELS: Record<string, string> = {
    CONTENT_WRITING: 'كتابة المحتوى',
    DESIGN: 'التصميم',
    PHOTOGRAPHY: 'التصوير',
    VIDEO_EDIT: 'المونتاج',
    CREATIVE_REVIEW: 'مراجعة الإبداع',
    CEO_REVIEW: 'مراجعة الإدارة',
    CLIENT_APPROVAL: 'موافقة العميل',
    PUBLISH: 'النشر',
};

const ROLE_PHASE_MAP: Record<string, string[]> = {
    CEO: ['CEO_REVIEW'],
    COO: [], // COO sees everything for oversight
    CREATIVE_MANAGER: ['CREATIVE_REVIEW', 'DESIGN'],
    PRODUCTION_MANAGER: ['PHOTOGRAPHY', 'VIDEO_EDIT'],
    MARKETING: ['PUBLISH', 'CONTENT_WRITING'],
    DESIGNER: ['DESIGN'],
    COPYWRITER: ['CONTENT_WRITING'],
    ACCOUNT_MANAGER: ['CLIENT_APPROVAL'],
};

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = (session.user as any).id;
        const userRole = (session.user as any).role || 'MEMBER';

        // Get workspace
        const wsMember = await prisma.workspaceMember.findFirst({ where: { userId } });
        const workspaceId = wsMember?.workspaceId;

        // Common data fetching
        const now = new Date();

        // Get assigned cards
        const assignedCards = await prisma.cardAssignee.findMany({
            where: { userId },
            include: {
                card: {
                    include: {
                        list: { include: { board: { select: { id: true, name: true, color: true } } } },
                        assignees: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
                        labels: { include: { label: true } },
                        taskPhases: {
                            include: { assignee: { select: { id: true, name: true, role: true } } },
                            orderBy: { position: 'asc' },
                        },
                        fieldValues: { include: { field: true } },
                        _count: { select: { comments: true, attachments: true } },
                    },
                },
            },
        });
        const myCards = assignedCards.map(a => a.card).filter(c => !c.closed);

        // Common stats
        const stats = {
            total: myCards.length,
            open: myCards.filter(c => c.status === 'OPEN').length,
            inProgress: myCards.filter(c => c.status === 'IN_PROGRESS').length,
            completed: myCards.filter(c => c.status === 'COMPLETED').length,
            overdue: myCards.filter(c => c.dueDate && new Date(c.dueDate) < now && !c.dueComplete).length,
        };

        // Boards
        const boards = workspaceId ? await prisma.board.findMany({
            where: { workspaceId, closed: false },
            include: {
                lists: {
                    include: {
                        _count: { select: { cards: true } },
                    },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { position: 'asc' },
        }) : [];

        // Notifications
        const notifications = await prisma.notification.findMany({
            where: { userId, read: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Briefs
        const briefs = await prisma.brief.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                createdBy: { select: { id: true, name: true } },
                cards: { select: { id: true, name: true, currentPhase: true, status: true } },
            },
        });

        // ---------- Role-specific data ----------

        let roleData: any = {};

        if (userRole === 'CEO') {
            const pendingReviews = await prisma.taskPhase.findMany({
                where: { phase: 'CEO_REVIEW', status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    card: {
                        include: {
                            list: { include: { board: { select: { id: true, name: true } } } },
                            assignees: { include: { user: { select: { id: true, name: true } } } },
                        },
                    },
                },
            });

            const allPhases = await prisma.taskPhase.findMany({
                where: { status: { not: 'SKIPPED' } },
            });
            const phaseDistribution = Object.keys(PHASE_LABELS).map(phase => ({
                phase,
                label: PHASE_LABELS[phase],
                pending: allPhases.filter(p => p.phase === phase && p.status === 'PENDING').length,
                inProgress: allPhases.filter(p => p.phase === phase && p.status === 'IN_PROGRESS').length,
                completed: allPhases.filter(p => p.phase === phase && p.status === 'COMPLETED').length,
            }));

            roleData = { pendingReviews, phaseDistribution };
        }

        if (userRole === 'COO') {
            const allActiveCards = await prisma.card.findMany({
                where: { closed: false, status: { not: 'COMPLETED' } },
                include: {
                    taskPhases: {
                        include: { assignee: { select: { id: true, name: true, role: true } } },
                        orderBy: { position: 'asc' },
                    },
                    list: { include: { board: { select: { id: true, name: true, color: true } } } },
                    assignees: { include: { user: { select: { id: true, name: true, role: true } } } },
                },
                orderBy: { dueDate: 'asc' },
            });

            const delayedTasks = allActiveCards.filter(c => {
                if (!c.dueDate) return false;
                return new Date(c.dueDate) < now && !c.dueComplete;
            });

            const blockedPhases = await prisma.taskPhase.findMany({
                where: { status: 'BLOCKED' },
                include: {
                    card: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true } },
                },
            });

            const teamMembers = await prisma.user.findMany({
                select: { id: true, name: true, role: true },
            });
            const teamUtilization = await Promise.all(teamMembers.map(async m => {
                const activePhases = await prisma.taskPhase.count({
                    where: { assigneeId: m.id, status: 'IN_PROGRESS' },
                });
                const completedToday = await prisma.taskPhase.count({
                    where: {
                        assigneeId: m.id,
                        status: 'COMPLETED',
                        completedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
                    },
                });
                return { ...m, activePhases, completedToday };
            }));

            roleData = { allActiveCards, delayedTasks, blockedPhases, teamUtilization };
        }

        if (userRole === 'MARKETING') {
            roleData = { briefs: briefs.filter(b => b.status === 'PENDING' || b.status === 'PROCESSED') };
        }

        if (userRole === 'PRODUCTION_MANAGER') {
            const productionPhases = await prisma.taskPhase.findMany({
                where: { phase: { in: ['PHOTOGRAPHY', 'VIDEO_EDIT'] }, status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    card: {
                        include: {
                            list: { include: { board: { select: { id: true, name: true } } } },
                        },
                    },
                    assignee: { select: { id: true, name: true } },
                },
                orderBy: { deadline: 'asc' },
            });

            roleData = { shootingSchedule: productionPhases.filter(p => p.phase === 'PHOTOGRAPHY'), editQueue: productionPhases.filter(p => p.phase === 'VIDEO_EDIT') };
        }

        if (userRole === 'CREATIVE_MANAGER') {
            const creativePhases = await prisma.taskPhase.findMany({
                where: { phase: { in: ['CREATIVE_REVIEW', 'DESIGN'] }, status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    card: { include: { list: { include: { board: { select: { id: true, name: true } } } } } },
                    assignee: { select: { id: true, name: true } },
                },
                orderBy: { deadline: 'asc' },
            });
            roleData = { creativePhases };
        }

        if (userRole === 'COPYWRITER') {
            const writingPhases = await prisma.taskPhase.findMany({
                where: { phase: 'CONTENT_WRITING', status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    card: { include: { list: { include: { board: { select: { id: true, name: true } } } } } },
                },
                orderBy: { deadline: 'asc' },
            });
            roleData = { writingPhases };
        }

        if (userRole === 'DESIGNER') {
            const designPhases = await prisma.taskPhase.findMany({
                where: { phase: 'DESIGN', status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    card: { include: { list: { include: { board: { select: { id: true, name: true } } } } } },
                },
                orderBy: { deadline: 'asc' },
            });
            roleData = { designPhases };
        }

        if (userRole === 'ACCOUNT_MANAGER') {
            const clientApprovals = await prisma.taskPhase.findMany({
                where: { phase: 'CLIENT_APPROVAL', status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    card: { include: { list: { include: { board: { select: { id: true, name: true } } } } } },
                },
                orderBy: { deadline: 'asc' },
            });
            roleData = { clientApprovals };
        }

        return NextResponse.json({
            user: { id: userId, role: userRole },
            stats,
            myCards,
            boards: boards.map(b => ({
                ...b,
                totalCards: b.lists.reduce((sum, l) => sum + l._count.cards, 0),
            })),
            notifications,
            briefs,
            roleData,
            phaseLabels: PHASE_LABELS,
        });
    } catch (error: any) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

