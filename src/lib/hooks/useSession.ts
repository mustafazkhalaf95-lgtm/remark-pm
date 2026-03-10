'use client';
/* ══════════════════════════════════════════════════════════
   useSession — Current authenticated user session
   Replaces localStorage-based active user in teamStore.
   ══════════════════════════════════════════════════════════ */

import { useSession as useNextAuthSession } from 'next-auth/react';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: string;
    roles: string[];
    permissions: string[];
    departments: string[];
    positionLevel: number;
}

export function useCurrentUser() {
    const { data: session, status } = useNextAuthSession();

    if (status === 'loading') return { user: null, loading: true, authenticated: false };
    if (!session?.user) return { user: null, loading: false, authenticated: false };

    const u = session.user as any;
    const user: SessionUser = {
        id: u.id || '',
        email: u.email || '',
        name: u.name || '',
        role: u.role || 'viewer',
        roles: u.roles || [],
        permissions: u.permissions || [],
        departments: u.departments || [],
        positionLevel: u.positionLevel || 0,
    };

    return { user, loading: false, authenticated: true };
}

export function useHasPermission(permissionCode: string): boolean {
    const { user } = useCurrentUser();
    if (!user) return false;
    if (['ceo', 'coo', 'admin'].includes(user.role)) return true;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permissionCode);
}

export function useHasRole(roles: string[]): boolean {
    const { user } = useCurrentUser();
    if (!user) return false;
    return roles.includes(user.role) || user.roles.some(r => roles.includes(r));
}
