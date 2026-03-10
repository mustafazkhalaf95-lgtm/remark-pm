import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const period = searchParams.get('period');
        const where: any = {};
        if (userId) where.userId = userId;
        if (period) where.period = period;

        const items = await prisma.performanceReview.findMany({
            where, orderBy: { createdAt: 'desc' }, take: 100,
            include: {
                user: { include: { profile: true } },
                reviewer: { include: { profile: true } },
            },
        });
        return NextResponse.json({ items });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const item = await prisma.performanceReview.create({
            data: {
                userId: body.userId,
                reviewerId: body.reviewerId || body.userId,
                period: body.period || '',
                rating: body.rating || 0,
                strengths: body.strengths || '',
                improvements: body.improvements || '',
                goals: body.goals || '',
                status: body.status || 'draft',
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
