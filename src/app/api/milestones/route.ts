import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess, sendPaginated, parsePagination } from '@/lib/routeHandlers';

// GET — List milestones
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { take, skip } = parsePagination(req.url);
        const { searchParams } = new URL(req.url);

        const clientId = searchParams.get('clientId') || undefined;
        const campaignId = searchParams.get('campaignId') || undefined;
        const status = searchParams.get('status') || undefined;

        const where: Record<string, any> = {};
        if (clientId) where.clientId = clientId;
        if (campaignId) where.campaignId = campaignId;
        if (status) where.status = status;

        const [items, total] = await Promise.all([
            prisma.projectMilestone.findMany({
                where,
                orderBy: { dueDate: 'asc' },
                take,
                skip,
            }),
            prisma.projectMilestone.count({ where }),
        ]);

        return sendPaginated(items, total, take, skip);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create milestone
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const { title, titleAr, description, dueDate, campaignId, clientId, color, sortOrder } = body;

        if (!title || !dueDate) {
            return NextResponse.json(
                { error: 'العنوان والتاريخ مطلوبان', error_en: 'title and dueDate are required' },
                { status: 400 }
            );
        }

        const item = await prisma.projectMilestone.create({
            data: {
                title,
                titleAr: titleAr || '',
                description: description || '',
                dueDate: new Date(dueDate),
                campaignId: campaignId || null,
                clientId: clientId || null,
                color: color || '#6366f1',
                sortOrder: sortOrder || 0,
                status: 'pending',
            },
        });

        await logAudit(auth.session.user.id, 'created', 'milestones', { id: item.id, title: item.title });
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
