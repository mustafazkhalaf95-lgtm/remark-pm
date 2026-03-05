import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/automations
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const wm = await prisma.workspaceMember.findFirst({ where: { userId } });
    if (!wm) return NextResponse.json([]);

    const rules = await prisma.automationRule.findMany({
        where: { workspaceId: wm.workspaceId },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(rules);
}

// POST /api/automations
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const wm = await prisma.workspaceMember.findFirst({ where: { userId } });
    if (!wm) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

    const { name, description, trigger, triggerConfig, actions, enabled } = await request.json();

    const rule = await prisma.automationRule.create({
        data: {
            name, description, trigger,
            triggerConfig: JSON.stringify(triggerConfig || {}),
            actions: JSON.stringify(actions || []),
            enabled: enabled ?? true,
            workspaceId: wm.workspaceId,
        },
    });

    return NextResponse.json(rule, { status: 201 });
}
