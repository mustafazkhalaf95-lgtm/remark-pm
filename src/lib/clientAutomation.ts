/* ══════════════════════════════════════════════════════════
   Remark PM — Client Creation Automation
   When a new client is created, automatically provisions:
   1. Client business record (already created by caller)
   2. Client portal access account
   3. User-client access mapping for assigned account manager
   4. Default campaign container
   5. Chat room for client communication
   6. Notification for relevant team members
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';

interface ClientSetupInput {
    clientId: string;
    clientName: string;
    clientNameAr: string;
    accountManagerId?: string;
    createdByUserId: string;
}

export async function provisionNewClient(input: ClientSetupInput) {
    const { clientId, clientName, clientNameAr, accountManagerId, createdByUserId } = input;
    const results: string[] = [];

    try {
        // 1. Client portal access
        await prisma.clientPortalAccess.create({
            data: {
                clientId,
                email: `${clientName.toLowerCase().replace(/\s+/g, '.')}@portal.remark.iq`,
                name: clientName,
                tokenHash: '',
                isActive: false,
                permissions: 'view,comment,files',
            },
        });
        results.push('portal_access');

        // 2. Assign account manager if provided
        if (accountManagerId) {
            await prisma.userClient.create({
                data: {
                    userId: accountManagerId,
                    clientId,
                    role: 'lead',
                },
            });
            results.push('account_manager_assigned');
        }

        // 3. Also assign the creator
        if (createdByUserId !== accountManagerId) {
            await prisma.userClient.upsert({
                where: {
                    userId_clientId: { userId: createdByUserId, clientId },
                },
                update: {},
                create: {
                    userId: createdByUserId,
                    clientId,
                    role: 'member',
                },
            });
            results.push('creator_assigned');
        }

        // 4. Default campaign
        await prisma.campaign.create({
            data: {
                name: `${clientName} — Default Campaign`,
                nameAr: `${clientNameAr} — الحملة الافتراضية`,
                status: 'planning',
                clientId,
            },
        });
        results.push('default_campaign');

        // 5. Client chat room
        const chatRoom = await prisma.chatRoom.create({
            data: {
                name: `Client: ${clientName}`,
                nameAr: `عميل: ${clientNameAr}`,
                type: 'client',
                clientId,
            },
        });

        // Add creator and account manager to chat room
        const memberIds = [createdByUserId];
        if (accountManagerId && accountManagerId !== createdByUserId) {
            memberIds.push(accountManagerId);
        }
        for (const userId of memberIds) {
            await prisma.chatRoomMember.create({
                data: { roomId: chatRoom.id, userId, role: 'admin' },
            });
        }
        results.push('chat_room');

        // 6. Activity log
        await prisma.activityLog.create({
            data: {
                userId: createdByUserId,
                clientId,
                entityType: 'client',
                entityId: clientId,
                action: 'created',
                details: JSON.stringify({ name: clientName, provisioned: results }),
            },
        });
        results.push('activity_logged');

        // 7. Notifications for department heads
        const deptHeads = await prisma.userRole.findMany({
            where: {
                role: { name: { in: ['ceo', 'coo', 'account_manager', 'marketing_manager'] } },
                isPrimary: true,
            },
            select: { userId: true },
        });

        for (const head of deptHeads) {
            if (head.userId === createdByUserId) continue;
            await prisma.notification.create({
                data: {
                    userId: head.userId,
                    title: `عميل جديد: ${clientNameAr}`,
                    titleAr: `عميل جديد: ${clientNameAr}`,
                    message: `New client "${clientName}" has been added to the system.`,
                    messageAr: `تمت إضافة عميل جديد "${clientNameAr}" إلى النظام.`,
                    type: 'info',
                    entityType: 'client',
                    entityId: clientId,
                },
            });
        }
        results.push('notifications_sent');

    } catch (error) {
        console.error('[ClientAutomation] Error provisioning client:', error);
        results.push('error: ' + (error as Error).message);
    }

    return results;
}
