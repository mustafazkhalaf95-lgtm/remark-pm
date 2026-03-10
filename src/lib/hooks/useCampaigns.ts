'use client';
/* ══════════════════════════════════════════════════════════
   useCampaigns — Campaigns from DB via API
   Replaces hardcoded campaign arrays in stores.
   ══════════════════════════════════════════════════════════ */

import { useFetch, apiMutate } from './useFetch';

export interface CampaignData {
    id: string;
    clientId: string;
    name: string;
    nameAr: string;
    description: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    budget: string;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; name: string; nameAr: string; avatar: string };
    marketingTasks?: any[];
    creativeRequests?: any[];
    productionJobs?: any[];
    publishingItems?: any[];
}

export function useCampaigns(clientId?: string) {
    const url = clientId
        ? `/api/campaigns?clientId=${clientId}&take=100`
        : '/api/campaigns?take=100';
    const { data, error, loading, refetch, mutate } = useFetch<CampaignData[]>(url);

    const createCampaign = async (body: Partial<CampaignData>) => {
        const res = await apiMutate<CampaignData>('/api/campaigns', 'POST', body);
        if (!res.error) await refetch();
        return res;
    };

    const updateCampaign = async (id: string, body: Partial<CampaignData>) => {
        const res = await apiMutate<CampaignData>(`/api/campaigns/${id}`, 'PATCH', body);
        if (!res.error) await refetch();
        return res;
    };

    return { campaigns: data || [], error, loading, refetch, createCampaign, updateCampaign, mutate };
}
