import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const where: any = { isPublished: true };
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { titleAr: { contains: search } },
                { content: { contains: search } },
                { contentAr: { contains: search } },
            ];
        }
        const items = await prisma.wikiArticle.findMany({
            where, orderBy: { updatedAt: 'desc' }, take: 100,
            include: { author: { include: { profile: true } } },
        });
        return NextResponse.json({ items });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const slug = (body.title || body.titleAr || 'article').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
        const item = await prisma.wikiArticle.create({
            data: {
                title: body.title || '',
                titleAr: body.titleAr || '',
                slug,
                content: body.content || '',
                contentAr: body.contentAr || '',
                category: body.category || 'general',
                tags: JSON.stringify(body.tags || []),
                authorId: body.authorId || (await prisma.user.findFirst())?.id || '',
                isPublished: body.isPublished ?? true,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
