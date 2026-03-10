import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) return NextResponse.json({ items: [] });
    const items = await prisma.clientPortalAccess.findMany({ where: { clientId }, include: { client: true } });
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const item = await prisma.clientPortalAccess.create({
            data: {
                clientId: body.clientId,
                email: body.email,
                name: body.name || '',
                permissions: body.permissions || 'view',
                isActive: true,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
