'use client';
/* ══════════════════════════════════════════════════════════
   useCreativeRequests — Creative requests from DB via API
   Replaces creativeStore singleton.
   ══════════════════════════════════════════════════════════ */

import { useFetch, apiMutate } from './useFetch';

export interface CreativeRequestData {
    id: string;
    clientId: string;
    campaignId: string | null;
    title: string;
    titleAr: string;
    category: string;
    brief: string;
    status: string;
    priority: string;
    assignedTo: string;
    conceptWriterId: string | null;
    executorId: string | null;
    platform: string;
    format: string;
    dueDate: string | null;
    reviewRound: number;
    conceptApproved: boolean;
    finalApproved: boolean;
    blocked: boolean;
    blockReason: string;
    linkedMarketingTaskId: string | null;
    linkedProductionJobId: string | null;
    syncStatus: string;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; name: string; nameAr: string; avatar: string };
    campaign?: { id: string; name: string; nameAr: string };
    conceptWriter?: { id: string; profile?: { fullName: string; fullNameAr: string; avatar: string } };
    executor?: { id: string; profile?: { fullName: string; fullNameAr: string; avatar: string } };
}

export function useCreativeRequests(clientId?: string) {
    const url = clientId
        ? `/api/creative-requests?clientId=${clientId}&take=200`
        : '/api/creative-requests?take=200';
    const { data, error, loading, refetch, mutate } = useFetch<CreativeRequestData[]>(url);

    const createRequest = async (body: Partial<CreativeRequestData>) => {
        const res = await apiMutate<CreativeRequestData>('/api/creative-requests', 'POST', body);
        if (!res.error) await refetch();
        return res;
    };

    const updateRequest = async (id: string, body: Partial<CreativeRequestData>) => {
        const res = await apiMutate<CreativeRequestData>(`/api/creative-requests/${id}`, 'PATCH', body);
        if (!res.error) await refetch();
        return res;
    };

    const deleteRequest = async (id: string) => {
        const res = await apiMutate(`/api/creative-requests/${id}`, 'DELETE');
        if (!res.error) await refetch();
        return res;
    };

    return { requests: data || [], error, loading, refetch, createRequest, updateRequest, deleteRequest, mutate };
}
