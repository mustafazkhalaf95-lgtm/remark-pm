/* ══════════════════════════════════════════════════════════
   Remark PM — Store Compatibility Hooks
   Drop-in replacements for the old localStorage-based stores
   (creativeStore, productionStore, etc.) using API hooks.

   Board pages can switch to these with minimal refactoring.
   ══════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    useCreativeRequests,
    useMarketingTasks,
    useProductionJobs,
    usePublishingItems,
    useClients,
} from '@/lib/hooks';

// ─── Types ───

interface BoardItem {
    id: string;
    status: string;
    clientId: string;
    title: string;
    priority: string;
    [key: string]: any;
}

interface BoardStore<T extends BoardItem> {
    items: T[];
    loading: boolean;
    error: string | null;
    total: number;
    // Grouped by status for kanban view
    columns: Record<string, T[]>;
    // Actions
    updateStatus: (id: string, newStatus: string) => Promise<boolean>;
    createItem: (data: Partial<T>) => Promise<T | null>;
    deleteItem: (id: string) => Promise<boolean>;
    refetch: () => Promise<void>;
    // Filters
    filterByClient: (clientId: string | null) => void;
    filterByStatus: (status: string | null) => void;
    activeClientFilter: string | null;
    activeStatusFilter: string | null;
}

// ─── Marketing Board Store ───

export function useMarketingBoard(): BoardStore<any> {
    const [clientFilter, setClientFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filters: Record<string, string> = {};
    if (clientFilter) filters.clientId = clientFilter;
    if (statusFilter) filters.status = statusFilter;

    const { tasks, total, loading, error, updateStatus, refetch } = useMarketingTasks(filters);

    const columns = useMemo(() => groupByStatus(tasks, [
        'pending', 'in_progress', 'review', 'approved', 'completed',
    ]), [tasks]);

    const createItem = useCallback(async (data: any) => {
        try {
            const res = await fetch('/api/marketing-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const item = await res.json();
                await refetch();
                return item;
            }
            return null;
        } catch { return null; }
    }, [refetch]);

    const deleteItem = useCallback(async (id: string) => {
        const res = await fetch(`/api/marketing-tasks/${id}`, { method: 'DELETE' });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        items: tasks, loading, error, total, columns,
        updateStatus, createItem, deleteItem, refetch,
        filterByClient: setClientFilter,
        filterByStatus: setStatusFilter,
        activeClientFilter: clientFilter,
        activeStatusFilter: statusFilter,
    };
}

// ─── Creative Board Store ───

export function useCreativeBoard(): BoardStore<any> {
    const [clientFilter, setClientFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filters: Record<string, string> = {};
    if (clientFilter) filters.clientId = clientFilter;
    if (statusFilter) filters.status = statusFilter;

    const { requests, total, loading, error, updateStatus, refetch } = useCreativeRequests(filters);

    const columns = useMemo(() => groupByStatus(requests, [
        'new_request', 'brief_ready', 'concept_writing', 'concept_approval',
        'creative_execution', 'review_revisions', 'approved_ready',
    ]), [requests]);

    const createItem = useCallback(async (data: any) => {
        try {
            const res = await fetch('/api/creative-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const item = await res.json();
                await refetch();
                return item;
            }
            return null;
        } catch { return null; }
    }, [refetch]);

    const deleteItem = useCallback(async (id: string) => {
        const res = await fetch(`/api/creative-requests/${id}`, { method: 'DELETE' });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        items: requests, loading, error, total, columns,
        updateStatus, createItem, deleteItem, refetch,
        filterByClient: setClientFilter,
        filterByStatus: setStatusFilter,
        activeClientFilter: clientFilter,
        activeStatusFilter: statusFilter,
    };
}

// ─── Production Board Store ───

export function useProductionBoard(): BoardStore<any> {
    const [clientFilter, setClientFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filters: Record<string, string> = {};
    if (clientFilter) filters.clientId = clientFilter;
    if (statusFilter) filters.status = statusFilter;

    const { jobs, total, loading, error, updateStatus, refetch } = useProductionJobs(filters);

    const columns = useMemo(() => groupByStatus(jobs, [
        'pending', 'pre_production', 'shooting', 'post_production', 'review', 'delivered',
    ]), [jobs]);

    const createItem = useCallback(async (data: any) => {
        try {
            const res = await fetch('/api/production-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const item = await res.json();
                await refetch();
                return item;
            }
            return null;
        } catch { return null; }
    }, [refetch]);

    const deleteItem = useCallback(async (id: string) => {
        const res = await fetch(`/api/production-jobs/${id}`, { method: 'DELETE' });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        items: jobs, loading, error, total, columns,
        updateStatus, createItem, deleteItem, refetch,
        filterByClient: setClientFilter,
        filterByStatus: setStatusFilter,
        activeClientFilter: clientFilter,
        activeStatusFilter: statusFilter,
    };
}

// ─── Publishing Board Store ───

export function usePublishingBoard(): BoardStore<any> {
    const [clientFilter, setClientFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filters: Record<string, string> = {};
    if (clientFilter) filters.clientId = clientFilter;
    if (statusFilter) filters.status = statusFilter;

    const { items: pubItems, total, loading, error, updateStatus, refetch } = usePublishingItems(filters);

    const columns = useMemo(() => groupByStatus(pubItems, [
        'draft', 'scheduled', 'published', 'archived',
    ]), [pubItems]);

    const createItem = useCallback(async (data: any) => {
        try {
            const res = await fetch('/api/publishing-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const item = await res.json();
                await refetch();
                return item;
            }
            return null;
        } catch { return null; }
    }, [refetch]);

    const deleteItem = useCallback(async (id: string) => {
        const res = await fetch(`/api/publishing-items/${id}`, { method: 'DELETE' });
        if (res.ok) await refetch();
        return res.ok;
    }, [refetch]);

    return {
        items: pubItems, loading, error, total, columns,
        updateStatus, createItem, deleteItem, refetch,
        filterByClient: setClientFilter,
        filterByStatus: setStatusFilter,
        activeClientFilter: clientFilter,
        activeStatusFilter: statusFilter,
    };
}

// ─── Helper: Group Items by Status for Kanban ───

function groupByStatus<T extends BoardItem>(
    items: T[],
    statusOrder: string[]
): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    for (const status of statusOrder) {
        grouped[status] = [];
    }
    for (const item of items) {
        if (grouped[item.status]) {
            grouped[item.status].push(item);
        } else {
            grouped[item.status] = [item];
        }
    }
    return grouped;
}
