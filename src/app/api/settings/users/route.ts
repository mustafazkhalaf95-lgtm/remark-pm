import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const users = await prisma.user.findMany({
            include: {
                profile: { include: { position: true } },
                userRoles: { include: { role: true } },
                userDepartments: { include: { department: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(users);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const hashedPassword = body.password ? await bcrypt.hash(body.password, 12) : '';

        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: hashedPassword,
                status: body.status || 'active',
                profile: {
                    create: {
                        fullName: body.fullName, fullNameAr: body.fullNameAr || '', displayName: body.displayName || '', displayNameAr: body.displayNameAr || '',
                        avatar: body.avatar || '', phone: body.phone || '', employeeCode: body.employeeCode || '', bio: body.bio || '',
                        positionId: body.positionId || null, reportingToId: body.reportingToId || null,
                    },
                },
            },
            include: { profile: true },
        });
        // Assign role
        if (body.roleId) {
            await prisma.userRole.create({ data: { userId: user.id, roleId: body.roleId, isPrimary: true } });
        }
        // Assign department
        if (body.departmentId) {
            await prisma.userDepartment.create({ data: { userId: user.id, departmentId: body.departmentId, isPrimary: true } });
        }

        await logAudit(auth.session.user.id, 'created', 'user', { userId: user.id, email: user.email });

        return NextResponse.json(user, { status: 201 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['CEO', 'COO', 'HR_MANAGER']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await prisma.user.update({ where: { id: body.id }, data: { email: body.email, status: body.status } });

        if (body.profile) {
            await prisma.userProfile.upsert({
                where: { userId: body.id },
                update: { fullName: body.profile.fullName, fullNameAr: body.profile.fullNameAr, displayName: body.profile.displayName, displayNameAr: body.profile.displayNameAr, avatar: body.profile.avatar, phone: body.profile.phone, employeeCode: body.profile.employeeCode, bio: body.profile.bio, positionId: body.profile.positionId || null, reportingToId: body.profile.reportingToId || null },
                create: { userId: body.id, fullName: body.profile.fullName || '', fullNameAr: body.profile.fullNameAr || '' },
            });
        }

        // Update role
        if (body.roleId) {
            await prisma.userRole.deleteMany({ where: { userId: body.id } });
            await prisma.userRole.create({ data: { userId: body.id, roleId: body.roleId, isPrimary: true } });
        }

        // Update department
        if (body.departmentId) {
            await prisma.userDepartment.deleteMany({ where: { userId: body.id } });
            await prisma.userDepartment.create({ data: { userId: body.id, departmentId: body.departmentId, isPrimary: true } });
        }

        const updated = await prisma.user.findUnique({
            where: { id: body.id },
            include: { profile: { include: { position: true } }, userRoles: { include: { role: true } }, userDepartments: { include: { department: true } } },
        });

        await logAudit(auth.session.user.id, 'updated', 'user', { userId: body.id });

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
        await prisma.userRole.deleteMany({ where: { userId: id } });
        await prisma.userDepartment.deleteMany({ where: { userId: id } });
        await prisma.userProfile.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'user', { userId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
