import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const org = await prisma.organization.findFirst({ include: { settings: true } });
        return NextResponse.json(org);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const org = await prisma.organization.findFirst();
        if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        const updated = await prisma.organization.update({
            where: { id: org.id },
            data: { name: body.name, nameAr: body.nameAr, timezone: body.timezone, language: body.language, workWeek: body.workWeek, logo: body.logo },
        });
        // Update system settings if provided
        if (body.settings && Array.isArray(body.settings)) {
            for (const s of body.settings) {
                await prisma.systemSetting.upsert({
                    where: { organizationId_key: { organizationId: org.id, key: s.key } },
                    update: { value: s.value, category: s.category || 'general' },
                    create: { organizationId: org.id, key: s.key, value: s.value, category: s.category || 'general' },
                });
            }
        }

        await logAudit(auth.session.user.id, 'updated', 'organization', { organizationId: org.id });

        return NextResponse.json(updated);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
