import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const policies = await prisma.approvalPolicy.findMany({ orderBy: { workflow: 'asc' } });
        const authorities = await prisma.approvalAuthority.findMany({ include: { user: { include: { profile: true } } } });
        return NextResponse.json({ policies, authorities });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (body.type === 'policy') {
            const policy = await prisma.approvalPolicy.create({ data: { name: body.name, nameAr: body.nameAr || '', workflow: body.workflow, stage: body.stage || '', description: body.description || '', descriptionAr: body.descriptionAr || '', minApprovals: body.minApprovals || 1 } });

            await logAudit(auth.session.user.id, 'created', 'approval_policy', { policyId: policy.id, name: policy.name });

            return NextResponse.json(policy, { status: 201 });
        } else {
            const authority = await prisma.approvalAuthority.create({ data: { userId: body.userId, scope: body.scope, scopeAr: body.scopeAr || '', level: body.level || 1 } });

            await logAudit(auth.session.user.id, 'created', 'approval_authority', { authorityId: authority.id });

            return NextResponse.json(authority, { status: 201 });
        }
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (body.type === 'policy') {
            const updated = await prisma.approvalPolicy.update({ where: { id: body.id }, data: { name: body.name, nameAr: body.nameAr, workflow: body.workflow, stage: body.stage, description: body.description, descriptionAr: body.descriptionAr, minApprovals: body.minApprovals, isActive: body.isActive } });

            await logAudit(auth.session.user.id, 'updated', 'approval_policy', { policyId: body.id });

            return NextResponse.json(updated);
        } else {
            const updated = await prisma.approvalAuthority.update({ where: { id: body.id }, data: { scope: body.scope, scopeAr: body.scopeAr, level: body.level } });

            await logAudit(auth.session.user.id, 'updated', 'approval_authority', { authorityId: body.id });

            return NextResponse.json(updated);
        }
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type') || 'policy';
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        if (type === 'authority') {
            await prisma.approvalAuthority.delete({ where: { id } });

            await logAudit(auth.session.user.id, 'deleted', 'approval_authority', { authorityId: id });
        } else {
            await prisma.approvalPolicy.delete({ where: { id } });

            await logAudit(auth.session.user.id, 'deleted', 'approval_policy', { policyId: id });
        }
        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
