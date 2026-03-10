/* ══════════════════════════════════════════════════════════
   Remark PM — Custom React Hooks
   Database-backed hooks that replace localStorage stores.
   ══════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Generic Fetch Hook ───

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

function useFetch<T>(url: string, dependencies: any[] = []): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error_en || err.error || `HTTP ${res.status}`);
            }
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData, ...dependencies]);

    return { data, loading, error, refetch: fetchData };
}

// ─── Creative Requests Hook ───

export function useCreativeRequests(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters || {}).toString();
    const url = `/api/creative-requests${params ? `?${params}` : ''}`;
    const { data, loading, error, refetch } = useFetch<any>(url, [params]);

    const updateStatus = useCallback(async (id: string, newStatus: string) => {
        const res = await fetch(`/api/creative-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    const assignUser = useCallback(async (id: string, userId: string, role: 'conceptWriter' | 'executor') => {
        const field = role === 'conceptWriter' ? 'conceptWriterId' : 'executorId';
        const res = await fetch(`/api/creative-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: userId }),
        });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        requests: data?.data || [],
        total: data?.total || 0,
        loading,
        error,
        updateStatus,
        assignUser,
        refetch,
    };
}

// ─── Marketing Tasks Hook ───

export function useMarketingTasks(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters || {}).toString();
    const url = `/api/marketing-tasks${params ? `?${params}` : ''}`;
    const { data, loading, error, refetch } = useFetch<any>(url, [params]);

    const updateStatus = useCallback(async (id: string, newStatus: string) => {
        const res = await fetch(`/api/marketing-tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        tasks: data?.data || [],
        total: data?.total || 0,
        loading,
        error,
        updateStatus,
        refetch,
    };
}

// ─── Production Jobs Hook ───

export function useProductionJobs(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters || {}).toString();
    const url = `/api/production-jobs${params ? `?${params}` : ''}`;
    const { data, loading, error, refetch } = useFetch<any>(url, [params]);

    const updateStatus = useCallback(async (id: string, newStatus: string) => {
        const res = await fetch(`/api/production-jobs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        jobs: data?.data || [],
        total: data?.total || 0,
        loading,
        error,
        updateStatus,
        refetch,
    };
}

// ─── Publishing Items Hook ───

export function usePublishingItems(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters || {}).toString();
    const url = `/api/publishing-items${params ? `?${params}` : ''}`;
    const { data, loading, error, refetch } = useFetch<any>(url, [params]);

    const updateStatus = useCallback(async (id: string, newStatus: string) => {
        const res = await fetch(`/api/publishing-items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        items: data?.data || [],
        total: data?.total || 0,
        loading,
        error,
        updateStatus,
        refetch,
    };
}

// ─── Clients Hook ───

export function useClients(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters || {}).toString();
    const url = `/api/clients${params ? `?${params}` : ''}`;
    const { data, loading, error, refetch } = useFetch<any>(url, [params]);

    return {
        clients: data?.data || [],
        total: data?.total || 0,
        loading,
        error,
        refetch,
    };
}

// ─── Notifications Hook ───

export function useNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/notifications?take=20');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        await fetch(`/api/notifications/${id}`, { method: 'PUT' });
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return { notifications, unreadCount, loading, markAsRead, refetch: fetchNotifications };
}

// ─── Users Hook ───

export function useUsers() {
    const { data, loading, error, refetch } = useFetch<any[]>('/api/settings/users');

    return {
        users: data || [],
        loading,
        error,
        refetch,
    };
}
