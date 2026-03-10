import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const departments = await prisma.department.findMany({
            include: {
                headUser: { include: { profile: true } },
                _count: { select: { userDepartments: true } },
                settings: true,
            },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(departments);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const org = await prisma.organization.findFirst();
        if (!org) return NextResponse.json({ error: 'No organization' }, { status: 404 });
        const dept = await prisma.department.create({
            data: { name: body.name, nameAr: body.nameAr || '', slug: body.slug, description: body.description || '', descriptionAr: body.descriptionAr || '', color: body.color || '#6366f1', icon: body.icon || '📋', organizationId: org.id },
        });

        await logAudit(auth.session.user.id, 'created', 'department', { departmentId: dept.id, name: dept.name });

        return NextResponse.json(dept, { status: 201 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const updated = await prisma.department.update({
            where: { id: body.id },
            data: { name: body.name, nameAr: body.nameAr, description: body.description, descriptionAr: body.descriptionAr, color: body.color, icon: body.icon, isActive: body.isActive, headUserId: body.headUserId || null },
        });

        await logAudit(auth.session.user.id, 'updated', 'department', { departmentId: body.id });

        return NextResponse.json(updated);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        await prisma.userDepartment.deleteMany({ where: { departmentId: id } });
        await prisma.departmentSetting.deleteMany({ where: { departmentId: id } });
        await prisma.department.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'department', { departmentId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
