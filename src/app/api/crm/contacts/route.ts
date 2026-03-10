import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const where: any = {};
    if (clientId) where.clientId = clientId;
    const items = await prisma.contactLog.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 100,
        include: { client: true, user: { include: { profile: true } } },
    });
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const item = await prisma.contactLog.create({
            data: {
                clientId: body.clientId,
                userId: body.userId || (await prisma.user.findFirst())?.id || '',
                type: body.type || 'call',
                subject: body.subject || '',
                subjectAr: body.subjectAr || '',
                notes: body.notes || '',
                outcome: body.outcome || '',
                followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
                duration: body.duration || null,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
