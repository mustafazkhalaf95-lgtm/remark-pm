import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single file details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.fileAttachment.findUnique({ where: { id } });
        if (!item) {
            return NextResponse.json(
                { error: 'الملف غير موجود', error_en: 'File not found' },
                { status: 404 }
            );
        }
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update file metadata
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { fileName, folder, description, entityType, entityId, isPublic } = body;

        const updateData: Record<string, any> = {};
        if (fileName !== undefined) updateData.fileName = fileName;
        if (folder !== undefined) updateData.folder = folder;
        if (description !== undefined) updateData.description = description;
        if (entityType !== undefined) updateData.entityType = entityType;
        if (entityId !== undefined) updateData.entityId = entityId;
        if (isPublic !== undefined) updateData.isPublic = isPublic;

        const item = await prisma.fileAttachment.update({
            where: { id },
            data: updateData,
        });

        await logAudit(auth.session.user.id, 'updated', 'files', { id, fileName: item.fileName });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete file record
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.fileAttachment.delete({ where: { id } });
        await logAudit(auth.session.user.id, 'deleted', 'files', { id, fileName: item.fileName });
        return sendSuccess({ success: true, deleted: item.fileName });
    } catch (error) {
        return errorToResponse(error);
    }
}
