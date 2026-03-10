'use client';
/* ══════════════════════════════════════════════════════════
   useClients — Client data from DB via API
   Replaces hardcoded client arrays in localStorage stores.
   ══════════════════════════════════════════════════════════ */

import { useFetch, apiMutate } from './useFetch';

export interface ClientData {
    id: string;
    name: string;
    nameAr: string;
    sector: string;
    sectorAr: string;
    planType: string;
    budget: string;
    avatar: string;
    status: string;
    createdAt: string;
}

export function useClients() {
    const { data, error, loading, refetch, mutate } = useFetch<ClientData[]>('/api/clients?take=100');

    const createClient = async (body: Partial<ClientData>) => {
        const res = await apiMutate<ClientData>('/api/clients', 'POST', body);
        if (!res.error) await refetch();
        return res;
    };

    const updateClient = async (id: string, body: Partial<ClientData>) => {
        const res = await apiMutate<ClientData>(`/api/clients/${id}`, 'PATCH', body);
        if (!res.error) await refetch();
        return res;
    };

    return { clients: data || [], error, loading, refetch, createClient, updateClient, mutate };
}
