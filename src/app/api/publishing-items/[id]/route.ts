import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess } from '@/lib/routeHandlers';
import { publishingItemUpdateSchema } from '@/lib/validations';

// GET — Single publishing item
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('view:publishing');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.publishingItem.findUnique({
            where: { id },
            include: {
                client: true,
                campaign: true,
            }
        });

        if (!item) return NextResponse.json({ error: 'Publishing item not found' }, { status: 404 });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:publishing');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const data = publishingItemUpdateSchema.parse(body);

        const item = await prisma.publishingItem.update({
            where: { id },
            data,
            include: {
                client: true,
                campaign: true,
            }
        });

        await logAudit(auth.session.user.id, 'updated', 'publishing_items', { id, title: item.title });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Archive (soft delete)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('manage:publishing');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.publishingItem.update({
            where: { id },
            data: {
                status: 'archived',
            },
            include: {
                client: true,
                campaign: true,
            }
        });

        await logAudit(auth.session.user.id, 'archived', 'publishing_items', { id });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}
