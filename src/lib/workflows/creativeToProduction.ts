/* ══════════════════════════════════════════════════════════
   Workflow: Creative → Production
   Auto-creates production jobs when creative requests
   are approved and require production work.
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';
import { eventBus } from '@/lib/eventBus';

const PRODUCTION_CATEGORIES = ['reel', 'video_edit', 'motion_graphics', 'photography'];

function detectJobType(category: string): string {
    const map: Record<string, string> = {
        reel: 'video',
        video_edit: 'video',
        motion_graphics: 'motion',
        photography: 'photo',
    };
    return map[category] || 'video';
}

/**
 * When a creative request is approved, create a production job if needed
 */
export async function onCreativeApproved(creativeId: string, userId?: string): Promise<void> {
    const creative = await prisma.creativeRequest.findUnique({
        where: { id: creativeId },
        include: { client: true },
    });
    if (!creative) return;

    const needsProduction = PRODUCTION_CATEGORIES.includes(creative.category);
    if (!needsProduction) return;

    // Check if production job already exists
    const existing = await prisma.productionJob.findFirst({
        where: { linkedCreativeRequestId: creativeId },
    });
    if (existing) return;

    const productionJob = await prisma.productionJob.create({
        data: {
            clientId: creative.clientId,
            campaignId: creative.campaignId,
            title: `إنتاج: ${creative.title}`,
            titleAr: `إنتاج: ${creative.titleAr || creative.title}`,
            jobType: detectJobType(creative.category),
            status: 'pending',
            priority: creative.priority,
            dueDate: creative.dueDate,
            linkedCreativeRequestId: creativeId,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
        },
    });

    // Update creative with production link
    await prisma.creativeRequest.update({
        where: { id: creativeId },
        data: {
            linkedProductionJobId: productionJob.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
        },
    });

    // Log activity
    await prisma.activityLog.create({
        data: {
            userId,
            clientId: creative.clientId,
            entityType: 'production_job',
            entityId: productionJob.id,
            action: 'created',
            details: JSON.stringify({
                source: 'creative_sync',
                linkedCreativeId: creativeId,
                auto: true,
            }),
        },
    });

    eventBus.emit({
        type: 'production:created',
        entityId: productionJob.id,
        entityType: 'production',
        payload: { fromCreative: creativeId, auto: true },
        timestamp: new Date(),
        userId,
    });
}

/**
 * When production job is completed, update the creative request
 */
export async function onProductionCompleted(jobId: string, userId?: string): Promise<void> {
    const job = await prisma.productionJob.findUnique({
        where: { id: jobId },
    });
    if (!job || !job.linkedCreativeRequestId) return;

    await prisma.creativeRequest.update({
        where: { id: job.linkedCreativeRequestId },
        data: {
            status: 'review_revisions',
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
        },
    });

    eventBus.emit({
        type: 'creative:status_changed',
        entityId: job.linkedCreativeRequestId,
        entityType: 'creative',
        payload: { source: 'production', newStatus: 'review_revisions' },
        timestamp: new Date(),
        userId,
    });
}

// Register event listeners
eventBus.on('creative:approved', async (event) => {
    await onCreativeApproved(event.entityId, event.userId);
});

eventBus.on('production:completed', async (event) => {
    await onProductionCompleted(event.entityId, event.userId);
});
