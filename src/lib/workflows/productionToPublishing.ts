/* ══════════════════════════════════════════════════════════
   Workflow: Production → Publishing
   Auto-creates publishing items when production jobs
   are completed.
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';
import { eventBus } from '@/lib/eventBus';

/**
 * When production is completed, create publishing items
 */
export async function onProductionComplete(jobId: string, userId?: string): Promise<void> {
    const job = await prisma.productionJob.findUnique({
        where: { id: jobId },
        include: { client: true },
    });
    if (!job) return;

    // Get source creative to determine platforms
    let platforms = ['instagram'];
    if (job.linkedCreativeRequestId) {
        const creative = await prisma.creativeRequest.findUnique({
            where: { id: job.linkedCreativeRequestId },
        });
        if (creative?.platform) {
            platforms = creative.platform.split(',').map((p: string) => p.trim()).filter(Boolean);
            if (platforms.length === 0) platforms = ['instagram'];
        }
    }

    // Check if publishing items already exist
    const existing = await prisma.publishingItem.findFirst({
        where: { linkedProductionJobId: jobId },
    });
    if (existing) return;

    // Create publishing item for each platform
    for (const platform of platforms) {
        const pubItem = await prisma.publishingItem.create({
            data: {
                clientId: job.clientId,
                campaignId: job.campaignId,
                title: `نشر: ${job.title}`,
                titleAr: `نشر: ${job.titleAr || job.title}`,
                platform,
                status: 'draft',
                mediaUrls: job.deliverables,
                linkedProductionJobId: jobId,
                linkedCreativeRequestId: job.linkedCreativeRequestId,
                syncStatus: 'synced',
                lastSyncedAt: new Date(),
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId,
                clientId: job.clientId,
                entityType: 'publishing_item',
                entityId: pubItem.id,
                action: 'created',
                details: JSON.stringify({
                    source: 'production_sync',
                    linkedJobId: jobId,
                    platform,
                    auto: true,
                }),
            },
        });

        eventBus.emit({
            type: 'publishing:created',
            entityId: pubItem.id,
            entityType: 'publishing',
            payload: { fromProduction: jobId, platform },
            timestamp: new Date(),
            userId,
        });
    }
}

/**
 * When publishing item is published, log it
 */
export async function onItemPublished(itemId: string, userId?: string): Promise<void> {
    const item = await prisma.publishingItem.findUnique({
        where: { id: itemId },
    });
    if (!item) return;

    await prisma.activityLog.create({
        data: {
            userId,
            clientId: item.clientId,
            entityType: 'publishing_item',
            entityId: itemId,
            action: 'published',
            details: JSON.stringify({
                platform: item.platform,
                publishedAt: new Date(),
            }),
        },
    });
}

// Register event listeners
eventBus.on('production:completed', async (event) => {
    await onProductionComplete(event.entityId, event.userId);
});

eventBus.on('publishing:published', async (event) => {
    await onItemPublished(event.entityId, event.userId);
});
