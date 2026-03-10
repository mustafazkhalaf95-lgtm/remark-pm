'use client';
/* ══════════════════════════════════════════════════════════
   useUsers — Team members from DB via API
   Replaces hardcoded TEAM constant in teamStore.
   ══════════════════════════════════════════════════════════ */

import { useFetch } from './useFetch';

export interface UserData {
    id: string;
    email: string;
    status: string;
    name: string;
    nameAr: string;
    displayName: string;
    avatar: string;
    employeeCode: string;
    position: string;
    positionAr: string;
    role: string;
    roleAr: string;
    department: string;
    departmentAr: string;
}

export function useUsers() {
    const { data, error, loading, refetch } = useFetch<UserData[]>('/api/admin/users');
    return { users: data || [], error, loading, refetch };
}

export function useUser(id: string | null) {
    const { data, error, loading, refetch } = useFetch<UserData>(id ? `/api/admin/users?id=${id}` : null);
    return { user: data, error, loading, refetch };
}
