import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single event with attendees
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.calendarEvent.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        profile: { select: { fullName: true, fullNameAr: true, avatar: true } },
                    },
                },
                attendees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profile: { select: { fullName: true, fullNameAr: true, avatar: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json(
                { error: 'الحدث غير موجود', error_en: 'Event not found' },
                { status: 404 }
            );
        }

        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update event
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const {
            title, titleAr, description, type, startAt, endAt,
            allDay, location, color, clientId, campaignId,
            isRecurring, recurRule, attendeeIds,
        } = body;

        const updateData: Record<string, any> = {};
        if (title !== undefined) updateData.title = title;
        if (titleAr !== undefined) updateData.titleAr = titleAr;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;
        if (startAt !== undefined) updateData.startAt = new Date(startAt);
        if (endAt !== undefined) updateData.endAt = endAt ? new Date(endAt) : null;
        if (allDay !== undefined) updateData.allDay = allDay;
        if (location !== undefined) updateData.location = location;
        if (color !== undefined) updateData.color = color;
        if (clientId !== undefined) updateData.clientId = clientId || null;
        if (campaignId !== undefined) updateData.campaignId = campaignId || null;
        if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
        if (recurRule !== undefined) updateData.recurRule = recurRule;

        // Update attendees if provided
        if (attendeeIds !== undefined) {
            // Delete existing attendees and re-create
            await prisma.calendarAttendee.deleteMany({ where: { eventId: id } });
            if (attendeeIds.length > 0) {
                await prisma.calendarAttendee.createMany({
                    data: attendeeIds.map((userId: string) => ({
                        eventId: id,
                        userId,
                        status: 'pending',
                    })),
                });
            }
        }

        const item = await prisma.calendarEvent.update({
            where: { id },
            data: updateData,
            include: {
                creator: {
                    select: {
                        id: true,
                        profile: { select: { fullName: true, fullNameAr: true, avatar: true } },
                    },
                },
                attendees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profile: { select: { fullName: true, fullNameAr: true, avatar: true } },
                            },
                        },
                    },
                },
            },
        });

        await logAudit(auth.session.user.id, 'updated', 'calendar', { id, title: item.title });
        return sendSuccess(item);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete event
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const item = await prisma.calendarEvent.delete({ where: { id } });
        await logAudit(auth.session.user.id, 'deleted', 'calendar', { id, title: item.title });
        return sendSuccess({ success: true, deleted: item.title });
    } catch (error) {
        return errorToResponse(error);
    }
}
