import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const where = category ? { category } : {};
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({ where, include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            prisma.auditLog.count({ where }),
        ]);
        return NextResponse.json({ logs, total, page, limit });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
