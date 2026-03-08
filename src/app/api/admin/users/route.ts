import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function requireSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const role = (session.user as any).role;
    if (role !== 'CEO') return null;
    return session;
}

// GET — List all users
export async function GET() {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            enabled: true,
            image: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(users);
}

// POST — Create a new user
export async function POST(request: Request) {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { name, email, password, role } = await request.json();
        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, password: passwordHash, role },
            select: { id: true, name: true, email: true, role: true, createdAt: true, enabled: true },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'خطأ في إنشاء المستخدم' }, { status: 500 });
    }
}

// PUT — Update a user
export async function PUT(request: Request) {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { id, name, email, role, enabled, password } = await request.json();
        if (!id) return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (role !== undefined) data.role = role;
        if (enabled !== undefined) data.enabled = enabled;
        if (password) data.password = await bcrypt.hash(password, 12);

        const user = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, name: true, email: true, role: true, createdAt: true, enabled: true },
        });

        return NextResponse.json(user);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'خطأ في تحديث المستخدم' }, { status: 500 });
    }
}

// DELETE — Remove a user
export async function DELETE(request: Request) {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });

        if ((session.user as any).id === id) {
            return NextResponse.json({ error: 'لا يمكنك حذف حسابك الشخصي' }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'خطأ في حذف المستخدم' }, { status: 500 });
    }
}
