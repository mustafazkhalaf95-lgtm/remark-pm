'use client';
/* ══════════════════════════════════════════════════════════
   usePublishingItems — Publishing items from DB via API
   Replaces publishingStore singleton.
   ══════════════════════════════════════════════════════════ */

import { useFetch, apiMutate } from './useFetch';

export interface PublishingItemData {
    id: string;
    clientId: string;
    campaignId: string | null;
    title: string;
    titleAr: string;
    platform: string;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    content: string;
    mediaUrls: string;
    reviewerId: string | null;
    linkedProductionJobId: string | null;
    linkedCreativeRequestId: string | null;
    syncStatus: string;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; name: string; nameAr: string; avatar: string };
    campaign?: { id: string; name: string; nameAr: string };
    reviewer?: { id: string; profile?: { fullName: string; fullNameAr: string; avatar: string } };
}

export function usePublishingItems(clientId?: string) {
    const url = clientId
        ? `/api/publishing-items?clientId=${clientId}&take=200`
        : '/api/publishing-items?take=200';
    const { data, error, loading, refetch, mutate } = useFetch<PublishingItemData[]>(url);

    const createItem = async (body: Partial<PublishingItemData>) => {
        const res = await apiMutate<PublishingItemData>('/api/publishing-items', 'POST', body);
        if (!res.error) await refetch();
        return res;
    };

    const updateItem = async (id: string, body: Partial<PublishingItemData>) => {
        const res = await apiMutate<PublishingItemData>(`/api/publishing-items/${id}`, 'PATCH', body);
        if (!res.error) await refetch();
        return res;
    };

    const deleteItem = async (id: string) => {
        const res = await apiMutate(`/api/publishing-items/${id}`, 'DELETE');
        if (!res.error) await refetch();
        return res;
    };

    return { items: data || [], error, loading, refetch, createItem, updateItem, deleteItem, mutate };
}
