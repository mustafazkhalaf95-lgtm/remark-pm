import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const roles = await prisma.role.findMany({
            include: { permissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
            orderBy: { name: 'asc' },
        });
        const permissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { category: 'asc' }] });
        return NextResponse.json({ roles, permissions });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const role = await prisma.role.create({ data: { name: body.name, nameAr: body.nameAr || '', description: body.description || '', descriptionAr: body.descriptionAr || '', scope: body.scope || 'department' } });
        if (body.permissionIds && Array.isArray(body.permissionIds)) {
            for (const pid of body.permissionIds) {
                await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: pid } });
            }
        }

        await logAudit(auth.session.user.id, 'created', 'role', { roleId: role.id, name: role.name });

        return NextResponse.json(role, { status: 201 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        await prisma.role.update({ where: { id: body.id }, data: { name: body.name, nameAr: body.nameAr, description: body.description, descriptionAr: body.descriptionAr, scope: body.scope, isActive: body.isActive } });
        // Update permissions
        if (body.permissionIds && Array.isArray(body.permissionIds)) {
            await prisma.rolePermission.deleteMany({ where: { roleId: body.id } });
            for (const pid of body.permissionIds) {
                await prisma.rolePermission.create({ data: { roleId: body.id, permissionId: pid } });
            }
        }
        const updated = await prisma.role.findUnique({ where: { id: body.id }, include: { permissions: { include: { permission: true } }, _count: { select: { userRoles: true } } } });

        await logAudit(auth.session.user.id, 'updated', 'role', { roleId: body.id });

        return NextResponse.json(updated);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const role = await prisma.role.findUnique({ where: { id } });
        if (role?.isSystem) return NextResponse.json({ error: 'لا يمكن حذف دور نظامي' }, { status: 403 });
        await prisma.rolePermission.deleteMany({ where: { roleId: id } });
        await prisma.userRole.deleteMany({ where: { roleId: id } });
        await prisma.role.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'role', { roleId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
