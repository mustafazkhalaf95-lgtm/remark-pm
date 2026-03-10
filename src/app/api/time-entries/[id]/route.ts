import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single time entry
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.timeEntry.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true, fullNameAr: true, avatar: true },
                        },
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json(
                { error: 'سجل الوقت غير موجود', error_en: 'Time entry not found' },
                { status: 404 }
            );
        }

        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update time entry (stop timer, edit details)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();

        // Check the entry exists
        const existing = await prisma.timeEntry.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'سجل الوقت غير موجود', error_en: 'Time entry not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, any> = {};

        // Allow updating these fields
        if (body.description !== undefined) updateData.description = body.description;
        if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
        if (body.clientId !== undefined) updateData.clientId = body.clientId;
        if (body.taskType !== undefined) updateData.taskType = body.taskType;
        if (body.taskId !== undefined) updateData.taskId = body.taskId;
        if (body.billable !== undefined) updateData.billable = body.billable;
        if (body.rate !== undefined) updateData.rate = body.rate;
        if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);

        // Stop the timer
        if (body.action === 'stop' && existing.status === 'running') {
            const endTime = new Date();
            updateData.endTime = endTime;
            updateData.duration = Math.round(
                (endTime.getTime() - existing.startTime.getTime()) / 60000
            );
            updateData.status = 'completed';
        }

        // Explicit endTime update
        if (body.endTime !== undefined) {
            updateData.endTime = new Date(body.endTime);
            const start = updateData.startTime || existing.startTime;
            updateData.duration = Math.round(
                (updateData.endTime.getTime() - start.getTime()) / 60000
            );
            updateData.status = 'completed';
        }

        // Manual duration override
        if (body.duration !== undefined && body.endTime === undefined) {
            updateData.duration = body.duration;
            updateData.status = 'edited';
        }

        // Status override (e.g., mark completed without changing times)
        if (body.status !== undefined) {
            updateData.status = body.status;
        }

        const item = await prisma.timeEntry.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true, fullNameAr: true, avatar: true },
                        },
                    },
                },
            },
        });

        await logAudit(auth.session.user.id, 'updated', 'time_entry', {
            id,
            changes: Object.keys(updateData),
        });

        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete time entry
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;

        const existing = await prisma.timeEntry.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: 'سجل الوقت غير موجود', error_en: 'Time entry not found' },
                { status: 404 }
            );
        }

        await prisma.timeEntry.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'time_entry', {
            id,
            taskType: existing.taskType,
            duration: existing.duration,
        });

        return sendSuccess({ deleted: true, id });
    } catch (error) {
        return errorToResponse(error);
    }
}
