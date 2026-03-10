/* ══════════════════════════════════════════════════════════
   Remark PM — Centralized Authentication & Authorization
   Provides helper functions for all API routes to verify
   sessions, roles, permissions, and department access.
   ══════════════════════════════════════════════════════════ */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ─── Types ───

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    roles: string[];
    permissions: string[];
    departments: string[];
    positionLevel: number;
}

export interface AuthSession {
    user: AuthUser;
}

// ─── Dev Mode Fallback User (CEO access for testing) ───

async function getDevFallbackSession(): Promise<AuthSession | null> {
    if (process.env.NODE_ENV === 'production') return null;
    // In dev, find the first CEO user for full access
    try {
        const user = await prisma.user.findFirst({
            include: { profile: true },
        });
        if (!user) return null;
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.profile?.fullName || user.email,
                role: 'ceo',
                roles: ['ceo'],
                permissions: ['*'],
                departments: ['*'],
                positionLevel: 4,
            },
        };
    } catch { return null; }
}

// ─── Core: Get Typed Session ───

export async function getAuthSession(): Promise<AuthSession | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        // Dev fallback: use first user as CEO
        return getDevFallbackSession();
    }

    const user = session.user as any;
    return {
        user: {
            id: user.id || '',
            email: user.email || '',
            name: user.name || '',
            role: user.role || 'viewer',
            roles: user.roles || [],
            permissions: user.permissions || [],
            departments: user.departments || [],
            positionLevel: user.positionLevel || 0,
        },
    };
}

// ─── Require Auth (returns session or 401 response) ───

export async function requireAuth(): Promise<
    { session: AuthSession; error?: never } | { session?: never; error: NextResponse }
> {
    const session = await getAuthSession();
    if (!session) {
        return {
            error: NextResponse.json(
                { error: 'غير مصرح — يرجى تسجيل الدخول', error_en: 'Unauthorized — please sign in' },
                { status: 401 }
            ),
        };
    }
    return { session };
}

// ─── Require Role ───

export async function requireRole(allowedRoles: string[]): Promise<
    { session: AuthSession; error?: never } | { session?: never; error: NextResponse }
> {
    const result = await requireAuth();
    if (result.error) return result;

    const { session } = result;
    const userRoles = session.user.roles;
    const primaryRole = session.user.role;

    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some(
        (r) => r === primaryRole || userRoles.includes(r)
    );

    if (!hasRole) {
        return {
            error: NextResponse.json(
                {
                    error: 'ليس لديك صلاحية للوصول',
                    error_en: 'Forbidden — insufficient role',
                    required: allowedRoles,
                },
                { status: 403 }
            ),
        };
    }

    return { session };
}

// ─── Require Permission ───

export async function requirePermission(permissionCode: string): Promise<
    { session: AuthSession; error?: never } | { session?: never; error: NextResponse }
> {
    const result = await requireAuth();
    if (result.error) return result;

    const { session } = result;

    // C-level users bypass permission checks
    if (['ceo', 'coo', 'admin'].includes(session.user.role)) {
        return { session };
    }

    // Wildcard permission (dev mode)
    if (session.user.permissions.includes('*')) {
        return { session };
    }

    // Check in-session permissions first (fast path)
    if (session.user.permissions.includes(permissionCode)) {
        return { session };
    }

    // Fallback: query DB for real-time permission check
    const hasPermission = await checkPermissionInDB(session.user.id, permissionCode);
    if (!hasPermission) {
        return {
            error: NextResponse.json(
                {
                    error: 'ليس لديك الصلاحية المطلوبة',
                    error_en: `Forbidden — requires permission: ${permissionCode}`,
                },
                { status: 403 }
            ),
        };
    }

    return { session };
}

// ─── Require Department ───

export async function requireDepartment(departmentId: string): Promise<
    { session: AuthSession; error?: never } | { session?: never; error: NextResponse }
> {
    const result = await requireAuth();
    if (result.error) return result;

    const { session } = result;

    // C-level can access all departments
    if (['ceo', 'coo', 'admin'].includes(session.user.role)) {
        return { session };
    }

    if (!session.user.departments.includes(departmentId)) {
        return {
            error: NextResponse.json(
                {
                    error: 'ليس لديك حق الوصول لهذا القسم',
                    error_en: 'Forbidden — not a member of this department',
                },
                { status: 403 }
            ),
        };
    }

    return { session };
}

// ─── DB Permission Check ───

async function checkPermissionInDB(userId: string, permissionCode: string): Promise<boolean> {
    const result = await prisma.rolePermission.findFirst({
        where: {
            permission: { code: permissionCode },
            role: {
                userRoles: {
                    some: { userId },
                },
            },
        },
    });
    return !!result;
}

// ─── Load Full User Permissions (for session enrichment) ───

export async function loadUserPermissions(userId: string): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
        where: {
            role: {
                userRoles: {
                    some: { userId },
                },
            },
        },
        include: { permission: true },
    });

    return [...new Set(rolePermissions.map((rp) => rp.permission.code))];
}

// ─── Load User Roles ───

export async function loadUserRoles(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
    });
    return userRoles.map((ur) => ur.role.name);
}

// ─── Load User Departments ───

export async function loadUserDepartments(userId: string): Promise<string[]> {
    const userDepts = await prisma.userDepartment.findMany({
        where: { userId },
        select: { departmentId: true },
    });
    return userDepts.map((ud) => ud.departmentId);
}

// ─── Audit Log Helper ───

export async function logAudit(
    userId: string | null,
    action: string,
    category: string,
    details: Record<string, any>,
    ipAddress?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                category,
                details: JSON.stringify(details),
                ipAddress: ipAddress || '',
            },
        });
    } catch (e) {
        console.error('[AuditLog] Failed to log:', e);
    }
}
