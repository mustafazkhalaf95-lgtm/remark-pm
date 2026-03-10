'use client';
/* ══════════════════════════════════════════════════════════
   useMarketingTasks — Marketing tasks from DB via API
   Replaces localStorage marketing pipeline.
   ══════════════════════════════════════════════════════════ */

import { useFetch, apiMutate } from './useFetch';

export interface MarketingTaskData {
    id: string;
    clientId: string;
    campaignId: string | null;
    title: string;
    titleAr: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string;
    assigneeId: string | null;
    platform: string;
    contentType: string;
    dueDate: string | null;
    completedAt: string | null;
    linkedCreativeRequestId: string | null;
    syncStatus: string;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; name: string; nameAr: string; avatar: string };
    campaign?: { id: string; name: string; nameAr: string };
    assignee?: { id: string; profile?: { fullName: string; fullNameAr: string; avatar: string } };
}

export function useMarketingTasks(clientId?: string) {
    const url = clientId
        ? `/api/marketing-tasks?clientId=${clientId}&take=200`
        : '/api/marketing-tasks?take=200';
    const { data, error, loading, refetch, mutate } = useFetch<MarketingTaskData[]>(url);

    const createTask = async (body: Partial<MarketingTaskData>) => {
        const res = await apiMutate<MarketingTaskData>('/api/marketing-tasks', 'POST', body);
        if (!res.error) await refetch();
        return res;
    };

    const updateTask = async (id: string, body: Partial<MarketingTaskData>) => {
        const res = await apiMutate<MarketingTaskData>(`/api/marketing-tasks/${id}`, 'PATCH', body);
        if (!res.error) await refetch();
        return res;
    };

    const deleteTask = async (id: string) => {
        const res = await apiMutate(`/api/marketing-tasks/${id}`, 'DELETE');
        if (!res.error) await refetch();
        return res;
    };

    return { tasks: data || [], error, loading, refetch, createTask, updateTask, deleteTask, mutate };
}
