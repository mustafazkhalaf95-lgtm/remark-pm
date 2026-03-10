import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    if (clientId) {
        const score = await prisma.leadScore.findUnique({ where: { clientId }, include: { client: true } });
        return NextResponse.json(score || { score: 0 });
    }
    const items = await prisma.leadScore.findMany({ orderBy: { score: 'desc' }, include: { client: true } });
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const item = await prisma.leadScore.upsert({
            where: { clientId: body.clientId },
            update: {
                score: body.score || 0,
                engagement: body.engagement || 0,
                budget: body.budget || 0,
                urgency: body.urgency || 0,
                fit: body.fit || 0,
                lastCalculated: new Date(),
            },
            create: {
                clientId: body.clientId,
                score: body.score || 0,
                engagement: body.engagement || 0,
                budget: body.budget || 0,
                urgency: body.urgency || 0,
                fit: body.fit || 0,
            },
        });
        return NextResponse.json(item);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
