import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search/users?q=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const users = await prisma.user.findMany({
        where: q ? { email: { contains: q } } : {},
        include: { profile: true },
        take: 10,
    });

    const mapped = users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.profile?.fullName || u.email,
        nameAr: u.profile?.fullNameAr || '',
        avatar: u.profile?.avatar || '',
        displayName: u.profile?.displayName || '',
    }));

    return NextResponse.json(mapped);
}
