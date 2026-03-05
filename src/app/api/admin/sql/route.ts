import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Execute raw SQL queries (Admin only)
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (userRole !== 'CEO' && userRole !== 'COO') {
        return NextResponse.json({ error: 'Only CEO/COO can access SQL admin' }, { status: 403 });
    }

    try {
        const { query, type } = await request.json();
        if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

        const trimmed = query.trim().toUpperCase();
        const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA');

        if (type === 'query' || isSelect) {
            const result = await prisma.$queryRawUnsafe(query);
            // Handle BigInt serialization
            const serialized = JSON.parse(JSON.stringify(result, (_, v) => typeof v === 'bigint' ? Number(v) : v));
            return NextResponse.json({ success: true, type: 'query', data: serialized, rowCount: Array.isArray(serialized) ? serialized.length : 0 });
        } else {
            // For INSERT, UPDATE, DELETE, ALTER, CREATE
            const result = await prisma.$executeRawUnsafe(query);
            return NextResponse.json({ success: true, type: 'execute', affectedRows: result });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// Get database schema info
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (userRole !== 'CEO' && userRole !== 'COO') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'tables';

        if (action === 'tables') {
            const tables: any[] = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`);
            return NextResponse.json({ tables });
        }

        if (action === 'schema') {
            const table = searchParams.get('table');
            if (!table) return NextResponse.json({ error: 'table param required' }, { status: 400 });
            const columns: any[] = await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
            const count: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
            return NextResponse.json({ table, columns, rowCount: count[0]?.count || 0 });
        }

        if (action === 'stats') {
            const tables: any[] = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`);
            const stats = [];
            for (const t of tables) {
                const count: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${t.name}"`);
                stats.push({ name: t.name, count: Number(count[0]?.count || 0) });
            }
            return NextResponse.json({ stats });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
