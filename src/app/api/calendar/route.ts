import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — List events for date range with attendees
export async function GET(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const type = searchParams.get('type') || undefined;
        const clientId = searchParams.get('clientId') || undefined;

        const where: Record<string, any> = {};
        if (type) where.type = type;
        if (clientId) where.clientId = clientId;
        if (startDate || endDate) {
            where.startAt = {};
            if (startDate) where.startAt.gte = new Date(startDate);
            if (endDate) where.startAt.lte = new Date(endDate);
        }

        const items = await prisma.calendarEvent.findMany({
            where,
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
            orderBy: { startAt: 'asc' },
        });

        return sendSuccess(items);
    } catch (error) {
        return errorToResponse(error);
    }
}

// POST — Create event with attendees
export async function POST(req: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const {
            title, titleAr, description, type, startAt, endAt,
            allDay, location, color, clientId, campaignId,
            isRecurring, recurRule, attendeeIds,
        } = body;

        if (!title || !startAt) {
            return NextResponse.json(
                { error: 'العنوان وتاريخ البداية مطلوبان', error_en: 'title and startAt are required' },
                { status: 400 }
            );
        }

        const item = await prisma.calendarEvent.create({
            data: {
                title,
                titleAr: titleAr || '',
                description: description || '',
                type: type || 'meeting',
                startAt: new Date(startAt),
                endAt: endAt ? new Date(endAt) : null,
                allDay: allDay || false,
                location: location || '',
                color: color || '#6366f1',
                clientId: clientId || null,
                campaignId: campaignId || null,
                isRecurring: isRecurring || false,
                recurRule: recurRule || '',
                createdBy: auth.session.user.id,
                attendees: attendeeIds && attendeeIds.length > 0
                    ? {
                        create: attendeeIds.map((userId: string) => ({
                            userId,
                            status: 'pending',
                        })),
                    }
                    : undefined,
            },
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

        await logAudit(auth.session.user.id, 'created', 'calendar', { id: item.id, title: item.title });
        return sendSuccess(item, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
