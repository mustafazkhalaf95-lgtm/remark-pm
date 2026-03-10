import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const org = await prisma.organization.findFirst();
        if (!org) return NextResponse.json([]);
        const integrations = await prisma.integrationSetting.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' } });
        return NextResponse.json(integrations);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const org = await prisma.organization.findFirst();
        if (!org) return NextResponse.json({ error: 'No organization' }, { status: 404 });
        const integration = await prisma.integrationSetting.create({
            data: {
                organizationId: org.id,
                name: body.name,
                nameAr: body.nameAr || '',
                provider: body.provider || '',
                isEnabled: body.isEnabled ?? false,
                config: typeof body.config === 'string' ? body.config : JSON.stringify(body.config || {}),
            },
        });

        await logAudit(auth.session.user.id, 'created', 'integration', { integrationId: integration.id, name: integration.name });

        return NextResponse.json(integration, { status: 201 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const updated = await prisma.integrationSetting.update({ where: { id: body.id }, data: { isEnabled: body.isEnabled, config: typeof body.config === 'string' ? body.config : JSON.stringify(body.config) } });

        await logAudit(auth.session.user.id, 'updated', 'integration', { integrationId: body.id });

        return NextResponse.json(updated);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        await prisma.integrationSetting.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'integration', { integrationId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
