'use client';
/* ══════════════════════════════════════════════════════════
   useProductionJobs — Production jobs from DB via API
   Replaces productionStore singleton.
   ══════════════════════════════════════════════════════════ */

import { useFetch, apiMutate } from './useFetch';

export interface ProductionJobData {
    id: string;
    clientId: string;
    campaignId: string | null;
    title: string;
    titleAr: string;
    jobType: string;
    status: string;
    priority: string;
    assignedTo: string;
    assigneeId: string | null;
    shootDate: string | null;
    dueDate: string | null;
    location: string;
    equipment: string;
    deliverables: string;
    linkedCreativeRequestId: string | null;
    syncStatus: string;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; name: string; nameAr: string; avatar: string };
    campaign?: { id: string; name: string; nameAr: string };
    assignee?: { id: string; profile?: { fullName: string; fullNameAr: string; avatar: string } };
}

export function useProductionJobs(clientId?: string) {
    const url = clientId
        ? `/api/production-jobs?clientId=${clientId}&take=200`
        : '/api/production-jobs?take=200';
    const { data, error, loading, refetch, mutate } = useFetch<ProductionJobData[]>(url);

    const createJob = async (body: Partial<ProductionJobData>) => {
        const res = await apiMutate<ProductionJobData>('/api/production-jobs', 'POST', body);
        if (!res.error) await refetch();
        return res;
    };

    const updateJob = async (id: string, body: Partial<ProductionJobData>) => {
        const res = await apiMutate<ProductionJobData>(`/api/production-jobs/${id}`, 'PATCH', body);
        if (!res.error) await refetch();
        return res;
    };

    const deleteJob = async (id: string) => {
        const res = await apiMutate(`/api/production-jobs/${id}`, 'DELETE');
        if (!res.error) await refetch();
        return res;
    };

    return { jobs: data || [], error, loading, refetch, createJob, updateJob, deleteJob, mutate };
}
