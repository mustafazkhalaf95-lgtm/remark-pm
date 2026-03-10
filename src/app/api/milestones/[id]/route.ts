import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single milestone
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.projectMilestone.findUnique({ where: { id } });
        if (!item) {
            return NextResponse.json(
                { error: 'المعلم غير موجود', error_en: 'Milestone not found' },
                { status: 404 }
            );
        }
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update milestone
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { title, titleAr, description, dueDate, status, completedAt, color, sortOrder, campaignId, clientId } = body;

        const updateData: Record<string, any> = {};
        if (title !== undefined) updateData.title = title;
        if (titleAr !== undefined) updateData.titleAr = titleAr;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (status !== undefined) updateData.status = status;
        if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
        if (color !== undefined) updateData.color = color;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (campaignId !== undefined) updateData.campaignId = campaignId || null;
        if (clientId !== undefined) updateData.clientId = clientId || null;

        // Auto-set completedAt when marking as completed
        if (status === 'completed' && !completedAt) {
            updateData.completedAt = new Date();
        }

        const item = await prisma.projectMilestone.update({
            where: { id },
            data: updateData,
        });

        await logAudit(auth.session.user.id, 'updated', 'milestones', { id, title: item.title });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete milestone
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.projectMilestone.delete({ where: { id } });
        await logAudit(auth.session.user.id, 'deleted', 'milestones', { id, title: item.title });
        return sendSuccess({ success: true, deleted: item.title });
    } catch (error) {
        return errorToResponse(error);
    }
}
