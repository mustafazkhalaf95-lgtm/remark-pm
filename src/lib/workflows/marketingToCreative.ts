/* ══════════════════════════════════════════════════════════
   Workflow: Marketing → Creative
   Auto-creates creative requests when marketing tasks
   require visual content.
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';
import { eventBus } from '@/lib/eventBus';

// Content types that trigger creative request creation
const VISUAL_CONTENT_TYPES = [
    'visual_content', 'video_content', 'carousel', 'ad_campaign',
    'social_post', 'reel', 'story', 'design', 'graphic',
];

function mapContentTypeToCategory(contentType: string): string {
    const map: Record<string, string> = {
        visual_content: 'social_post',
        video_content: 'reel',
        carousel: 'story_set',
        ad_campaign: 'ad_creative',
        social_post: 'social_post',
        reel: 'reel',
        story: 'story_set',
        design: 'social_post',
        graphic: 'social_post',
    };
    return map[contentType] || 'social_post';
}

function mapMarketingStatusToCreative(status: string): string {
    const map: Record<string, string> = {
        pending: 'brief_ready',
        in_progress: 'concept_writing',
        review: 'concept_approval',
        approved: 'approved_ready',
        completed: 'approved_ready',
    };
    return map[status] || 'brief_ready';
}

/**
 * When a marketing task is created, auto-create a linked creative request
 * if the content type requires visual work.
 */
export async function onMarketingTaskCreated(taskId: string, userId?: string): Promise<void> {
    const task = await prisma.marketingTask.findUnique({
        where: { id: taskId },
        include: { client: true },
    });
    if (!task) return;

    const needsCreative = VISUAL_CONTENT_TYPES.some((t) =>
        task.contentType.toLowerCase().includes(t)
    );
    if (!needsCreative) return;

    const creativeRequest = await prisma.creativeRequest.create({
        data: {
            clientId: task.clientId,
            campaignId: task.campaignId,
            title: `تصميم: ${task.title}`,
            titleAr: `تصميم: ${task.titleAr || task.title}`,
            category: mapContentTypeToCategory(task.contentType),
            brief: task.description || task.title,
            status: 'brief_ready',
            priority: task.priority,
            platform: task.platform,
            dueDate: task.dueDate,
            linkedMarketingTaskId: taskId,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
        },
    });

    // Update marketing task with the link
    await prisma.marketingTask.update({
        where: { id: taskId },
        data: {
            linkedCreativeRequestId: creativeRequest.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
        },
    });

    // Log activity
    await prisma.activityLog.create({
        data: {
            userId,
            clientId: task.clientId,
            entityType: 'creative_request',
            entityId: creativeRequest.id,
            action: 'created',
            details: JSON.stringify({
                source: 'marketing_sync',
                linkedTaskId: taskId,
                auto: true,
            }),
        },
    });

    eventBus.emit({
        type: 'creative:created',
        entityId: creativeRequest.id,
        entityType: 'creative',
        payload: { linkedTaskId: taskId, auto: true },
        timestamp: new Date(),
        userId,
    });
}

/**
 * When marketing task status changes, update linked creative request
 */
export async function onMarketingStatusChanged(
    taskId: string,
    newStatus: string,
    userId?: string
): Promise<void> {
    const task = await prisma.marketingTask.findUnique({
        where: { id: taskId },
    });
    if (!task || !task.linkedCreativeRequestId) return;

    const newCreativeStatus = mapMarketingStatusToCreative(newStatus);

    await prisma.creativeRequest.update({
        where: { id: task.linkedCreativeRequestId },
        data: {
            status: newCreativeStatus,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
        },
    });

    eventBus.emit({
        type: 'creative:status_changed',
        entityId: task.linkedCreativeRequestId,
        entityType: 'creative',
        payload: { source: 'marketing', oldStatus: task.status, newStatus: newCreativeStatus },
        timestamp: new Date(),
        userId,
    });
}

// Register event listeners
eventBus.on('marketing:created', async (event) => {
    await onMarketingTaskCreated(event.entityId, event.userId);
});

eventBus.on('marketing:status_changed', async (event) => {
    await onMarketingStatusChanged(event.entityId, event.payload.newStatus, event.userId);
});
