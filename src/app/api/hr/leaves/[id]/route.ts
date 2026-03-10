import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const item = await prisma.leaveRequest.findUnique({ where: { id }, include: { user: { include: { profile: true } } } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.status) {
        data.status = body.status;
        if (body.status === 'approved') data.approvedAt = new Date();
    }
    if (body.reason !== undefined) data.reason = body.reason;
    const item = await prisma.leaveRequest.update({ where: { id }, data });
    return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await prisma.leaveRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
