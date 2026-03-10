import { NextResponse } from 'next/server';
import { requirePermission, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { validateBody, sendSuccess } from '@/lib/routeHandlers';
import { campaignUpdateSchema } from '@/lib/validations';

// GET — Single campaign
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requirePermission('view:clients');
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.campaign.findUnique({
            where: { id },
            include: {
                client: true,
                _count: {
                    select: {
                        marketingTasks: true,
                        creativeRequests: true,
                        productionJobs: true,
                        publishingItems: true,
                    }
                }
            }
        });

        if (!item) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
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
        const data = campaignUpdateSchema.parse(body);

        const item = await prisma.campaign.update({
            where: { id },
            data,
            include: {
                client: true,
                _count: {
                    select: {
                        marketingTasks: true,
                        creativeRequests: true,
                        productionJobs: true,
                        publishingItems: true,
                    }
                }
            }
        });

        await logAudit(auth.session.user.id, 'updated', 'campaigns', { id, name: item.name });
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
        const item = await prisma.campaign.update({
            where: { id },
            data: {
                status: 'archived',
            },
            include: {
                client: true,
                _count: {
                    select: {
                        marketingTasks: true,
                        creativeRequests: true,
                        productionJobs: true,
                        publishingItems: true,
                    }
                }
            }
        });

        await logAudit(auth.session.user.id, 'archived', 'campaigns', { id });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}
