import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Parallel data fetching for performance
        const [
            clientCount,
            activeClients,
            marketingTasks,
            creativeRequests,
            productionJobs,
            publishingItems,
            recentActivity,
            users,
            invoices,
            timeEntries,
        ] = await Promise.all([
            prisma.client.count(),
            prisma.client.count({ where: { status: 'active' } }),
            prisma.marketingTask.groupBy({ by: ['status'], _count: true }),
            prisma.creativeRequest.groupBy({ by: ['status'], _count: true }),
            prisma.productionJob.groupBy({ by: ['status'], _count: true }),
            prisma.publishingItem.groupBy({ by: ['status'], _count: true }),
            prisma.activityLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { user: { include: { profile: true } } },
            }),
            prisma.user.count({ where: { status: 'active' } }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                where: { status: 'paid', paidAt: { gte: monthStart } },
            }),
            prisma.timeEntry.aggregate({
                _sum: { duration: true },
                where: { startTime: { gte: monthStart }, status: 'completed' },
            }),
        ]);

        // Calculate KPIs
        const toStatusMap = (groups: { status: string; _count: number }[]) =>
            Object.fromEntries(groups.map(g => [g.status, g._count]));

        const mtMap = toStatusMap(marketingTasks);
        const crMap = toStatusMap(creativeRequests);
        const pjMap = toStatusMap(productionJobs);
        const piMap = toStatusMap(publishingItems);

        const totalTasks = marketingTasks.reduce((s, g) => s + g._count, 0);
        const totalCreative = creativeRequests.reduce((s, g) => s + g._count, 0);
        const totalProduction = productionJobs.reduce((s, g) => s + g._count, 0);
        const totalPublishing = publishingItems.reduce((s, g) => s + g._count, 0);

        return NextResponse.json({
            kpis: {
                totalClients: clientCount,
                activeClients,
                activeTeamMembers: users,
                monthlyRevenue: invoices._sum.total || 0,
                monthlyHours: Math.round((timeEntries._sum.duration || 0) / 60),
            },
            boards: {
                marketing: { total: totalTasks, ...mtMap },
                creative: { total: totalCreative, ...crMap },
                production: { total: totalProduction, ...pjMap },
                publishing: { total: totalPublishing, ...piMap },
            },
            recentActivity: recentActivity.map(a => ({
                id: a.id,
                action: a.action,
                entityType: a.entityType,
                entityId: a.entityId,
                details: a.details,
                user: a.user?.profile?.fullName || a.user?.profile?.fullNameAr || 'System',
                createdAt: a.createdAt,
            })),
        });
    } catch (error: any) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
