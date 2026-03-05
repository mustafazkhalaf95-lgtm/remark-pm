import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Phase definitions with role mappings and default day offsets from publish date
const VIDEO_PHASES = [
    { phase: 'CONTENT_WRITING', role: 'COPYWRITER', label: 'كتابة المحتوى', daysBefore: 8, position: 0 },
    { phase: 'DESIGN', role: 'DESIGNER', label: 'التصميم', daysBefore: 6, position: 1 },
    { phase: 'PHOTOGRAPHY', role: 'PRODUCTION_MANAGER', label: 'التصوير', daysBefore: 5, position: 2 },
    { phase: 'VIDEO_EDIT', role: 'PRODUCTION_MANAGER', label: 'المونتاج', daysBefore: 4, position: 3 },
    { phase: 'CREATIVE_REVIEW', role: 'CREATIVE_MANAGER', label: 'مراجعة الإبداع', daysBefore: 3, position: 4 },
    { phase: 'CEO_REVIEW', role: 'CEO', label: 'مراجعة الإدارة', daysBefore: 2, position: 5 },
    { phase: 'CLIENT_APPROVAL', role: 'ACCOUNT_MANAGER', label: 'موافقة العميل', daysBefore: 1, position: 6 },
    { phase: 'PUBLISH', role: 'MARKETING', label: 'النشر', daysBefore: 0, position: 7 },
];

const DESIGN_PHASES = [
    { phase: 'CONTENT_WRITING', role: 'COPYWRITER', label: 'كتابة المحتوى', daysBefore: 6, position: 0 },
    { phase: 'DESIGN', role: 'DESIGNER', label: 'التصميم', daysBefore: 4, position: 1 },
    { phase: 'CREATIVE_REVIEW', role: 'CREATIVE_MANAGER', label: 'مراجعة الإبداع', daysBefore: 2, position: 2 },
    { phase: 'CEO_REVIEW', role: 'CEO', label: 'مراجعة الإدارة', daysBefore: 1, position: 3 },
    { phase: 'CLIENT_APPROVAL', role: 'ACCOUNT_MANAGER', label: 'موافقة العميل', daysBefore: 1, position: 4 },
    { phase: 'PUBLISH', role: 'MARKETING', label: 'النشر', daysBefore: 0, position: 5 },
];

function generateAiSummary(brief: { title: string; content: string; contentType: string; clientBoard: string }): string {
    const type = brief.contentType === 'VIDEO' ? 'فيديو' : 'تصميم';
    return `📋 **تحليل البريف**: "${brief.title}"
    
🎯 **نوع المحتوى**: ${type}
👤 **العميل**: ${brief.clientBoard}

**ملخص الذكاء الاصطناعي**:
تم تحليل البريف وإنشاء المهام التالية بناءً على المحتوى. تم حساب المواعيد النهائية تلقائياً بناءً على تاريخ النشر المحدد.

${brief.contentType === 'VIDEO' ? `**المراحل المطلوبة** (8 مراحل):
1. كتابة المحتوى (السكربت)
2. التصميم (الستوري بورد)
3. التصوير
4. المونتاج والإيديت
5. مراجعة المدير الإبداعي
6. مراجعة الإدارة
7. موافقة العميل
8. النشر` : `**المراحل المطلوبة** (6 مراحل):
1. كتابة المحتوى
2. التصميم
3. مراجعة المدير الإبداعي
4. مراجعة الإدارة
5. موافقة العميل
6. النشر`}`;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const briefId = params.id;

    try {
        // Fetch the brief
        const brief = await prisma.brief.findUnique({ where: { id: briefId } });
        if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
        if (brief.status !== 'PENDING') return NextResponse.json({ error: 'Brief already processed' }, { status: 400 });

        // Determine phases based on content type
        const phases = brief.contentType === 'VIDEO' ? VIDEO_PHASES : DESIGN_PHASES;
        const publishDate = new Date(brief.publishDate);

        // Find the client board to create the card on
        const board = await prisma.board.findFirst({
            where: { name: { contains: brief.clientBoard } },
            include: { lists: { orderBy: { position: 'asc' } } },
        });

        if (!board || board.lists.length === 0) {
            return NextResponse.json({ error: `Board "${brief.clientBoard}" not found` }, { status: 404 });
        }

        // Use the first list (usually "Marketing" or "Creative")
        const targetList = board.lists[0];

        // Find team members by role
        const teamMembers = await prisma.user.findMany({
            select: { id: true, name: true, role: true },
        });

        const findByRole = (role: string) => teamMembers.find(m => m.role === role);

        // Generate AI summary
        const aiSummary = generateAiSummary({
            title: brief.title,
            content: brief.content,
            contentType: brief.contentType,
            clientBoard: brief.clientBoard,
        });

        // Create the main card
        const card = await prisma.card.create({
            data: {
                name: brief.title,
                description: `${brief.content}\n\n---\n${aiSummary}`,
                listId: targetList.id,
                briefId: brief.id,
                currentPhase: phases[0].phase,
                priority: 'HIGH',
                status: 'IN_PROGRESS',
                dueDate: publishDate,
                startDate: addDays(publishDate, -phases[0].daysBefore),
            },
        });

        // Create TaskPhase records for each phase
        for (const phaseDef of phases) {
            const assignee = findByRole(phaseDef.role);
            await prisma.taskPhase.create({
                data: {
                    phase: phaseDef.phase,
                    cardId: card.id,
                    assigneeId: assignee?.id || null,
                    deadline: addDays(publishDate, -phaseDef.daysBefore),
                    position: phaseDef.position,
                    status: phaseDef.position === 0 ? 'IN_PROGRESS' : 'PENDING',
                },
            });

            // Auto-assign the first phase's responsible person
            if (phaseDef.position === 0 && assignee) {
                await prisma.cardAssignee.create({
                    data: { cardId: card.id, userId: assignee.id },
                }).catch(() => { }); // Ignore if already exists
            }
        }

        // Update the brief status
        await prisma.brief.update({
            where: { id: briefId },
            data: { status: 'PROCESSED', aiSummary },
        });

        // Create notification for the first phase assignee
        const firstAssignee = findByRole(phases[0].role);
        if (firstAssignee) {
            await prisma.notification.create({
                data: {
                    userId: firstAssignee.id,
                    title: `مهمة جديدة: ${brief.title}`,
                    body: `تم تعيينك في مرحلة "${phases[0].label}" للبريف: ${brief.title}`,
                    type: 'ASSIGNMENT',
                    linkUrl: `/board/${board.id}`,
                },
            });
        }

        // Return the processed data
        const result = await prisma.card.findUnique({
            where: { id: card.id },
            include: {
                taskPhases: {
                    include: { assignee: { select: { id: true, name: true, role: true } } },
                    orderBy: { position: 'asc' },
                },
                list: { include: { board: { select: { id: true, name: true } } } },
            },
        });

        return NextResponse.json({ card: result, aiSummary, phasesCreated: phases.length });
    } catch (error: any) {
        console.error('Brief processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
