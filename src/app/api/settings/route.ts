import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const org = await prisma.organization.findFirst({
            include: { settings: true, integrations: true },
        });
        const departments = await prisma.department.findMany({
            include: { _count: { select: { userDepartments: true } } },
            orderBy: { name: 'asc' },
        });
        const userCount = await prisma.user.count();
        const clientCount = await prisma.client.count();
        const roleCount = await prisma.role.count();
        const positionCount = await prisma.position.count();
        return NextResponse.json({ org, departments, userCount, clientCount, roleCount, positionCount });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
