import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/* ══════════════════════════════════════════════════════════
   AI Chat Endpoint — Stub for future AI integration.
   Ready for OpenAI / Anthropic Claude API connection.
   ══════════════════════════════════════════════════════════ */

// Build context from current system data (for AI system prompt)
async function buildContext(userId: string) {
    try {
        const [clients, creativeRequests, productionJobs, expenses] = await Promise.all([
            prisma.client.count({ where: { status: 'active' } }),
            prisma.creativeRequest.count({ where: { status: { not: 'completed' } } }),
            prisma.productionJob.count({ where: { status: { not: 'completed' } } }),
            prisma.expense.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
        ]);

        return {
            activeClients: clients,
            pendingCreativeRequests: creativeRequests,
            pendingProductionJobs: productionJobs,
            totalApprovedExpenses: expenses._sum.amount || 0,
        };
    } catch {
        return { activeClients: 0, pendingCreativeRequests: 0, pendingProductionJobs: 0, totalApprovedExpenses: 0 };
    }
}

export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { message, conversationId } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required', error_ar: 'الرسالة مطلوبة' },
                { status: 400 }
            );
        }

        // Build system context
        const context = await buildContext(auth.session.user.id);

        // ── STUB RESPONSE ──
        // TODO: Replace with actual AI API call (OpenAI, Anthropic, etc.)
        // Example integration points:
        // - OpenAI: const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // - Claude: const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        //
        // System prompt should include:
        // - Agency context (marketing, creative, production departments)
        // - Current data (activeClients, pendingRequests, etc.)
        // - User role and permissions
        // - Arabic language preference

        const stubResponse = generateStubResponse(message, context, auth.session.user);

        return NextResponse.json({
            conversationId: conversationId || `conv_${Date.now()}`,
            message: {
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: stubResponse,
            },
            context, // Include context for frontend debugging
        });
    } catch (error) {
        console.error('AI chat error:', error);
        return NextResponse.json(
            { error: 'Internal error', error_ar: 'خطأ داخلي' },
            { status: 500 }
        );
    }
}

function generateStubResponse(
    message: string,
    context: { activeClients: number; pendingCreativeRequests: number; pendingProductionJobs: number; totalApprovedExpenses: number },
    user: any
): string {
    const lc = message.toLowerCase();

    if (lc.includes('أداء') || lc.includes('تقرير') || lc.includes('report') || lc.includes('performance')) {
        return `📊 **ملخص الأداء الحالي:**\n\n` +
            `• العملاء النشطون: ${context.activeClients}\n` +
            `• طلبات إبداعية قيد التنفيذ: ${context.pendingCreativeRequests}\n` +
            `• مشاريع إنتاج نشطة: ${context.pendingProductionJobs}\n` +
            `• إجمالي المصاريف المعتمدة: $${context.totalApprovedExpenses.toLocaleString()}\n\n` +
            `_هذا رد تجريبي. سيتم ربط الذكاء الاصطناعي لتحليلات أعمق قريباً._`;
    }

    if (lc.includes('أولوي') || lc.includes('priorit')) {
        return `🎯 **أولوياتك الحالية:**\n\n` +
            `1. مراجعة ${context.pendingCreativeRequests} طلبات إبداعية معلّقة\n` +
            `2. متابعة ${context.pendingProductionJobs} مشاريع إنتاج نشطة\n` +
            `3. مراجعة حالة ${context.activeClients} عملاء نشطين\n\n` +
            `_هذا رد تجريبي. سيتم ربط الذكاء الاصطناعي لتوصيات مخصصة قريباً._`;
    }

    if (lc.includes('فريق') || lc.includes('team')) {
        return `👥 **نظرة عامة على الفريق:**\n\n` +
            `الفريق يعمل حالياً على:\n` +
            `• ${context.pendingCreativeRequests} مهمة إبداعية\n` +
            `• ${context.pendingProductionJobs} مشروع إنتاج\n\n` +
            `_هذا رد تجريبي. سيتم ربط الذكاء الاصطناعي لتقييمات مفصّلة قريباً._`;
    }

    return `مرحباً ${user.name || ''}! 👋\n\n` +
        `أنا مساعد ريمارك الذكي. حالياً في وضع التجربة.\n` +
        `يمكنك سؤالي عن:\n` +
        `• 📊 تقرير الأداء\n` +
        `• 🎯 الأولويات الحالية\n` +
        `• 👥 حالة الفريق\n\n` +
        `_سيتم تفعيل الذكاء الاصطناعي الكامل قريباً._`;
}
