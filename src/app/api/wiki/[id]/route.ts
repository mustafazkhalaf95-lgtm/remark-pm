import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const item = await prisma.wikiArticle.update({
        where: { id }, data: { viewCount: { increment: 1 } },
        include: { author: { include: { profile: true } } },
    });
    return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.titleAr !== undefined) data.titleAr = body.titleAr;
    if (body.content !== undefined) data.content = body.content;
    if (body.contentAr !== undefined) data.contentAr = body.contentAr;
    if (body.category !== undefined) data.category = body.category;
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;
    const item = await prisma.wikiArticle.update({ where: { id }, data });
    return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await prisma.wikiArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
