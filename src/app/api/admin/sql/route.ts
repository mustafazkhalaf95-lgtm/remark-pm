import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ─── Allowed table names (whitelist to prevent SQL injection) ───
const ALLOWED_TABLES = [
    'User', 'Workspace', 'WorkspaceMember', 'Board', 'List', 'Card',
    'CardAssignee', 'CardMirror', 'TaskPhase', 'Label', 'CardLabel',
    'CustomField', 'CardFieldValue', 'Brief', 'Comment', 'Attachment',
    'ActivityLog', 'Notification', 'AutomationRule', 'Channel',
    'ChannelMember', 'ChatMessage', 'Mention',
];

function isValidTableName(name: string): boolean {
    return ALLOWED_TABLES.some(t => t.toLowerCase() === name.toLowerCase());
}

function sanitizeIdentifier(name: string): string {
    // Only allow alphanumeric and underscore characters
    return name.replace(/[^a-zA-Z0-9_]/g, '');
}

// GET /api/admin/sql — Safe schema info queries only
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
            const tables: any[] = await prisma.$queryRawUnsafe(
                `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`
            );
            return NextResponse.json({ tables });
        }

        if (action === 'schema') {
            const table = searchParams.get('table');
            if (!table) return NextResponse.json({ error: 'table param required' }, { status: 400 });

            // Validate table name against whitelist
            if (!isValidTableName(table)) {
                return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
            }
            const safeTable = sanitizeIdentifier(table);

            const columns: any[] = await prisma.$queryRawUnsafe(`PRAGMA table_info("${safeTable}")`);
            const count: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${safeTable}"`);
            return NextResponse.json({ table: safeTable, columns, rowCount: count[0]?.count || 0 });
        }

        if (action === 'stats') {
            const tables: any[] = await prisma.$queryRawUnsafe(
                `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`
            );
            const stats: { name: string; count: number }[] = [];
            for (const t of tables) {
                if (!isValidTableName(t.name)) continue;
                const safeName = sanitizeIdentifier(t.name);
                const count: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${safeName}"`);
                stats.push({ name: t.name, count: Number(count[0]?.count || 0) });
            }
            return NextResponse.json({ stats });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('[Admin SQL GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/sql — Safe read-only queries with whitelist validation
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (userRole !== 'CEO' && userRole !== 'COO') {
        return NextResponse.json({ error: 'Only CEO/COO can access SQL admin' }, { status: 403 });
    }

    try {
        const { query } = await request.json();
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'query required' }, { status: 400 });
        }

        const trimmed = query.trim();
        const upper = trimmed.toUpperCase();

        // ─── SECURITY: Only allow SELECT and PRAGMA queries ───
        if (!upper.startsWith('SELECT') && !upper.startsWith('PRAGMA')) {
            return NextResponse.json(
                { error: 'Only SELECT and PRAGMA queries are allowed. Use the application UI for data modifications.' },
                { status: 403 }
            );
        }

        // ─── SECURITY: Block dangerous patterns ───
        const dangerousPatterns = [
            /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)/i,
            /UNION\s+ALL\s+SELECT/i,
            /INTO\s+OUTFILE/i,
            /LOAD_FILE/i,
            /--\s/,        // SQL comment injection
            /\/\*.*\*\//,  // Block comment injection
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(trimmed)) {
                return NextResponse.json(
                    { error: 'Query contains forbidden patterns' },
                    { status: 403 }
                );
            }
        }

        // ─── SECURITY: Limit query length ───
        if (trimmed.length > 2000) {
            return NextResponse.json({ error: 'Query too long (max 2000 characters)' }, { status: 400 });
        }

        const result = await prisma.$queryRawUnsafe(trimmed);
        // Handle BigInt serialization
        const serialized = JSON.parse(JSON.stringify(result, (_, v) => typeof v === 'bigint' ? Number(v) : v));
        return NextResponse.json({
            success: true,
            type: 'query',
            data: serialized,
            rowCount: Array.isArray(serialized) ? serialized.length : 0,
        });
    } catch (error: any) {
        console.error('[Admin SQL POST]', error);
        return NextResponse.json({ success: false, error: 'Query execution failed' }, { status: 400 });
    }
}
