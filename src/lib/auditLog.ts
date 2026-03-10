import prisma from '@/lib/prisma';

/**
 * Log an audit event. Fire-and-forget — never throws.
 */
export async function logAudit(
  userId: string,
  action: string,
  target: string,
  details?: string | Record<string, any>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: `AUDIT:${action}`,
        entityType: 'AUDIT',
        entityId: target,
        details: typeof details === 'object' ? JSON.stringify(details) : (details || ''),
        userId,
      },
    });
  } catch {
    // Audit logging should never break the main flow
    console.error('[AuditLog] Failed to log:', action, target);
  }
}
