import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Returns all tasks across boards with dates for timeline rendering
// Params: clientId, campaignId, startDate, endDate, board
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId') || undefined;
        const campaignId = searchParams.get('campaignId') || undefined;
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const board = searchParams.get('board') || undefined;

        // Build date filter
        const dateFilter: Record<string, any> = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        // Collect tasks from all boards
        const tasks: any[] = [];

        // Marketing Tasks
        if (!board || board === 'marketing') {
            const mWhere: Record<string, any> = {};
            if (clientId) mWhere.clientId = clientId;
            if (campaignId) mWhere.campaignId = campaignId;
            if (hasDateFilter) mWhere.dueDate = dateFilter;

            const marketingTasks = await prisma.marketingTask.findMany({
                where: mWhere,
                include: {
                    client: { select: { id: true, name: true, nameAr: true } },
                    campaign: { select: { id: true, name: true, nameAr: true } },
                    assignee: { select: { id: true, profile: { select: { fullName: true, fullNameAr: true } } } },
                },
                orderBy: { dueDate: 'asc' },
            });
            marketingTasks.forEach((t) => {
                tasks.push({
                    id: t.id,
                    board: 'marketing',
                    title: t.title,
                    titleAr: t.titleAr,
                    status: t.status,
                    priority: t.priority,
                    startDate: t.createdAt,
                    dueDate: t.dueDate,
                    completedAt: t.completedAt,
                    client: t.client,
                    campaign: t.campaign,
                    assignee: t.assignee
                        ? { id: t.assignee.id, name: t.assignee.profile?.fullName || '', nameAr: t.assignee.profile?.fullNameAr || '' }
                        : null,
                    color: '#6366f1',
                });
            });
        }

        // Creative Requests
        if (!board || board === 'creative') {
            const cWhere: Record<string, any> = {};
            if (clientId) cWhere.clientId = clientId;
            if (campaignId) cWhere.campaignId = campaignId;
            if (hasDateFilter) cWhere.dueDate = dateFilter;

            const creativeRequests = await prisma.creativeRequest.findMany({
                where: cWhere,
                include: {
                    client: { select: { id: true, name: true, nameAr: true } },
                    campaign: { select: { id: true, name: true, nameAr: true } },
                    executor: { select: { id: true, profile: { select: { fullName: true, fullNameAr: true } } } },
                },
                orderBy: { dueDate: 'asc' },
            });
            creativeRequests.forEach((t) => {
                tasks.push({
                    id: t.id,
                    board: 'creative',
                    title: t.title,
                    titleAr: t.titleAr,
                    status: t.status,
                    priority: t.priority,
                    startDate: t.createdAt,
                    dueDate: t.dueDate,
                    completedAt: t.finalApproved ? t.updatedAt : null,
                    client: t.client,
                    campaign: t.campaign,
                    assignee: t.executor
                        ? { id: t.executor.id, name: t.executor.profile?.fullName || '', nameAr: t.executor.profile?.fullNameAr || '' }
                        : null,
                    color: '#8b5cf6',
                });
            });
        }

        // Production Jobs
        if (!board || board === 'production') {
            const pWhere: Record<string, any> = {};
            if (clientId) pWhere.clientId = clientId;
            if (campaignId) pWhere.campaignId = campaignId;
            if (hasDateFilter) pWhere.dueDate = dateFilter;

            const productionJobs = await prisma.productionJob.findMany({
                where: pWhere,
                include: {
                    client: { select: { id: true, name: true, nameAr: true } },
                    campaign: { select: { id: true, name: true, nameAr: true } },
                    assignee: { select: { id: true, profile: { select: { fullName: true, fullNameAr: true } } } },
                },
                orderBy: { dueDate: 'asc' },
            });
            productionJobs.forEach((t) => {
                tasks.push({
                    id: t.id,
                    board: 'production',
                    title: t.title,
                    titleAr: t.titleAr,
                    status: t.status,
                    priority: t.priority,
                    startDate: t.shootDate || t.createdAt,
                    dueDate: t.dueDate,
                    completedAt: t.status === 'completed' ? t.updatedAt : null,
                    client: t.client,
                    campaign: t.campaign,
                    assignee: t.assignee
                        ? { id: t.assignee.id, name: t.assignee.profile?.fullName || '', nameAr: t.assignee.profile?.fullNameAr || '' }
                        : null,
                    color: '#f59e0b',
                });
            });
        }

        // Publishing Items
        if (!board || board === 'publishing') {
            const pubWhere: Record<string, any> = {};
            if (clientId) pubWhere.clientId = clientId;
            if (campaignId) pubWhere.campaignId = campaignId;
            if (hasDateFilter) pubWhere.scheduledAt = dateFilter;

            const publishingItems = await prisma.publishingItem.findMany({
                where: pubWhere,
                include: {
                    client: { select: { id: true, name: true, nameAr: true } },
                    campaign: { select: { id: true, name: true, nameAr: true } },
                    reviewer: { select: { id: true, profile: { select: { fullName: true, fullNameAr: true } } } },
                },
                orderBy: { scheduledAt: 'asc' },
            });
            publishingItems.forEach((t) => {
                tasks.push({
                    id: t.id,
                    board: 'publishing',
                    title: t.title,
                    titleAr: t.titleAr,
                    status: t.status,
                    priority: 'medium',
                    startDate: t.createdAt,
                    dueDate: t.scheduledAt,
                    completedAt: t.publishedAt,
                    client: t.client,
                    campaign: t.campaign,
                    assignee: t.reviewer
                        ? { id: t.reviewer.id, name: t.reviewer.profile?.fullName || '', nameAr: t.reviewer.profile?.fullNameAr || '' }
                        : null,
                    color: '#22c55e',
                });
            });
        }

        // Milestones
        const msWhere: Record<string, any> = {};
        if (clientId) msWhere.clientId = clientId;
        if (campaignId) msWhere.campaignId = campaignId;
        if (hasDateFilter) msWhere.dueDate = dateFilter;

        const milestones = await prisma.projectMilestone.findMany({
            where: msWhere,
            orderBy: { dueDate: 'asc' },
        });

        // Dependencies
        const dependencies = await prisma.taskDependency.findMany({});

        return sendSuccess({ tasks, milestones, dependencies });
    } catch (error) {
        return errorToResponse(error);
    }
}
