import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, logAudit } from '@/lib/auth';

export async function GET() {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const positions = await prisma.position.findMany({ include: { _count: { select: { profiles: true } } }, orderBy: [{ category: 'asc' }, { level: 'desc' }, { title: 'asc' }] });
        return NextResponse.json(positions);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const pos = await prisma.position.create({ data: { title: body.title, titleAr: body.titleAr || '', category: body.category || 'staff', level: body.level || 0, description: body.description || '', descriptionAr: body.descriptionAr || '' } });

        await logAudit(auth.session.user.id, 'created', 'position', { positionId: pos.id, title: pos.title });

        return NextResponse.json(pos, { status: 201 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const updated = await prisma.position.update({ where: { id: body.id }, data: { title: body.title, titleAr: body.titleAr, category: body.category, level: body.level, description: body.description, descriptionAr: body.descriptionAr, isActive: body.isActive } });

        await logAudit(auth.session.user.id, 'updated', 'position', { positionId: body.id });

        return NextResponse.json(updated);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
    const auth = await requireRole(['ceo', 'coo', 'admin']);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        // Unlink profiles first
        await prisma.userProfile.updateMany({ where: { positionId: id }, data: { positionId: null } });
        await prisma.position.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'position', { positionId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
