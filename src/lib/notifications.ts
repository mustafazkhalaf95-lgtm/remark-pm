/* ══════════════════════════════════════════════════════════
   Remark PM — Notification System
   Creates in-app notifications for users based on events.
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';

/**
 * Send a notification to a specific user
 */
export async function notifyUser(
    userId: string,
    type: string,
    title: string,
    titleAr: string,
    message: string = '',
    messageAr: string = '',
    entityType?: string,
    entityId?: string
): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                titleAr,
                message,
                messageAr,
                entityType: entityType || '',
                entityId: entityId || '',
            },
        });
    } catch (e) {
        console.error('[Notification] Failed to create:', e);
    }
}

/**
 * Send notification to all members of a department
 */
export async function notifyDepartment(
    departmentId: string,
    type: string,
    title: string,
    titleAr: string,
    message: string = '',
    messageAr: string = '',
    entityType?: string,
    entityId?: string
): Promise<void> {
    try {
        const members = await prisma.userDepartment.findMany({
            where: { departmentId },
            select: { userId: true },
        });

        for (const { userId } of members) {
            await notifyUser(userId, type, title, titleAr, message, messageAr, entityType, entityId);
        }
    } catch (e) {
        console.error('[Notification] Failed to notify department:', e);
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
        where: { userId, isRead: false },
    });
}
