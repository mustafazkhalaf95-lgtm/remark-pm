import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/search/users?q=...
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const users = await prisma.user.findMany({
        where: q ? { name: { contains: q } } : {},
        select: { id: true, name: true, email: true, avatar: true, role: true },
        take: 10,
    });

    return NextResponse.json(users);
}
