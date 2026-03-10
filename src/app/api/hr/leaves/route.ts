import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const where: any = {};
        if (userId) where.userId = userId;
        if (status) where.status = status;

        const items = await prisma.leaveRequest.findMany({
            where, orderBy: { createdAt: 'desc' }, take: 100,
            include: { user: { include: { profile: true } } },
        });
        return NextResponse.json({ items });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const item = await prisma.leaveRequest.create({
            data: {
                userId: body.userId || 'system',
                type: body.type || 'annual',
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                days: body.days || 1,
                reason: body.reason || '',
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
