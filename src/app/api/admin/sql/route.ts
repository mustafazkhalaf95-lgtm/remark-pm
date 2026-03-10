/* ══════════════════════════════════════════════════════════
   Remark PM — Admin SQL Route (Hardened)
   Safe schema info and read-only queries for CEO/COO only.
   ══════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { requireRole, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ─── Allowed table names (whitelist — updated to match current schema) ───
const ALLOWED_TABLES = [
    'Organization', 'Department', 'DepartmentSetting', 'SystemSetting', 'IntegrationSetting',
    'User', 'UserProfile', 'Position', 'Role', 'Permission', 'RolePermission',
    'UserRole', 'UserDepartment', 'UserClient',
    'ApprovalAuthority', 'ApprovalPolicy',
    'Client', 'Campaign', 'MarketingTask', 'CreativeRequest', 'ProductionJob', 'PublishingItem',
    'Asset', 'Comment', 'Approval', 'Notification', 'ActivityLog', 'AuditLog',
];

function isValidTableName(name: string): boolean {
    return ALLOWED_TABLES.some((t) => t.toLowerCase() === name.toLowerCase());
}

function sanitizeIdentifier(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '');
}

// ─── Rate Limiting (simple in-memory) ───
const queryLog = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = queryLog.get(userId);
    if (!entry || now - entry.windowStart > RATE_WINDOW) {
        queryLog.set(userId, { count: 1, windowStart: now });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// GET /api/admin/sql — Safe schema info queries only
export async function GET(request: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    if (!checkRateLimit(auth.session.user.id)) {
        return NextResponse.json(
            { error: 'طلبات كثيرة — حاول بعد دقيقة', error_en: 'Rate limit exceeded' },
            { status: 429 }
        );
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

// POST /api/admin/sql — Safe read-only queries with hardened validation
export async function POST(request: Request) {
    const auth = await requireRole(['CEO', 'COO']);
    if (auth.error) return auth.error;

    if (!checkRateLimit(auth.session.user.id)) {
        return NextResponse.json(
            { error: 'طلبات كثيرة — حاول بعد دقيقة', error_en: 'Rate limit exceeded' },
            { status: 429 }
        );
    }

    try {
        const { query } = await request.json();
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'query required' }, { status: 400 });
        }

        const trimmed = query.trim();
        const upper = trimmed.toUpperCase();

        // SECURITY: Only allow SELECT and PRAGMA queries
        if (!upper.startsWith('SELECT') && !upper.startsWith('PRAGMA')) {
            return NextResponse.json(
                { error: 'Only SELECT and PRAGMA queries are allowed.' },
                { status: 403 }
            );
        }

        // SECURITY: Block dangerous patterns (including backticks)
        const dangerousPatterns = [
            /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)/i,
            /UNION\s+ALL\s+SELECT/i,
            /INTO\s+OUTFILE/i,
            /LOAD_FILE/i,
            /--\s/,
            /\/\*.*\*\//,
            /`/,
            /ATTACH\s+DATABASE/i,
            /DETACH\s+DATABASE/i,
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(trimmed)) {
                await logAudit(auth.session.user.id, 'blocked_sql_query', 'security', {
                    query: trimmed.substring(0, 200),
                    reason: 'Dangerous pattern detected',
                });
                return NextResponse.json(
                    { error: 'Query contains forbidden patterns' },
                    { status: 403 }
                );
            }
        }

        // SECURITY: Limit query length
        if (trimmed.length > 2000) {
            return NextResponse.json({ error: 'Query too long (max 2000 characters)' }, { status: 400 });
        }

        // Log the query for audit trail
        await logAudit(auth.session.user.id, 'sql_query', 'admin', {
            query: trimmed.substring(0, 500),
        });

        // Execute query
        const result = await prisma.$queryRawUnsafe(trimmed);

        // Handle BigInt serialization
        const serialized = JSON.parse(
            JSON.stringify(result, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
        );

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
