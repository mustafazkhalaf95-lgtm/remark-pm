import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess } from '@/lib/routeHandlers';
import { creativeRequestUpdateSchema } from '@/lib/validations';

// GET — Single creative request
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('view:creative');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.creativeRequest.findUnique({
            where: { id },
            include: {
                client: true,
                campaign: true,
            }
        });

        if (!item) return NextResponse.json({ error: 'Creative request not found' }, { status: 404 });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:creative');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const data = creativeRequestUpdateSchema.parse(body);

        const item = await prisma.creativeRequest.update({
            where: { id },
            data,
            include: {
                client: true,
                campaign: true,
            }
        });

        await logAudit(auth.session.user.id, 'updated', 'creative_requests', { id, title: item.title });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Archive (soft delete)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:creative');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.creativeRequest.update({
            where: { id },
            data: {
                status: 'archived',
            },
            include: {
                client: true,
                campaign: true,
            }
        });

        await logAudit(auth.session.user.id, 'archived', 'creative_requests', { id });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}
