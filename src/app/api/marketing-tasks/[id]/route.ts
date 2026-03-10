import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess } from '@/lib/routeHandlers';
import { marketingTaskUpdateSchema } from '@/lib/validations';

// GET — Single marketing task
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('view:marketing');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.marketingTask.findUnique({
            where: { id },
            include: {
                client: true,
                campaign: true,
            }
        });

        if (!item) return NextResponse.json({ error: 'Marketing task not found' }, { status: 404 });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:marketing');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const data = marketingTaskUpdateSchema.parse(body);

        const item = await prisma.marketingTask.update({
            where: { id },
            data,
            include: {
                client: true,
                campaign: true,
            }
        });

        await logAudit(auth.session.user.id, 'updated', 'marketing_tasks', { id, title: item.title });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Archive (soft delete)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:marketing');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.marketingTask.update({
            where: { id },
            data: {
                status: 'archived',
            },
            include: {
                client: true,
                campaign: true,
            }
        });

        await logAudit(auth.session.user.id, 'archived', 'marketing_tasks', { id });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}
