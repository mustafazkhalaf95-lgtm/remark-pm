import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// PATCH /api/automations/[id] — Toggle or update rule
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const data: any = {};
        if (body.enabled !== undefined) data.enabled = body.enabled;
        if (body.name) data.name = body.name;
        if (body.description !== undefined) data.description = body.description;
        if (body.triggerConfig) data.triggerConfig = JSON.stringify(body.triggerConfig);
        if (body.actions) data.actions = JSON.stringify(body.actions);

        const rule = await prisma.automationRule.update({
            where: { id },
            data,
        });
        return NextResponse.json(rule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/automations/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await prisma.automationRule.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/automations/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rule = await prisma.automationRule.findUnique({ where: { id } });
    if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rule);
}
