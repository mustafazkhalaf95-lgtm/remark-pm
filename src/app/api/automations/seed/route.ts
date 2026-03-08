import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST /api/automations/seed — Seed Placker-based automation rules
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const wm = await prisma.workspaceMember.findFirst({ where: { userId } });
    if (!wm) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const workspaceId = wm.workspaceId;

    // Get boards for linking
    const boards = await prisma.board.findMany({
        where: { workspaceId },
        include: { lists: { orderBy: { position: 'asc' } } },
    });

    const boardMap: Record<string, { id: string; lists: { id: string; name: string }[] }> = {};
    boards.forEach(b => { boardMap[b.name.toLowerCase()] = { id: b.id, lists: b.lists }; });

    // Get users for assignment
    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: true },
    });

    const userMap: Record<string, string> = {};
    members.forEach(m => { userMap[m.user.name?.toLowerCase() || ''] = m.userId; });

    // Get custom fields
    const fields = await prisma.customField.findMany({ where: { workspaceId } });
    const fieldMap: Record<string, string> = {};
    fields.forEach(f => { fieldMap[f.name] = f.id; });

    // ====== AUTOMATION RULES (No global mirrors — mirror rules are marketing-board-specific) ======

    const rules = [
        // 1. Task Assignment notification
        {
            name: 'توزيع مهام الإنتاج',
            description: 'عند تعيين مهمة إنتاج يتم إرسال إشعار',
            trigger: 'FIELD_CHANGE',
            triggerConfig: {
                fieldName: 'taskAssignment',
            },
            actions: [
                { type: 'NOTIFY', title: '📋 مهمة إنتاج جديدة', body: 'تم تعيين مهمة إنتاج جديدة لك' },
            ],
        },

        // 2. Client approval notification
        {
            name: 'إشعار موافقة العميل',
            description: 'عندما يتم تقييم البطاقة موافقة كلاينت يتم إرسال إشعار',
            trigger: 'FIELD_CHANGE',
            triggerConfig: {
                fieldName: 'finalReview',
                toValue: 'client_approved',
            },
            actions: [
                { type: 'NOTIFY', title: '✅ موافقة العميل', body: 'تم قبول البطاقة' },
            ],
        },

        // 3. Management rejection notification
        {
            name: 'إشعار رفض الإدارة',
            description: 'عند رفض البطاقة من الإدارة يتم إرسال إشعار',
            trigger: 'FIELD_CHANGE',
            triggerConfig: {
                fieldName: 'finalReview',
                toValue: 'mgmt_rejected',
            },
            actions: [
                { type: 'NOTIFY', title: '🔴 بطاقة مرفوضة', body: 'تم رفض البطاقة — يرجى المراجعة والتعديل' },
            ],
        },

        // 4. Content type → Video → Set default phases
        {
            name: 'مراحل إنتاج فيديو',
            description: 'عند تعيين نوع المحتوى كفيديو، يتم إنشاء مراحل إنتاج الفيديو تلقائياً',
            trigger: 'FIELD_CHANGE',
            triggerConfig: {
                fieldName: 'contentType',
                toValue: 'video',
            },
            actions: [
                {
                    type: 'CREATE_PHASES', phases: [
                        { phase: 'كتابة السكريبت', deadlineDays: 1 },
                        { phase: 'تجهيز اللوكيشن', deadlineDays: 1 },
                        { phase: 'التصوير', deadlineDays: 2 },
                        { phase: 'المونتاج والتعديل', deadlineDays: 3 },
                        { phase: 'المراجعة الداخلية', deadlineDays: 1 },
                        { phase: 'مراجعة العميل', deadlineDays: 2 },
                    ]
                },
                { type: 'SET_FIELD', fieldId: fieldMap['creativeState'], value: 'in_progress' },
            ],
        },

        // 5. Content type → Design → Set default phases
        {
            name: 'مراحل إنتاج تصميم',
            description: 'عند تعيين نوع المحتوى كتصميم، يتم إنشاء مراحل إنتاج التصميم تلقائياً',
            trigger: 'FIELD_CHANGE',
            triggerConfig: {
                fieldName: 'contentType',
                toValue: 'design',
            },
            actions: [
                {
                    type: 'CREATE_PHASES', phases: [
                        { phase: 'كتابة الكوبي', deadlineDays: 1 },
                        { phase: 'التصميم', deadlineDays: 2 },
                        { phase: 'المراجعة الداخلية', deadlineDays: 1 },
                        { phase: 'مراجعة العميل', deadlineDays: 2 },
                    ]
                },
                { type: 'SET_FIELD', fieldId: fieldMap['creativeState'], value: 'in_progress' },
            ],
        },
    ];

    // Clear old rules
    await prisma.automationRule.deleteMany({ where: { workspaceId } });

    // Create new rules
    const created: any[] = [];
    for (const rule of rules) {
        // Filter out actions with undefined boardIds
        const validActions = rule.actions.filter(a => {
            if (a.type === 'MIRROR' && !(a as any).boardId) return false;
            return true;
        });

        const r = await prisma.automationRule.create({
            data: {
                name: rule.name,
                description: rule.description,
                trigger: rule.trigger,
                triggerConfig: JSON.stringify(rule.triggerConfig),
                actions: JSON.stringify(validActions),
                enabled: true,
                workspaceId,
            },
        });
        created.push(r);
    }

    return NextResponse.json({ success: true, count: created.length, rules: created });
}
