import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) return NextResponse.json({ items: [] });
    const items = await prisma.clientFeedback.findMany({
        where: { clientId }, orderBy: { createdAt: 'desc' }, take: 50,
        include: { client: true },
    });
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const item = await prisma.clientFeedback.create({
            data: {
                clientId: body.clientId,
                portalAccessId: body.portalAccessId || null,
                entityType: body.entityType || 'general',
                entityId: body.entityId || '',
                content: body.content || '',
                rating: body.rating || null,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
