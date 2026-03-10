import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';

// GET — Analytics data with period-based filtering
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'month'; // week, month, quarter, year
        const clientId = searchParams.get('clientId') || undefined;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week': {
                const day = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - day);
                startDate.setHours(0, 0, 0, 0);
                break;
            }
            case 'month': {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            }
            case 'quarter': {
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            }
            case 'year': {
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            }
            default: {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }
        }

        // Override with custom dates if provided
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');
        if (customStart) startDate = new Date(customStart);
        const endDate = customEnd ? new Date(customEnd) : now;

        // Parallel data fetching
        const [
            // Revenue
            paidInvoices,
            allInvoicesInPeriod,
            // Clients
            activeClients,
            totalClients,
            // Tasks by board
            marketingTasks,
            creativeRequests,
            productionJobs,
            publishingItems,
            // All marketing tasks for period
            marketingInPeriod,
            creativeInPeriod,
            productionInPeriod,
            publishingInPeriod,
            // Time entries
            timeEntriesInPeriod,
            // Team
            activeUsers,
            // Expenses
            expensesInPeriod,
        ] = await Promise.all([
            // Revenue: paid invoices in period
            prisma.invoice.findMany({
                where: {
                    status: 'paid',
                    paidAt: { gte: startDate, lte: endDate },
                    ...(clientId ? { clientId } : {}),
                },
                select: { total: true, paidAt: true, clientId: true },
            }),
            // All invoices in period
            prisma.invoice.findMany({
                where: {
                    issueDate: { gte: startDate, lte: endDate },
                    ...(clientId ? { clientId } : {}),
                },
                select: { id: true, status: true, total: true, clientId: true },
            }),
            // Active clients
            prisma.client.count({ where: { status: 'active' } }),
            prisma.client.count(),
            // Task counts by status
            prisma.marketingTask.groupBy({ by: ['status'], _count: true }),
            prisma.creativeRequest.groupBy({ by: ['status'], _count: true }),
            prisma.productionJob.groupBy({ by: ['status'], _count: true }),
            prisma.publishingItem.groupBy({ by: ['status'], _count: true }),
            // Tasks in period
            prisma.marketingTask.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                    ...(clientId ? { clientId } : {}),
                },
                select: {
                    id: true, status: true, priority: true, assigneeId: true,
                    dueDate: true, completedAt: true, createdAt: true,
                },
            }),
            prisma.creativeRequest.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                    ...(clientId ? { clientId } : {}),
                },
                select: {
                    id: true, status: true, priority: true, category: true,
                    reviewRound: true, conceptApproved: true, finalApproved: true,
                    executorId: true, conceptWriterId: true, dueDate: true,
                    createdAt: true, updatedAt: true,
                },
            }),
            prisma.productionJob.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                    ...(clientId ? { clientId } : {}),
                },
                select: {
                    id: true, status: true, priority: true, jobType: true,
                    assigneeId: true, dueDate: true, createdAt: true, updatedAt: true,
                },
            }),
            prisma.publishingItem.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                    ...(clientId ? { clientId } : {}),
                },
                select: {
                    id: true, status: true, platform: true,
                    scheduledAt: true, publishedAt: true, reviewerId: true,
                    createdAt: true,
                },
            }),
            // Time entries in period
            prisma.timeEntry.findMany({
                where: {
                    startTime: { gte: startDate, lte: endDate },
                    status: { in: ['completed', 'edited'] },
                },
                select: {
                    userId: true, duration: true, billable: true,
                    clientId: true, taskType: true, startTime: true,
                },
            }),
            // Active team members
            prisma.user.findMany({
                where: { status: 'active' },
                select: {
                    id: true,
                    profile: { select: { fullName: true, fullNameAr: true, avatar: true } },
                },
            }),
            // Expenses in period
            prisma.expense.findMany({
                where: {
                    date: { gte: startDate, lte: endDate },
                    status: 'approved',
                },
                select: { amount: true, category: true },
            }),
        ]);

        // ─── Calculate KPIs ───

        const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);
        const totalExpenses = expensesInPeriod.reduce((s, e) => s + e.amount, 0);
        const totalHoursMinutes = timeEntriesInPeriod.reduce((s, t) => s + t.duration, 0);
        const totalHours = Math.round(totalHoursMinutes / 60 * 100) / 100;

        // Conversion rate: paid / total invoices
        const paidCount = allInvoicesInPeriod.filter(i => i.status === 'paid').length;
        const conversionRate = allInvoicesInPeriod.length > 0
            ? Math.round((paidCount / allInvoicesInPeriod.length) * 100)
            : 0;

        // Average completion time (marketing tasks with completedAt)
        const completedMarketingTasks = marketingInPeriod.filter(t => t.completedAt);
        const avgCompletionDays = completedMarketingTasks.length > 0
            ? Math.round(
                completedMarketingTasks.reduce((sum, t) => {
                    const diff = (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + diff;
                }, 0) / completedMarketingTasks.length
            )
            : 0;

        // On-time rate: tasks completed before or on due date
        const tasksWithDueDate = [
            ...marketingInPeriod.filter(t => t.dueDate && t.completedAt),
        ];
        const onTimeTasks = tasksWithDueDate.filter(t => t.completedAt! <= t.dueDate!);
        const onTimeRate = tasksWithDueDate.length > 0
            ? Math.round((onTimeTasks.length / tasksWithDueDate.length) * 100)
            : 100;

        const kpis = {
            totalRevenue,
            activeClients,
            conversionRate,
            avgCompletionDays,
            totalHours,
            onTimeRate,
            totalExpenses,
            netIncome: totalRevenue - totalExpenses,
        };

        // ─── Board Stats ───

        const statusCount = (groups: { status: string; _count: number }[]) =>
            Object.fromEntries(groups.map(g => [g.status, g._count]));

        const boardStats = {
            marketing: {
                total: marketingTasks.reduce((s, g) => s + g._count, 0),
                inPeriod: marketingInPeriod.length,
                statuses: statusCount(marketingTasks),
                completedInPeriod: marketingInPeriod.filter(t => t.status === 'completed').length,
                byPriority: {
                    high: marketingInPeriod.filter(t => t.priority === 'high').length,
                    medium: marketingInPeriod.filter(t => t.priority === 'medium').length,
                    low: marketingInPeriod.filter(t => t.priority === 'low').length,
                },
            },
            creative: {
                total: creativeRequests.reduce((s, g) => s + g._count, 0),
                inPeriod: creativeInPeriod.length,
                statuses: statusCount(creativeRequests),
                approvalRate: creativeInPeriod.length > 0
                    ? Math.round(
                        (creativeInPeriod.filter(r => r.finalApproved).length /
                            creativeInPeriod.length) * 100
                    )
                    : 0,
                avgRevisionRounds: creativeInPeriod.length > 0
                    ? Math.round(
                        creativeInPeriod.reduce((s, r) => s + r.reviewRound, 0) /
                        creativeInPeriod.length * 10
                    ) / 10
                    : 0,
                byCategory: creativeInPeriod.reduce((acc, r) => {
                    acc[r.category] = (acc[r.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
            },
            production: {
                total: productionJobs.reduce((s, g) => s + g._count, 0),
                inPeriod: productionInPeriod.length,
                statuses: statusCount(productionJobs),
                completedInPeriod: productionInPeriod.filter(j => j.status === 'completed').length,
                byJobType: productionInPeriod.reduce((acc, j) => {
                    acc[j.jobType] = (acc[j.jobType] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                onTimeDelivery: (() => {
                    const withDue = productionInPeriod.filter(j => j.dueDate);
                    const overdue = withDue.filter(j => {
                        if (j.status === 'completed') return j.updatedAt > j.dueDate!;
                        return new Date() > j.dueDate!;
                    });
                    return withDue.length > 0
                        ? Math.round(((withDue.length - overdue.length) / withDue.length) * 100)
                        : 100;
                })(),
            },
            publishing: {
                total: publishingItems.reduce((s, g) => s + g._count, 0),
                inPeriod: publishingInPeriod.length,
                statuses: statusCount(publishingItems),
                publishedInPeriod: publishingInPeriod.filter(p => p.status === 'published').length,
                byPlatform: publishingInPeriod.reduce((acc, p) => {
                    const platform = p.platform || 'other';
                    acc[platform] = (acc[platform] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                schedulingAccuracy: (() => {
                    const scheduled = publishingInPeriod.filter(p => p.scheduledAt && p.publishedAt);
                    if (scheduled.length === 0) return 100;
                    const onTime = scheduled.filter(p => {
                        const diff = Math.abs(p.publishedAt!.getTime() - p.scheduledAt!.getTime());
                        return diff < 24 * 60 * 60 * 1000; // Within 24 hours
                    });
                    return Math.round((onTime.length / scheduled.length) * 100);
                })(),
            },
        };

        // ─── Revenue by Month ───

        const revenueByMonth: Record<string, number> = {};
        for (const inv of paidInvoices) {
            if (inv.paidAt) {
                const month = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, '0')}`;
                revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.total;
            }
        }

        // ─── Revenue by Client (top 10) ───

        const revenueByClientMap: Record<string, number> = {};
        for (const inv of paidInvoices) {
            revenueByClientMap[inv.clientId] = (revenueByClientMap[inv.clientId] || 0) + inv.total;
        }

        const clientRevenueIds = Object.keys(revenueByClientMap);
        const clientNames = clientRevenueIds.length > 0
            ? await prisma.client.findMany({
                where: { id: { in: clientRevenueIds } },
                select: { id: true, name: true, nameAr: true },
            })
            : [];

        const clientNameLookup: Record<string, { name: string; nameAr: string }> = {};
        for (const c of clientNames) {
            clientNameLookup[c.id] = { name: c.name, nameAr: c.nameAr };
        }

        const revenueByClient = Object.entries(revenueByClientMap)
            .map(([cId, total]) => ({
                clientId: cId,
                clientName: clientNameLookup[cId]?.name || 'Unknown',
                clientNameAr: clientNameLookup[cId]?.nameAr || '',
                total,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // ─── Team Stats ───

        // Aggregate per user: tasks completed, hours logged
        const userTaskCounts: Record<string, { completed: number; total: number }> = {};
        for (const t of marketingInPeriod) {
            if (t.assigneeId) {
                if (!userTaskCounts[t.assigneeId]) userTaskCounts[t.assigneeId] = { completed: 0, total: 0 };
                userTaskCounts[t.assigneeId].total += 1;
                if (t.status === 'completed') userTaskCounts[t.assigneeId].completed += 1;
            }
        }
        for (const r of creativeInPeriod) {
            const uid = r.executorId || r.conceptWriterId;
            if (uid) {
                if (!userTaskCounts[uid]) userTaskCounts[uid] = { completed: 0, total: 0 };
                userTaskCounts[uid].total += 1;
                if (r.finalApproved) userTaskCounts[uid].completed += 1;
            }
        }
        for (const j of productionInPeriod) {
            if (j.assigneeId) {
                if (!userTaskCounts[j.assigneeId]) userTaskCounts[j.assigneeId] = { completed: 0, total: 0 };
                userTaskCounts[j.assigneeId].total += 1;
                if (j.status === 'completed') userTaskCounts[j.assigneeId].completed += 1;
            }
        }

        const userHoursMap: Record<string, number> = {};
        for (const t of timeEntriesInPeriod) {
            userHoursMap[t.userId] = (userHoursMap[t.userId] || 0) + t.duration;
        }

        // Standard work hours in period (8h/day * work days)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const workDays = Math.ceil(daysDiff * 5 / 7); // Approximate
        const standardMinutes = workDays * 8 * 60;

        const teamStats = activeUsers.map(u => {
            const tasks = userTaskCounts[u.id] || { completed: 0, total: 0 };
            const minutes = userHoursMap[u.id] || 0;
            const utilization = standardMinutes > 0
                ? Math.min(Math.round((minutes / standardMinutes) * 100), 100)
                : 0;
            const onTime = tasks.total > 0
                ? Math.round((tasks.completed / tasks.total) * 100)
                : 100;

            return {
                userId: u.id,
                name: u.profile?.fullName || 'Unknown',
                nameAr: u.profile?.fullNameAr || '',
                avatar: u.profile?.avatar || '',
                tasksCompleted: tasks.completed,
                tasksTotal: tasks.total,
                hoursLogged: Math.round(minutes / 60 * 100) / 100,
                utilization,
                onTimeRate: onTime,
            };
        }).sort((a, b) => b.tasksCompleted - a.tasksCompleted);

        // ─── Tasks Distribution ───

        const allTasksInPeriod =
            marketingInPeriod.length +
            creativeInPeriod.length +
            productionInPeriod.length +
            publishingInPeriod.length;

        const tasksDistribution = {
            marketing: {
                count: marketingInPeriod.length,
                percentage: allTasksInPeriod > 0 ? Math.round((marketingInPeriod.length / allTasksInPeriod) * 100) : 0,
            },
            creative: {
                count: creativeInPeriod.length,
                percentage: allTasksInPeriod > 0 ? Math.round((creativeInPeriod.length / allTasksInPeriod) * 100) : 0,
            },
            production: {
                count: productionInPeriod.length,
                percentage: allTasksInPeriod > 0 ? Math.round((productionInPeriod.length / allTasksInPeriod) * 100) : 0,
            },
            publishing: {
                count: publishingInPeriod.length,
                percentage: allTasksInPeriod > 0 ? Math.round((publishingInPeriod.length / allTasksInPeriod) * 100) : 0,
            },
        };

        return NextResponse.json({
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            kpis,
            boardStats,
            revenueByMonth,
            revenueByClient,
            tasksDistribution,
            teamStats,
        });
    } catch (error) {
        return errorToResponse(error);
    }
}
