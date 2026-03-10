/* ══════════════════════════════════════════════════════════
   AI Context Builder — Collects system data for AI prompts.
   Ready for integration with OpenAI / Anthropic Claude.
   ══════════════════════════════════════════════════════════ */

import prisma from '@/lib/prisma';

export interface AiContext {
    agency: {
        name: string;
        departments: string[];
    };
    stats: {
        activeClients: number;
        pendingCreativeRequests: number;
        activeProductionJobs: number;
        pendingPublishingItems: number;
        totalRevenue: number;
        totalExpenses: number;
        teamMembers: number;
    };
    user: {
        name: string;
        role: string;
        departments: string[];
    };
}

/**
 * Build comprehensive context for AI system prompt.
 * This data helps the AI understand the current state of the agency.
 */
export async function buildAiContext(userId: string, userRole: string, userName: string): Promise<AiContext> {
    try {
        const [
            clientCount,
            creativeCount,
            productionCount,
            publishingCount,
            expenseSum,
            invoiceSum,
            userCount,
            departments,
        ] = await Promise.all([
            prisma.client.count({ where: { status: 'active' } }),
            prisma.creativeRequest.count({ where: { status: { not: 'completed' } } }),
            prisma.productionJob.count({ where: { status: { not: 'completed' } } }),
            prisma.publishingItem.count({ where: { status: { not: 'published' } } }),
            prisma.expense.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
            prisma.invoice.aggregate({ where: { status: 'paid' }, _sum: { total: true } }),
            prisma.user.count({ where: { status: 'active' } }),
            prisma.department.findMany({ select: { name: true } }),
        ]);

        return {
            agency: {
                name: 'Remark Creative Agency',
                departments: departments.map(d => d.name),
            },
            stats: {
                activeClients: clientCount,
                pendingCreativeRequests: creativeCount,
                activeProductionJobs: productionCount,
                pendingPublishingItems: publishingCount,
                totalRevenue: invoiceSum._sum.total || 0,
                totalExpenses: expenseSum._sum.amount || 0,
                teamMembers: userCount,
            },
            user: {
                name: userName,
                role: userRole,
                departments: [],
            },
        };
    } catch (error) {
        console.error('Error building AI context:', error);
        return {
            agency: { name: 'Remark Creative Agency', departments: [] },
            stats: {
                activeClients: 0,
                pendingCreativeRequests: 0,
                activeProductionJobs: 0,
                pendingPublishingItems: 0,
                totalRevenue: 0,
                totalExpenses: 0,
                teamMembers: 0,
            },
            user: { name: userName, role: userRole, departments: [] },
        };
    }
}

/**
 * Generate system prompt for AI with full agency context.
 * Use this when calling OpenAI / Anthropic APIs.
 */
export function buildSystemPrompt(context: AiContext): string {
    return `أنت مساعد ذكي لوكالة ${context.agency.name} الإبداعية.

الأقسام: ${context.agency.departments.join(', ')}

الوضع الحالي:
- عملاء نشطون: ${context.stats.activeClients}
- طلبات إبداعية قيد التنفيذ: ${context.stats.pendingCreativeRequests}
- مشاريع إنتاج نشطة: ${context.stats.activeProductionJobs}
- عناصر نشر معلقة: ${context.stats.pendingPublishingItems}
- إجمالي الإيرادات: $${context.stats.totalRevenue.toLocaleString()}
- إجمالي المصاريف: $${context.stats.totalExpenses.toLocaleString()}
- أعضاء الفريق: ${context.stats.teamMembers}

المستخدم الحالي: ${context.user.name} (${context.user.role})

أجب باللغة العربية دائماً. كن مختصراً ومهنياً. قدم توصيات عملية بناءً على البيانات.`;
}
