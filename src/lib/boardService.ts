/* ══════════════════════════════════════════════════════════
   Remark PM — Board Service Layer
   Database-backed service for all 4 boards, replacing
   localStorage stores. Each function maps to a Prisma query.
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';
import { eventBus } from '@/lib/eventBus';

// ─── Types ───

export interface PaginationParams {
    take?: number;
    skip?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
}

export interface BoardFilters {
    clientId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    campaignId?: string;
    search?: string;
}

// ─── Marketing Board Service ───

export const marketingService = {
    async list(filters: BoardFilters = {}, pagination: PaginationParams = {}) {
        const { take = 50, skip = 0, orderBy = 'createdAt', orderDir = 'desc' } = pagination;
        const where = buildBoardWhere(filters, ['title', 'titleAr', 'description']);

        const [items, total] = await Promise.all([
            prisma.marketingTask.findMany({
                where,
                include: { client: true, campaign: true, assignee: { include: { profile: true } } },
                orderBy: { [orderBy]: orderDir },
                take, skip,
            }),
            prisma.marketingTask.count({ where }),
        ]);
        return { data: items, total };
    },

    async getById(id: string) {
        return prisma.marketingTask.findUniqueOrThrow({
            where: { id },
            include: { client: true, campaign: true, assignee: { include: { profile: true } } },
        });
    },

    async create(data: any, userId: string) {
        const item = await prisma.marketingTask.create({
            data: {
                title: data.title,
                titleAr: data.titleAr || '',
                description: data.description || '',
                clientId: data.clientId,
                campaignId: data.campaignId || null,
                priority: data.priority || 'medium',
                assigneeId: data.assigneeId || null,
                platform: data.platform || '',
                contentType: data.contentType || '',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            },
            include: { client: true },
        });
        await logActivity(userId, item.clientId, 'marketing_task', item.id, 'created', { title: item.title });
        eventBus.emit('marketing:created', { task: item, userId });
        return item;
    },

    async updateStatus(id: string, newStatus: string, userId: string) {
        const old = await prisma.marketingTask.findUniqueOrThrow({ where: { id } });
        const updated = await prisma.marketingTask.update({
            where: { id },
            data: {
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date() : old.completedAt,
            },
            include: { client: true },
        });
        await logActivity(userId, updated.clientId, 'marketing_task', id, 'status_changed', {
            from: old.status, to: newStatus,
        });
        eventBus.emit('marketing:status_changed', { task: updated, oldStatus: old.status, userId });
        return updated;
    },

    async update(id: string, data: any, userId: string) {
        const updated = await prisma.marketingTask.update({
            where: { id },
            data,
            include: { client: true, campaign: true },
        });
        await logActivity(userId, updated.clientId, 'marketing_task', id, 'updated', { fields: Object.keys(data) });
        return updated;
    },

    async delete(id: string, userId: string) {
        const item = await prisma.marketingTask.delete({ where: { id } });
        await logActivity(userId, item.clientId, 'marketing_task', id, 'deleted', { title: item.title });
        return item;
    },

    async getByClient(clientId: string) {
        return prisma.marketingTask.findMany({
            where: { clientId },
            include: { campaign: true },
            orderBy: { createdAt: 'desc' },
        });
    },
};

// ─── Creative Board Service ───

export const creativeService = {
    async list(filters: BoardFilters = {}, pagination: PaginationParams = {}) {
        const { take = 50, skip = 0, orderBy = 'createdAt', orderDir = 'desc' } = pagination;
        const where = buildBoardWhere(filters, ['title', 'titleAr', 'brief']);

        const [items, total] = await Promise.all([
            prisma.creativeRequest.findMany({
                where,
                include: {
                    client: true, campaign: true,
                    conceptWriter: { include: { profile: true } },
                    executor: { include: { profile: true } },
                },
                orderBy: { [orderBy]: orderDir },
                take, skip,
            }),
            prisma.creativeRequest.count({ where }),
        ]);
        return { data: items, total };
    },

    async getById(id: string) {
        return prisma.creativeRequest.findUniqueOrThrow({
            where: { id },
            include: {
                client: true, campaign: true,
                conceptWriter: { include: { profile: true } },
                executor: { include: { profile: true } },
            },
        });
    },

    async create(data: any, userId: string) {
        const item = await prisma.creativeRequest.create({
            data: {
                title: data.title,
                titleAr: data.titleAr || '',
                category: data.category || 'social_post',
                brief: data.brief || '',
                clientId: data.clientId,
                campaignId: data.campaignId || null,
                priority: data.priority || 'medium',
                platform: data.platform || '',
                format: data.format || '',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                conceptWriterId: data.conceptWriterId || null,
                executorId: data.executorId || null,
                linkedMarketingTaskId: data.linkedMarketingTaskId || null,
            },
            include: { client: true },
        });
        await logActivity(userId, item.clientId, 'creative_request', item.id, 'created', { title: item.title });
        eventBus.emit('creative:created', { request: item, userId });
        return item;
    },

    async updateStatus(id: string, newStatus: string, userId: string) {
        const old = await prisma.creativeRequest.findUniqueOrThrow({ where: { id } });
        const updated = await prisma.creativeRequest.update({
            where: { id },
            data: { status: newStatus },
            include: { client: true },
        });
        await logActivity(userId, updated.clientId, 'creative_request', id, 'status_changed', {
            from: old.status, to: newStatus,
        });
        eventBus.emit('creative:status_changed', { request: updated, oldStatus: old.status, userId });
        return updated;
    },

    async approve(id: string, type: 'concept' | 'final', userId: string, notes?: string) {
        const field = type === 'concept' ? 'conceptApproved' : 'finalApproved';
        const updated = await prisma.creativeRequest.update({
            where: { id },
            data: { [field]: true },
            include: { client: true },
        });

        await prisma.approval.create({
            data: {
                entityType: type === 'concept' ? 'creative_concept' : 'creative_final',
                entityId: id,
                userId,
                decision: 'approved',
                notes: notes || '',
            },
        });

        await logActivity(userId, updated.clientId, 'creative_request', id, 'approved', { type });
        eventBus.emit('creative:approved', { request: updated, type, userId });
        return updated;
    },

    async assign(id: string, userId: string, role: 'conceptWriter' | 'executor', assignedBy: string) {
        const field = role === 'conceptWriter' ? 'conceptWriterId' : 'executorId';
        const updated = await prisma.creativeRequest.update({
            where: { id },
            data: { [field]: userId },
            include: { client: true },
        });
        await logActivity(assignedBy, updated.clientId, 'creative_request', id, 'assigned', { role, userId });
        eventBus.emit('creative:assigned', { request: updated, role, userId, assignedBy });
        return updated;
    },

    async update(id: string, data: any, userId: string) {
        const updated = await prisma.creativeRequest.update({
            where: { id },
            data,
            include: { client: true, campaign: true },
        });
        await logActivity(userId, updated.clientId, 'creative_request', id, 'updated', { fields: Object.keys(data) });
        return updated;
    },

    async delete(id: string, userId: string) {
        const item = await prisma.creativeRequest.delete({ where: { id } });
        await logActivity(userId, item.clientId, 'creative_request', id, 'deleted', { title: item.title });
        return item;
    },
};

// ─── Production Board Service ───

export const productionService = {
    async list(filters: BoardFilters = {}, pagination: PaginationParams = {}) {
        const { take = 50, skip = 0, orderBy = 'createdAt', orderDir = 'desc' } = pagination;
        const where = buildBoardWhere(filters, ['title', 'titleAr']);

        const [items, total] = await Promise.all([
            prisma.productionJob.findMany({
                where,
                include: { client: true, campaign: true, assignee: { include: { profile: true } } },
                orderBy: { [orderBy]: orderDir },
                take, skip,
            }),
            prisma.productionJob.count({ where }),
        ]);
        return { data: items, total };
    },

    async getById(id: string) {
        return prisma.productionJob.findUniqueOrThrow({
            where: { id },
            include: { client: true, campaign: true, assignee: { include: { profile: true } } },
        });
    },

    async create(data: any, userId: string) {
        const item = await prisma.productionJob.create({
            data: {
                title: data.title,
                titleAr: data.titleAr || '',
                jobType: data.jobType || 'video',
                clientId: data.clientId,
                campaignId: data.campaignId || null,
                priority: data.priority || 'medium',
                assigneeId: data.assigneeId || null,
                shootDate: data.shootDate ? new Date(data.shootDate) : null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                location: data.location || '',
                equipment: data.equipment ? JSON.stringify(data.equipment) : '[]',
                deliverables: data.deliverables ? JSON.stringify(data.deliverables) : '[]',
                linkedCreativeRequestId: data.linkedCreativeRequestId || null,
            },
            include: { client: true },
        });
        await logActivity(userId, item.clientId, 'production_job', item.id, 'created', { title: item.title });
        eventBus.emit('production:created', { job: item, userId });
        return item;
    },

    async updateStatus(id: string, newStatus: string, userId: string) {
        const old = await prisma.productionJob.findUniqueOrThrow({ where: { id } });
        const updated = await prisma.productionJob.update({
            where: { id },
            data: { status: newStatus },
            include: { client: true },
        });
        await logActivity(userId, updated.clientId, 'production_job', id, 'status_changed', {
            from: old.status, to: newStatus,
        });
        eventBus.emit('production:status_changed', { job: updated, oldStatus: old.status, userId });
        return updated;
    },

    async update(id: string, data: any, userId: string) {
        const updated = await prisma.productionJob.update({
            where: { id },
            data,
            include: { client: true, campaign: true },
        });
        await logActivity(userId, updated.clientId, 'production_job', id, 'updated', { fields: Object.keys(data) });
        return updated;
    },

    async delete(id: string, userId: string) {
        const item = await prisma.productionJob.delete({ where: { id } });
        await logActivity(userId, item.clientId, 'production_job', id, 'deleted', { title: item.title });
        return item;
    },
};

// ─── Publishing Board Service ───

export const publishingService = {
    async list(filters: BoardFilters = {}, pagination: PaginationParams = {}) {
        const { take = 50, skip = 0, orderBy = 'createdAt', orderDir = 'desc' } = pagination;
        const where = buildBoardWhere(filters, ['title', 'titleAr', 'content']);

        const [items, total] = await Promise.all([
            prisma.publishingItem.findMany({
                where,
                include: { client: true, campaign: true, reviewer: { include: { profile: true } } },
                orderBy: { [orderBy]: orderDir },
                take, skip,
            }),
            prisma.publishingItem.count({ where }),
        ]);
        return { data: items, total };
    },

    async getById(id: string) {
        return prisma.publishingItem.findUniqueOrThrow({
            where: { id },
            include: { client: true, campaign: true, reviewer: { include: { profile: true } } },
        });
    },

    async create(data: any, userId: string) {
        const item = await prisma.publishingItem.create({
            data: {
                title: data.title,
                titleAr: data.titleAr || '',
                platform: data.platform || '',
                clientId: data.clientId,
                campaignId: data.campaignId || null,
                content: data.content || '',
                mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : '[]',
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                reviewerId: data.reviewerId || null,
                linkedProductionJobId: data.linkedProductionJobId || null,
                linkedCreativeRequestId: data.linkedCreativeRequestId || null,
            },
            include: { client: true },
        });
        await logActivity(userId, item.clientId, 'publishing_item', item.id, 'created', { title: item.title });
        eventBus.emit('publishing:created', { item, userId });
        return item;
    },

    async updateStatus(id: string, newStatus: string, userId: string) {
        const old = await prisma.publishingItem.findUniqueOrThrow({ where: { id } });
        const data: any = { status: newStatus };
        if (newStatus === 'published') data.publishedAt = new Date();
        const updated = await prisma.publishingItem.update({
            where: { id },
            data,
            include: { client: true },
        });
        await logActivity(userId, updated.clientId, 'publishing_item', id, 'status_changed', {
            from: old.status, to: newStatus,
        });
        eventBus.emit('publishing:status_changed', { item: updated, oldStatus: old.status, userId });
        return updated;
    },

    async schedule(id: string, scheduledAt: Date, userId: string) {
        const updated = await prisma.publishingItem.update({
            where: { id },
            data: { scheduledAt, status: 'scheduled' },
            include: { client: true },
        });
        await logActivity(userId, updated.clientId, 'publishing_item', id, 'updated', { action: 'scheduled' });
        eventBus.emit('publishing:scheduled', { item: updated, userId });
        return updated;
    },

    async update(id: string, data: any, userId: string) {
        const updated = await prisma.publishingItem.update({
            where: { id },
            data,
            include: { client: true, campaign: true },
        });
        await logActivity(userId, updated.clientId, 'publishing_item', id, 'updated', { fields: Object.keys(data) });
        return updated;
    },

    async delete(id: string, userId: string) {
        const item = await prisma.publishingItem.delete({ where: { id } });
        await logActivity(userId, item.clientId, 'publishing_item', id, 'deleted', { title: item.title });
        return item;
    },
};

// ─── Client Service ───

export const clientService = {
    async list(filters: BoardFilters = {}, pagination: PaginationParams = {}) {
        const { take = 50, skip = 0 } = pagination;
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { nameAr: { contains: filters.search } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.client.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            marketingTasks: true,
                            creativeRequests: true,
                            productionJobs: true,
                            publishingItems: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take, skip,
            }),
            prisma.client.count({ where }),
        ]);
        return { data: items, total };
    },

    async getById(id: string) {
        return prisma.client.findUniqueOrThrow({
            where: { id },
            include: {
                campaigns: true,
                _count: {
                    select: {
                        marketingTasks: true,
                        creativeRequests: true,
                        productionJobs: true,
                        publishingItems: true,
                    },
                },
            },
        });
    },
};

// ─── Helpers ───

function buildBoardWhere(filters: BoardFilters, searchFields: string[]): any {
    const where: any = {};

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.campaignId) where.campaignId = filters.campaignId;

    if (filters.search && searchFields.length > 0) {
        where.OR = searchFields.map((field) => ({
            [field]: { contains: filters.search },
        }));
    }

    return where;
}

async function logActivity(
    userId: string,
    clientId: string | null,
    entityType: string,
    entityId: string,
    action: string,
    details: Record<string, any>
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                clientId: clientId || undefined,
                entityType,
                entityId,
                action,
                details: JSON.stringify(details),
            },
        });
    } catch {
        // Don't let activity logging failures break the main operation
        console.error('[Activity Log] Failed to log activity:', { entityType, entityId, action });
    }
}
