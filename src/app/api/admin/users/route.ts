import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET — List all users with profiles and roles
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                profile: { include: { position: true } },
                userRoles: { include: { role: true } },
                userDepartments: { include: { department: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const mapped = users.map(u => ({
            id: u.id,
            email: u.email,
            status: u.status,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
            name: u.profile?.fullName || u.email,
            nameAr: u.profile?.fullNameAr || '',
            displayName: u.profile?.displayName || '',
            avatar: u.profile?.avatar || '',
            employeeCode: u.profile?.employeeCode || '',
            position: u.profile?.position?.title || '',
            positionAr: u.profile?.position?.titleAr || '',
            role: u.userRoles.find(r => r.isPrimary)?.role?.name || 'staff',
            roleAr: u.userRoles.find(r => r.isPrimary)?.role?.nameAr || 'موظف',
            department: u.userDepartments.find(d => d.isPrimary)?.department?.name || '',
            departmentAr: u.userDepartments.find(d => d.isPrimary)?.department?.nameAr || '',
        }));

        return NextResponse.json(mapped);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST — Create a new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, fullName, fullNameAr, displayName, roleName, departmentSlug } = body;

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'البريد والكلمة السرية والاسم مطلوبة' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: passwordHash, status: 'active' },
        });

        // Create profile
        await prisma.userProfile.create({
            data: {
                userId: user.id,
                fullName,
                fullNameAr: fullNameAr || '',
                displayName: displayName || fullName,
            },
        });

        // Assign role
        if (roleName) {
            const role = await prisma.role.findFirst({ where: { name: roleName } });
            if (role) {
                await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, isPrimary: true } });
            }
        }

        // Assign department
        if (departmentSlug) {
            const dept = await prisma.department.findUnique({ where: { slug: departmentSlug } });
            if (dept) {
                await prisma.userDepartment.create({ data: { userId: user.id, departmentId: dept.id, isPrimary: true } });
            }
        }

        return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'خطأ في إنشاء المستخدم' }, { status: 500 });
    }
}

// PUT — Update a user
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, email, status, password, fullName, fullNameAr, displayName } = body;
        if (!id) return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });

        const userData: any = {};
        if (email !== undefined) userData.email = email;
        if (status !== undefined) userData.status = status;
        if (password) userData.password = await bcrypt.hash(password, 12);

        await prisma.user.update({ where: { id }, data: userData });

        // Update profile if provided
        if (fullName || fullNameAr || displayName) {
            const profileData: any = {};
            if (fullName) profileData.fullName = fullName;
            if (fullNameAr) profileData.fullNameAr = fullNameAr;
            if (displayName) profileData.displayName = displayName;
            await prisma.userProfile.updateMany({ where: { userId: id }, data: profileData });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'خطأ في تحديث المستخدم' }, { status: 500 });
    }
}

// DELETE — Remove a user
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'خطأ في حذف المستخدم' }, { status: 500 });
    }
}
