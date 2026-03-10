import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess, sendPaginated, parsePagination } from '@/lib/routeHandlers';

// GET — List files with filters (folder, entityType, entityId, mimeType, search)
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { take, skip } = parsePagination(req.url);
        const { searchParams } = new URL(req.url);

        const folder = searchParams.get('folder') || undefined;
        const entityType = searchParams.get('entityType') || undefined;
        const entityId = searchParams.get('entityId') || undefined;
        const mimeType = searchParams.get('mimeType') || undefined;
        const search = searchParams.get('search') || undefined;

        const where: Record<string, any> = {};
        if (folder && folder !== 'all') where.folder = folder;
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (mimeType) where.mimeType = { contains: mimeType };
        if (search) {
            where.OR = [
                { fileName: { contains: search } },
                { description: { contains: search } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.fileAttachment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            prisma.fileAttachment.count({ where }),
        ]);

        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create file record (metadata only)
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const {
            fileName, fileUrl, fileSize, mimeType,
            folder, entityType, entityId, description, isPublic,
        } = body;

        if (!fileName || !fileUrl) {
            return NextResponse.json(
                { error: 'اسم الملف والرابط مطلوبان', error_en: 'fileName and fileUrl are required' },
                { status: 400 }
            );
        }

        const item = await prisma.fileAttachment.create({
            data: {
                fileName,
                fileUrl,
                fileSize: fileSize || 0,
                mimeType: mimeType || '',
                folder: folder || 'general',
                entityType: entityType || '',
                entityId: entityId || '',
                description: description || '',
                isPublic: isPublic || false,
                uploadedBy: auth.session.user.id,
            },
        });

        await logAudit(auth.session.user.id, 'created', 'files', { id: item.id, fileName: item.fileName });
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
