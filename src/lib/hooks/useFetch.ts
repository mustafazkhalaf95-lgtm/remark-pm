'use client';
/* ══════════════════════════════════════════════════════════
   useFetch — Lightweight data fetching hook (SWR-like)
   Single source of truth: API → React state.
   No localStorage for business data.
   ══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';

/** Prepend basePath to API URLs for production deployment */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function apiUrl(path: string): string {
    // Don't double-prefix if already prefixed, and skip external URLs
    if (path.startsWith('http') || path.startsWith(BASE_PATH)) return path;
    return `${BASE_PATH}${path}`;
}

export interface UseFetchResult<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    refetch: () => Promise<void>;
    mutate: (newData: T | ((prev: T | null) => T)) => void;
}

export function useFetch<T>(url: string | null, options?: RequestInit): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        if (!url) { setLoading(false); return; }
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl(url), { ...options, signal: ctrl.signal });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || body.error_en || `HTTP ${res.status}`);
            }
            const json = await res.json();
            // Auto-unwrap paginated responses { data: [...], total, take, skip }
            if (json && typeof json === 'object' && Array.isArray(json.data) && 'total' in json) {
                setData(json.data);
            } else {
                setData(json);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => { fetchData(); return () => abortRef.current?.abort(); }, [fetchData]);

    const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
        setData((prev) => typeof newData === 'function' ? (newData as any)(prev) : newData);
    }, []);

    return { data, error, loading, refetch: fetchData, mutate };
}

/* ── Mutation helper ── */
export async function apiMutate<T = any>(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: any
): Promise<{ data: T | null; error: string | null }> {
    try {
        const res = await fetch(apiUrl(url), {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { data: null, error: err.error || err.error_en || `HTTP ${res.status}` };
        }
        const data = method === 'DELETE' ? null : await res.json();
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
