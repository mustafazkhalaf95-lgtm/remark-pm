import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess } from '@/lib/routeHandlers';
import { clientUpdateSchema } from '@/lib/validations';

// GET — Single client
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('view:clients');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.client.findUnique({
            where: { id },
            include: {
                campaigns: true,
                marketingTasks: { select: { id: true } },
                creativeRequests: { select: { id: true } },
            }
        });

        if (!item) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:clients');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const data = clientUpdateSchema.parse({ id, ...body });

        // Remove id from data before update
        const { id: _, ...updateData } = data as any;

        const item = await prisma.client.update({
            where: { id },
            data: updateData,
            include: {
                campaigns: true,
                marketingTasks: { select: { id: true } },
                creativeRequests: { select: { id: true } },
            }
        });

        await logAudit(auth.session.user.id, 'updated', 'clients', { id, name: item.name });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Archive (soft delete)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:clients');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.client.update({
            where: { id },
            data: {
                status: 'archived',
                archivedAt: new Date(),
            },
            include: {
                campaigns: true,
                marketingTasks: { select: { id: true } },
                creativeRequests: { select: { id: true } },
            }
        });

        await logAudit(auth.session.user.id, 'archived', 'clients', { id });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}
