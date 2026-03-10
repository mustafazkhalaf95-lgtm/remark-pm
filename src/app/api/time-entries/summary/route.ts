import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';

// GET — Time summary for a period (weekly/monthly)
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'week'; // week, month, quarter
        const userId = searchParams.get('userId') || undefined;
        const clientId = searchParams.get('clientId') || undefined;

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date;
        let endDate = new Date(now);

        switch (period) {
            case 'week': {
                const day = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - day); // Start of week (Sunday)
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
            default: {
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
            }
        }

        // Override with custom dates if provided
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');
        if (customStart) startDate = new Date(customStart);
        if (customEnd) endDate = new Date(customEnd);

        const baseWhere: Record<string, any> = {
            startTime: { gte: startDate, lte: endDate },
            status: { in: ['completed', 'edited'] },
        };

        if (userId) baseWhere.userId = userId;
        if (clientId) baseWhere.clientId = clientId;

        // Total hours
        const totalAgg = await prisma.timeEntry.aggregate({
            where: baseWhere,
            _sum: { duration: true },
            _count: true,
        });

        // Billable hours
        const billableAgg = await prisma.timeEntry.aggregate({
            where: { ...baseWhere, billable: true },
            _sum: { duration: true },
            _count: true,
        });

        // Non-billable hours
        const nonBillableAgg = await prisma.timeEntry.aggregate({
            where: { ...baseWhere, billable: false },
            _sum: { duration: true },
            _count: true,
        });

        // By client — get all entries and group manually (SQLite-friendly)
        const entriesByClient = await prisma.timeEntry.findMany({
            where: { ...baseWhere, clientId: { not: null } },
            select: { clientId: true, duration: true, billable: true },
        });

        const clientMap: Record<string, { totalMinutes: number; billableMinutes: number; entryCount: number }> = {};
        for (const entry of entriesByClient) {
            const cid = entry.clientId || 'unknown';
            if (!clientMap[cid]) clientMap[cid] = { totalMinutes: 0, billableMinutes: 0, entryCount: 0 };
            clientMap[cid].totalMinutes += entry.duration;
            if (entry.billable) clientMap[cid].billableMinutes += entry.duration;
            clientMap[cid].entryCount += 1;
        }

        // Fetch client names
        const clientIds = Object.keys(clientMap).filter(id => id !== 'unknown');
        const clients = clientIds.length > 0
            ? await prisma.client.findMany({
                where: { id: { in: clientIds } },
                select: { id: true, name: true, nameAr: true },
            })
            : [];

        const clientNameMap: Record<string, { name: string; nameAr: string }> = {};
        for (const c of clients) {
            clientNameMap[c.id] = { name: c.name, nameAr: c.nameAr };
        }

        const byClient = Object.entries(clientMap)
            .map(([id, data]) => ({
                clientId: id,
                clientName: clientNameMap[id]?.name || 'Unknown',
                clientNameAr: clientNameMap[id]?.nameAr || '',
                totalMinutes: data.totalMinutes,
                totalHours: Math.round(data.totalMinutes / 60 * 100) / 100,
                billableMinutes: data.billableMinutes,
                entryCount: data.entryCount,
            }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes);

        // By task type
        const entriesByType = await prisma.timeEntry.findMany({
            where: baseWhere,
            select: { taskType: true, duration: true, billable: true },
        });

        const typeMap: Record<string, { totalMinutes: number; billableMinutes: number; entryCount: number }> = {};
        for (const entry of entriesByType) {
            const tt = entry.taskType || 'general';
            if (!typeMap[tt]) typeMap[tt] = { totalMinutes: 0, billableMinutes: 0, entryCount: 0 };
            typeMap[tt].totalMinutes += entry.duration;
            if (entry.billable) typeMap[tt].billableMinutes += entry.duration;
            typeMap[tt].entryCount += 1;
        }

        const byTaskType = Object.entries(typeMap)
            .map(([taskType, data]) => ({
                taskType,
                totalMinutes: data.totalMinutes,
                totalHours: Math.round(data.totalMinutes / 60 * 100) / 100,
                billableMinutes: data.billableMinutes,
                entryCount: data.entryCount,
            }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes);

        // By day of the period
        const allEntries = await prisma.timeEntry.findMany({
            where: baseWhere,
            select: { startTime: true, duration: true, billable: true, clientId: true },
            orderBy: { startTime: 'asc' },
        });

        const dayMap: Record<string, { totalMinutes: number; billableMinutes: number; entryCount: number }> = {};
        for (const entry of allEntries) {
            const day = entry.startTime.toISOString().split('T')[0];
            if (!dayMap[day]) dayMap[day] = { totalMinutes: 0, billableMinutes: 0, entryCount: 0 };
            dayMap[day].totalMinutes += entry.duration;
            if (entry.billable) dayMap[day].billableMinutes += entry.duration;
            dayMap[day].entryCount += 1;
        }

        const byDay = Object.entries(dayMap)
            .map(([date, data]) => ({
                date,
                totalMinutes: data.totalMinutes,
                totalHours: Math.round(data.totalMinutes / 60 * 100) / 100,
                billableMinutes: data.billableMinutes,
                entryCount: data.entryCount,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate average daily hours
        const daysWithEntries = Object.keys(dayMap).length;
        const totalMinutes = totalAgg._sum.duration || 0;
        const avgDailyMinutes = daysWithEntries > 0 ? totalMinutes / daysWithEntries : 0;

        return NextResponse.json({
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalHours: Math.round(totalMinutes / 60 * 100) / 100,
            totalMinutes,
            billableHours: Math.round((billableAgg._sum.duration || 0) / 60 * 100) / 100,
            billableMinutes: billableAgg._sum.duration || 0,
            nonBillableHours: Math.round((nonBillableAgg._sum.duration || 0) / 60 * 100) / 100,
            nonBillableMinutes: nonBillableAgg._sum.duration || 0,
            entryCount: totalAgg._count,
            billableEntryCount: billableAgg._count,
            avgDailyHours: Math.round(avgDailyMinutes / 60 * 100) / 100,
            byClient,
            byTaskType,
            byDay,
        });
    } catch (error) {
        return errorToResponse(error);
    }
}
