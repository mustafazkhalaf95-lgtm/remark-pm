'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { useProductionJobs, useClients, useCampaigns, useUsers } from '@/lib/hooks';
import type { ProductionJobData } from '@/lib/hooks';
import type { ClientData } from '@/lib/hooks';
import type { CampaignData } from '@/lib/hooks';
import type { UserData } from '@/lib/hooks';
import { useSettings } from '@/lib/useSettings';

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

const PIPELINE_STAGES = [
    'pending',
    'pre_production',
    'scheduled',
    'in_production',
    'post_production',
    'review',
    'delivered',
] as const;

type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STAGE_META: Record<string, { en: string; ar: string; color: string }> = {
    pending:         { en: 'Pending',         ar: '\u0628\u0627\u0646\u062a\u0638\u0627\u0631',               color: '#6b7280' },
    pre_production:  { en: 'Pre-Production',  ar: '\u0645\u0627 \u0642\u0628\u0644 \u0627\u0644\u0625\u0646\u062a\u0627\u062c',     color: '#6366f1' },
    scheduled:       { en: 'Scheduled',       ar: '\u0645\u062c\u062f\u0648\u0644\u0629',                     color: '#8b5cf6' },
    in_production:   { en: 'In Production',   ar: '\u0642\u064a\u062f \u0627\u0644\u0625\u0646\u062a\u0627\u062c',           color: '#f59e0b' },
    post_production: { en: 'Post-Production', ar: '\u0645\u0627 \u0628\u0639\u062f \u0627\u0644\u0625\u0646\u062a\u0627\u062c',     color: '#14b8a6' },
    review:          { en: 'Review',          ar: '\u0645\u0631\u0627\u062c\u0639\u0629',                     color: '#ec4899' },
    delivered:       { en: 'Delivered',        ar: '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645',               color: '#22c55e' },
};

const JOB_TYPE_ICONS: Record<string, string> = {
    video:  '\uD83C\uDFAC',
    photo:  '\uD83D\uDCF7',
    motion: '\uD83C\uDF9E\uFE0F',
    audio:  '\uD83C\uDF99\uFE0F',
};

const JOB_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
    video:  { en: 'Video',        ar: '\u0641\u064a\u062f\u064a\u0648' },
    photo:  { en: 'Photography',  ar: '\u062a\u0635\u0648\u064a\u0631' },
    motion: { en: 'Motion',       ar: '\u0645\u0648\u0634\u0646' },
    audio:  { en: 'Audio',        ar: '\u0635\u0648\u062a' },
};

const PRIORITY_LABELS: Record<string, { en: string; ar: string }> = {
    urgent: { en: 'Urgent', ar: '\u0639\u0627\u062c\u0644' },
    high:   { en: 'High',   ar: '\u0645\u0631\u062a\u0641\u0639' },
    medium: { en: 'Medium', ar: '\u0645\u062a\u0648\u0633\u0637' },
    low:    { en: 'Low',    ar: '\u0645\u0646\u062e\u0641\u0636' },
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#dc2626',
    high:   '#f59e0b',
    medium: '#3b82f6',
    low:    '#6b7280',
};

/* ═══════════════════════════════════════════════════════
   New Job Form State Type
   ═══════════════════════════════════════════════════════ */

interface NewJobForm {
    title: string;
    titleAr: string;
    clientId: string;
    campaignId: string;
    jobType: string;
    priority: string;
    assigneeId: string;
    shootDate: string;
    dueDate: string;
    location: string;
    equipment: string;
    deliverables: string;
}

const EMPTY_FORM: NewJobForm = {
    title: '',
    titleAr: '',
    clientId: '',
    campaignId: '',
    jobType: 'video',
    priority: 'medium',
    assigneeId: '',
    shootDate: '',
    dueDate: '',
    location: '',
    equipment: '',
    deliverables: '',
};

/* ═══════════════════════════════════════════════════════
   Filter State Type
   ═══════════════════════════════════════════════════════ */

interface Filters {
    clientId: string;
    jobType: string;
    priority: string;
    status: string;
}

const EMPTY_FILTERS: Filters = {
    clientId: '',
    jobType: '',
    priority: '',
    status: '',
};

/* ═══════════════════════════════════════════════════════
   Helper: parse JSON field safely
   ═══════════════════════════════════════════════════════ */

function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export default function ProductionHQ() {
    /* ── Data hooks ── */
    const { jobs, loading: jobsLoading, error: jobsError, createJob, updateJob } = useProductionJobs();
    const { clients, loading: clientsLoading, error: clientsError } = useClients();
    const { campaigns, loading: campaignsLoading, error: campaignsError } = useCampaigns();
    const { users, loading: usersLoading, error: usersError } = useUsers();

    /* ── Settings ── */
    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const ar = lang === 'ar';

    /* ── UI state ── */
    const [toast, setToast] = useState('');
    const [showNewJob, setShowNewJob] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [newJob, setNewJob] = useState<NewJobForm>(EMPTY_FORM);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [creating, setCreating] = useState(false);

    /* ── Derived: loading / error ── */
    const loading = jobsLoading || clientsLoading || campaignsLoading || usersLoading;
    const globalError = jobsError || clientsError || campaignsError || usersError;

    /* ── Filtered jobs ── */
    const filteredJobs = useMemo(() => {
        return jobs.filter(j => {
            if (filters.clientId && j.clientId !== filters.clientId) return false;
            if (filters.jobType && j.jobType !== filters.jobType) return false;
            if (filters.priority && j.priority !== filters.priority) return false;
            if (filters.status && j.status !== filters.status) return false;
            return true;
        });
    }, [jobs, filters]);

    /* ── Lookup helpers ── */
    const clientName = useCallback((id: string): string => {
        const c = clients.find((cl: ClientData) => cl.id === id);
        if (!c) return id;
        return ar ? (c.nameAr || c.name) : c.name;
    }, [clients, ar]);

    const campaignName = useCallback((id: string): string => {
        const c = campaigns.find((cm: CampaignData) => cm.id === id);
        if (!c) return id;
        return ar ? (c.nameAr || c.name) : c.name;
    }, [campaigns, ar]);

    const userName = useCallback((id: string | null): string => {
        if (!id) return ar ? '\u063a\u064a\u0631 \u0645\u0639\u064a\u0646' : 'Unassigned';
        const u = users.find((us: UserData) => us.id === id);
        if (!u) return id;
        return ar ? (u.nameAr || u.name) : u.name;
    }, [users, ar]);

    /* ── KPIs ── */
    const kpis = useMemo(() => {
        const now = new Date();
        const active = jobs.filter(j => j.status !== 'delivered' && j.status !== 'pending').length;
        const scheduled = jobs.filter(j => j.status === 'scheduled').length;
        const inReview = jobs.filter(j => j.status === 'review').length;
        const delivered = jobs.filter(j => j.status === 'delivered').length;
        const overdue = jobs.filter(j => {
            if (!j.dueDate || j.status === 'delivered') return false;
            return new Date(j.dueDate) < now;
        }).length;
        return { active, scheduled, inReview, delivered, overdue };
    }, [jobs]);

    /* ── Campaigns with job counts ── */
    const campaignsWithCounts = useMemo(() => {
        return campaigns.map((c: CampaignData) => {
            const campJobs = jobs.filter(j => j.campaignId === c.id);
            const doneJobs = campJobs.filter(j => j.status === 'delivered').length;
            const progress = campJobs.length > 0 ? Math.round((doneJobs / campJobs.length) * 100) : 0;
            return { ...c, jobCount: campJobs.length, doneCount: doneJobs, progress };
        });
    }, [campaigns, jobs]);

    /* ── Calendar ── */
    const calendarData = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const dayNames = ar
            ? ['\u0623\u062d\u062f', '\u0625\u062b\u0646', '\u062b\u0644\u0627', '\u0623\u0631\u0628', '\u062e\u0645\u064a', '\u062c\u0645\u0639', '\u0633\u0628\u062a']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthLabel = now.toLocaleDateString(ar ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

        // Build events by day number
        const eventsByDay: Record<number, { id: string; title: string; color: string }[]> = {};
        for (const job of jobs) {
            if (!job.shootDate) continue;
            const d = new Date(job.shootDate);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                eventsByDay[day].push({
                    id: job.id,
                    title: job.title,
                    color: STAGE_META[job.status]?.color || '#6b7280',
                });
            }
        }
        // Also add jobs by dueDate
        for (const job of jobs) {
            if (!job.dueDate) continue;
            const d = new Date(job.dueDate);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                // Avoid duplicates if shootDate and dueDate are same day
                if (!eventsByDay[day].some(e => e.id === job.id)) {
                    eventsByDay[day].push({
                        id: `${job.id}-due`,
                        title: `${ar ? '\u062a\u0633\u0644\u064a\u0645' : 'Due'}: ${job.title}`,
                        color: '#dc2626',
                    });
                }
            }
        }

        return { year, month, daysInMonth, firstDayOfWeek, dayNames, monthLabel, eventsByDay };
    }, [jobs, ar]);

    /* ── Workload ── */
    const workloadData = useMemo(() => {
        const activeJobs = jobs.filter(j => j.status !== 'delivered');
        const countMap: Record<string, number> = {};
        for (const job of activeJobs) {
            if (job.assigneeId) {
                countMap[job.assigneeId] = (countMap[job.assigneeId] || 0) + 1;
            }
        }
        const result = users
            .filter((u: UserData) => countMap[u.id] !== undefined || u.department === 'production' || u.department === 'Production')
            .map((u: UserData) => ({
                id: u.id,
                name: ar ? (u.nameAr || u.name) : u.name,
                role: ar ? (u.positionAr || u.position || u.roleAr || u.role) : (u.position || u.role),
                avatar: u.avatar || u.name.charAt(0).toUpperCase(),
                count: countMap[u.id] || 0,
            }));
        // Sort by count descending
        result.sort((a, b) => b.count - a.count);
        return result;
    }, [users, jobs, ar]);

    const maxLoad = useMemo(() => Math.max(...workloadData.map(w => w.count), 1), [workloadData]);

    /* ── Alerts: overdue and urgent jobs ── */
    const alertJobs = useMemo(() => {
        const now = new Date();
        return jobs.filter(j => {
            if (j.status === 'delivered') return false;
            if (j.priority === 'urgent') return true;
            if (j.dueDate && new Date(j.dueDate) < now) return true;
            return false;
        });
    }, [jobs]);

    /* ── Selected job for detail drawer ── */
    const selectedJob = useMemo(() => {
        if (!selectedJobId) return null;
        return jobs.find(j => j.id === selectedJobId) || null;
    }, [jobs, selectedJobId]);

    /* ── Toast helper ── */
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

    /* ── Create job handler ── */
    const handleCreateJob = useCallback(async () => {
        if (!newJob.title.trim()) return;
        setCreating(true);
        const body: Partial<ProductionJobData> = {
            title: newJob.title,
            titleAr: newJob.titleAr || newJob.title,
            clientId: newJob.clientId || undefined,
            campaignId: newJob.campaignId || undefined,
            jobType: newJob.jobType,
            priority: newJob.priority,
            status: 'pending',
            assigneeId: newJob.assigneeId || undefined,
            assignedTo: newJob.assigneeId ? userName(newJob.assigneeId) : '',
            shootDate: newJob.shootDate || undefined,
            dueDate: newJob.dueDate || undefined,
            location: newJob.location,
            equipment: newJob.equipment ? JSON.stringify(newJob.equipment.split(',').map(s => s.trim()).filter(Boolean)) : '[]',
            deliverables: newJob.deliverables ? JSON.stringify(newJob.deliverables.split(',').map(s => s.trim()).filter(Boolean)) : '[]',
        };

        const res = await createJob(body);
        setCreating(false);
        if (!res.error) {
            showToast(ar ? '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629 \u0628\u0646\u062c\u0627\u062d' : 'Job created successfully');
            setShowNewJob(false);
            setNewJob(EMPTY_FORM);
        } else {
            showToast(ar ? '\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629' : 'Failed to create job');
        }
    }, [newJob, createJob, showToast, ar, userName]);

    /* ── Stage change handler ── */
    const handleStageChange = useCallback(async (jobId: string, newStatus: string) => {
        const res = await updateJob(jobId, { status: newStatus });
        if (!res.error) {
            const label = ar ? STAGE_META[newStatus]?.ar : STAGE_META[newStatus]?.en;
            showToast(ar ? `\u062a\u0645 \u0627\u0644\u0646\u0642\u0644 \u0625\u0644\u0649 ${label}` : `Moved to ${label}`);
        }
    }, [updateJob, showToast, ar]);

    /* ═══════════════════════════════════════════════════════
       Render
       ═══════════════════════════════════════════════════════ */

    return (
        <div className={s.board} dir="rtl">
            {/* ── Header ── */}
            <header className={s.header}>
                <div className={s.headerRight}>
                    <div className={s.logo}>
                        <div className={s.logoIcon}>R</div>
                        <span className={s.logoText}>Remark</span>
                    </div>
                    <div className={s.boardTitle}>
                        <div className={s.boardDot} />
                        <h1 className={s.boardName}>{ar ? '\u0627\u0644\u0625\u0646\u062a\u0627\u062c' : 'Production'}</h1>
                    </div>
                </div>
                <div className={s.headerLeft}>
                    <button className={s.iconBtn} onClick={toggleTheme}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </button>
                    <button className={s.iconBtn} onClick={toggleLang}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </button>
                    <div className={s.userAvatar}>{'\u0645.\u062e'}</div>
                    <div className={s.headerDivider} />
                    <div className={s.navSwitcher}>
                        <Link href="/" className={s.navInactive}>{'\uD83D\uDCCB'} {ar ? '\u0627\u0644\u062a\u0633\u0648\u064a\u0642' : 'Marketing'}</Link>
                        <Link href="/creative" className={s.navInactive}>{'\uD83C\uDFA8'} {ar ? '\u0627\u0644\u0625\u0628\u062f\u0627\u0639\u064a' : 'Creative'}</Link>
                        <span className={s.navActive}>{'\uD83C\uDFAC'} {ar ? '\u0627\u0644\u0625\u0646\u062a\u0627\u062c' : 'Production'}</span>
                        <Link href="/publishing" className={s.navInactive}>{'\uD83D\uDCE2'} {ar ? '\u0627\u0644\u0646\u0634\u0631' : 'Publishing'}</Link>
                    </div>
                </div>
            </header>

            <main className={s.content}>
                {/* ── Loading State ── */}
                {loading && (
                    <div className={s.kpiGrid}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={s.kpiCard} style={{ opacity: 0.5 }}>
                                <div className={s.kpiValue}>--</div>
                                <div className={s.kpiLabel}>{ar ? '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...' : 'Loading...'}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Error State ── */}
                {globalError && (
                    <div className={s.alertCard}>
                        <span className={s.alertIcon}>{'\u26A0\uFE0F'}</span>
                        <span style={{ flex: 1 }}>
                            {ar ? '\u062e\u0637\u0623 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a' : 'Error loading data'}: {globalError}
                        </span>
                    </div>
                )}

                {/* ── KPIs ── */}
                {!loading && (
                    <div className={s.kpiGrid}>
                        {[
                            { v: kpis.active,    l: ar ? '\u0645\u0647\u0627\u0645 \u0646\u0634\u0637\u0629' : 'Active Jobs' },
                            { v: kpis.scheduled, l: ar ? '\u062a\u0635\u0648\u064a\u0631 \u0645\u062c\u062f\u0648\u0644' : 'Scheduled' },
                            { v: kpis.inReview,  l: ar ? '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629' : 'In Review' },
                            { v: kpis.delivered, l: ar ? '\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645' : 'Delivered' },
                            { v: kpis.overdue,   l: ar ? '\u0645\u062a\u0623\u062e\u0631' : 'Overdue' },
                        ].map((k, i) => (
                            <div key={i} className={s.kpiCard}>
                                <div className={s.kpiValue}>{k.v}</div>
                                <div className={s.kpiLabel}>{k.l}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Campaigns Section ── */}
                {!loading && (
                    <>
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>{'\uD83C\uDFAC'} {ar ? '\u0627\u0644\u062d\u0645\u0644\u0627\u062a' : 'Campaigns'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>
                                {campaigns.length} {ar ? '\u062d\u0645\u0644\u0629' : 'campaigns'}
                            </span>
                        </div>
                        <div className={s.campaignGrid}>
                            {campaignsWithCounts.map(c => (
                                <div key={c.id} className={s.campaignCard}>
                                    <div className={s.campHeader}>
                                        <div>
                                            <div className={s.campName}>{ar ? (c.nameAr || c.name) : c.name}</div>
                                            <div className={s.campClient}>{clientName(c.clientId)}</div>
                                        </div>
                                        <span className={`${s.campBadge} ${
                                            c.status === 'completed' || c.status === 'complete'
                                                ? s.campBadgeGreen
                                                : c.status === 'active' || c.status === 'in_production'
                                                    ? s.campBadgeYellow
                                                    : s.campBadgePurple
                                        }`}>
                                            {ar
                                                ? (c.status === 'planning' ? '\u062a\u062e\u0637\u064a\u0637'
                                                    : c.status === 'active' || c.status === 'in_production' ? '\u0625\u0646\u062a\u0627\u062c'
                                                    : c.status === 'review' ? '\u0645\u0631\u0627\u062c\u0639\u0629'
                                                    : c.status === 'completed' || c.status === 'complete' ? '\u0645\u0643\u062a\u0645\u0644'
                                                    : c.status)
                                                : c.status
                                            }
                                        </span>
                                    </div>
                                    <div className={s.campBadges}>
                                        <span className={s.campBadge}>
                                            {'\uD83C\uDFAC'} {c.jobCount} {ar ? '\u0645\u0647\u0645\u0629' : 'jobs'}
                                        </span>
                                        <span className={s.campBadge}>
                                            {'\u2705'} {c.doneCount}/{c.jobCount}
                                        </span>
                                    </div>
                                    <div className={s.campProgress}>
                                        <div className={s.campProgressFill} style={{ width: `${c.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                            {campaigns.length === 0 && (
                                <div className={s.campaignCard} style={{ opacity: 0.6, textAlign: 'center' }}>
                                    <div className={s.campName}>{ar ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0645\u0644\u0627\u062a' : 'No campaigns yet'}</div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── Filter Bar + New Job Button ── */}
                {!loading && (
                    <>
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>{'\uD83D\uDCCC'} {ar ? '\u0645\u0647\u0627\u0645 \u0627\u0644\u0625\u0646\u062a\u0627\u062c' : 'Production Jobs'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{filteredJobs.length} {ar ? '\u0645\u0647\u0645\u0629' : 'jobs'}</span>
                            <button className={s.btnPrimary} onClick={() => setShowNewJob(true)}>
                                + {ar ? '\u0645\u0647\u0645\u0629 \u062c\u062f\u064a\u062f\u0629' : 'New Job'}
                            </button>
                        </div>

                        {/* Filter Dropdowns */}
                        <div className={s.actionRow}>
                            {/* Client Filter */}
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 140 }}
                                value={filters.clientId}
                                onChange={e => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
                            >
                                <option value="">{ar ? '\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621' : 'All Clients'}</option>
                                {clients.map((c: ClientData) => (
                                    <option key={c.id} value={c.id}>{ar ? (c.nameAr || c.name) : c.name}</option>
                                ))}
                            </select>

                            {/* Job Type Filter */}
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 120 }}
                                value={filters.jobType}
                                onChange={e => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                            >
                                <option value="">{ar ? '\u0643\u0644 \u0627\u0644\u0623\u0646\u0648\u0627\u0639' : 'All Types'}</option>
                                {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{JOB_TYPE_ICONS[key]} {ar ? label.ar : label.en}</option>
                                ))}
                            </select>

                            {/* Priority Filter */}
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 120 }}
                                value={filters.priority}
                                onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                <option value="">{ar ? '\u0643\u0644 \u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0627\u062a' : 'All Priorities'}</option>
                                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{ar ? label.ar : label.en}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 120 }}
                                value={filters.status}
                                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">{ar ? '\u0643\u0644 \u0627\u0644\u0645\u0631\u0627\u062d\u0644' : 'All Stages'}</option>
                                {PIPELINE_STAGES.map(st => (
                                    <option key={st} value={st}>{ar ? STAGE_META[st].ar : STAGE_META[st].en}</option>
                                ))}
                            </select>

                            {/* Clear Filters */}
                            {(filters.clientId || filters.jobType || filters.priority || filters.status) && (
                                <button
                                    className={s.actionBtn}
                                    onClick={() => setFilters(EMPTY_FILTERS)}
                                >
                                    {'\u2715'} {ar ? '\u0645\u0633\u062d \u0627\u0644\u0641\u0644\u0627\u062a\u0631' : 'Clear'}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ── Pipeline Columns ── */}
                {!loading && (
                    <div className={s.pipelineCols}>
                        {PIPELINE_STAGES.map(stage => {
                            const meta = STAGE_META[stage];
                            const stageJobs = filteredJobs.filter(j => j.status === stage);
                            return (
                                <div key={stage} className={s.pipelineCol}>
                                    <div className={s.pipelineColHeader}>
                                        <div className={s.pipelineColDot} style={{ background: meta.color }} />
                                        <span>{ar ? meta.ar : meta.en}</span>
                                        <span className={s.pipelineColCount}>{stageJobs.length}</span>
                                    </div>
                                    {stageJobs.map(j => {
                                        const isOverdue = j.dueDate && j.status !== 'delivered' && new Date(j.dueDate) < new Date();
                                        return (
                                            <div
                                                key={j.id}
                                                className={s.pipelineJobCard}
                                                onClick={() => setSelectedJobId(j.id)}
                                                style={isOverdue ? { borderColor: 'rgba(220,38,38,.4)' } : undefined}
                                            >
                                                <div className={s.pipelineJobTitle}>
                                                    {JOB_TYPE_ICONS[j.jobType] || '\uD83C\uDFAC'} {ar ? (j.titleAr || j.title) : j.title}
                                                </div>
                                                <div className={s.pipelineJobMeta}>
                                                    {clientName(j.clientId)}
                                                    {' \u2022 '}
                                                    {ar ? (JOB_TYPE_LABELS[j.jobType]?.ar || j.jobType) : (JOB_TYPE_LABELS[j.jobType]?.en || j.jobType)}
                                                </div>
                                                {j.priority === 'urgent' && (
                                                    <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2, fontWeight: 600 }}>
                                                        {'\uD83D\uDD34'} {ar ? '\u0639\u0627\u062c\u0644' : 'Urgent'}
                                                    </div>
                                                )}
                                                {isOverdue && (
                                                    <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>
                                                        {'\u26D4'} {ar ? '\u0645\u062a\u0623\u062e\u0631' : 'Overdue'}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {stageJobs.length === 0 && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
                                            {ar ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645' : 'No jobs'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Calendar ── */}
                {!loading && (
                    <>
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>{'\uD83D\uDCC5'} {ar ? '\u062a\u0642\u0648\u064a\u0645 \u0627\u0644\u0625\u0646\u062a\u0627\u062c' : 'Production Calendar'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{calendarData.monthLabel}</span>
                        </div>
                        <div className={s.calGrid}>
                            {calendarData.dayNames.map(d => (
                                <div key={d} className={s.calHeader}>{d}</div>
                            ))}
                            {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className={s.calEmpty} />
                            ))}
                            {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const events = calendarData.eventsByDay[day] || [];
                                return (
                                    <div key={day} className={s.calDay}>
                                        <div className={s.calDayNum}>{day}</div>
                                        {events.map(ev => (
                                            <div key={ev.id} className={s.calEvent} style={{ background: ev.color }}>
                                                {ev.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── Team Workload ── */}
                {!loading && (
                    <>
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>{'\uD83D\uDC65'} {ar ? '\u062d\u0645\u0644 \u0627\u0644\u0641\u0631\u064a\u0642' : 'Team Workload'}</span>
                            <div className={s.sectionLine} />
                        </div>
                        <div className={s.teamGrid}>
                            {workloadData.map(m => (
                                <div key={m.id} className={s.teamCard}>
                                    <div className={s.teamAvatar} style={{ background: 'rgba(99,102,241,0.12)' }}>
                                        {m.avatar}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className={s.teamName}>{m.name}</div>
                                        <div className={s.teamRole}>{m.role}</div>
                                        <div className={s.teamBar}>
                                            <div
                                                className={s.teamBarFill}
                                                style={{
                                                    width: `${(m.count / maxLoad) * 100}%`,
                                                    background: m.count > maxLoad * 0.8 ? '#dc2626' : '#6366f1',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className={s.teamCount}>{m.count}</div>
                                </div>
                            ))}
                            {workloadData.length === 0 && (
                                <div className={s.teamCard} style={{ opacity: 0.6, justifyContent: 'center' }}>
                                    <span style={{ fontSize: 13 }}>{ar ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u062d\u0645\u0644 \u0627\u0644\u0639\u0645\u0644' : 'No workload data'}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── Alerts: Overdue + Urgent ── */}
                {!loading && alertJobs.length > 0 && (
                    <>
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>{'\uD83D\uDEA8'} {ar ? '\u062a\u0646\u0628\u064a\u0647\u0627\u062a' : 'Alerts'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{alertJobs.length}</span>
                        </div>
                        {alertJobs.map(j => {
                            const isOverdue = j.dueDate && new Date(j.dueDate) < new Date();
                            return (
                                <div key={j.id} className={s.alertCard}>
                                    <span className={s.alertIcon}>{isOverdue ? '\u26D4' : '\uD83D\uDD34'}</span>
                                    <span style={{ flex: 1 }}>
                                        {JOB_TYPE_ICONS[j.jobType] || ''} {ar ? (j.titleAr || j.title) : j.title}
                                        {' \u2014 '}
                                        {isOverdue
                                            ? (ar ? '\u0645\u062a\u0623\u062e\u0631' : 'Overdue')
                                            : (ar ? '\u0639\u0627\u062c\u0644' : 'Urgent')
                                        }
                                        {j.dueDate && (
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 6 }}>
                                                {' \u2022 '}{ar ? '\u0627\u0644\u0645\u0648\u0639\u062f' : 'Due'}: {new Date(j.dueDate).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        className={s.actionBtn}
                                        onClick={() => setSelectedJobId(j.id)}
                                    >
                                        {ar ? '\u0639\u0631\u0636' : 'View'}
                                    </button>
                                </div>
                            );
                        })}
                    </>
                )}
            </main>

            {/* ═══ JOB DETAIL DRAWER ═══ */}
            {selectedJob && (
                <div className={s.modalOverlay} onClick={() => setSelectedJobId(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <button className={s.drawerClose} onClick={() => setSelectedJobId(null)}>{'\u2715'}</button>
                        <div className={s.drawerTitle}>
                            {JOB_TYPE_ICONS[selectedJob.jobType] || '\uD83C\uDFAC'}{' '}
                            {ar ? (selectedJob.titleAr || selectedJob.title) : selectedJob.title}
                        </div>

                        {/* Status & Meta Badges */}
                        <div className={s.campBadges}>
                            <span
                                className={s.campBadge}
                                style={{
                                    borderColor: STAGE_META[selectedJob.status]?.color,
                                    color: STAGE_META[selectedJob.status]?.color,
                                }}
                            >
                                {ar ? STAGE_META[selectedJob.status]?.ar : STAGE_META[selectedJob.status]?.en}
                            </span>
                            <span className={s.campBadge}>{clientName(selectedJob.clientId)}</span>
                            {selectedJob.campaignId && (
                                <span className={`${s.campBadge} ${s.campBadgePurple}`}>
                                    {'\uD83D\uDCE6'} {campaignName(selectedJob.campaignId)}
                                </span>
                            )}
                            {selectedJob.priority && (
                                <span
                                    className={s.campBadge}
                                    style={{
                                        borderColor: PRIORITY_COLORS[selectedJob.priority],
                                        color: PRIORITY_COLORS[selectedJob.priority],
                                    }}
                                >
                                    {ar ? PRIORITY_LABELS[selectedJob.priority]?.ar : PRIORITY_LABELS[selectedJob.priority]?.en}
                                </span>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? '\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644' : 'Details'}</div>
                            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>
                                    <strong>{ar ? '\u0627\u0644\u0646\u0648\u0639:' : 'Type:'}</strong>{' '}
                                    {JOB_TYPE_ICONS[selectedJob.jobType]}{' '}
                                    {ar ? JOB_TYPE_LABELS[selectedJob.jobType]?.ar : JOB_TYPE_LABELS[selectedJob.jobType]?.en}
                                </div>
                                <div>
                                    <strong>{ar ? '\u0627\u0644\u0645\u0633\u0624\u0648\u0644:' : 'Assigned to:'}</strong>{' '}
                                    {selectedJob.assignedTo || userName(selectedJob.assigneeId)}
                                </div>
                                {selectedJob.shootDate && (
                                    <div>
                                        <strong>{ar ? '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0635\u0648\u064a\u0631:' : 'Shoot Date:'}</strong>{' '}
                                        {new Date(selectedJob.shootDate).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                                    </div>
                                )}
                                {selectedJob.dueDate && (
                                    <div>
                                        <strong>{ar ? '\u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0646\u0647\u0627\u0626\u064a:' : 'Due Date:'}</strong>{' '}
                                        {new Date(selectedJob.dueDate).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                                    </div>
                                )}
                                {selectedJob.location && (
                                    <div>
                                        <strong>{ar ? '\u0627\u0644\u0645\u0648\u0642\u0639:' : 'Location:'}</strong> {selectedJob.location}
                                    </div>
                                )}
                                {selectedJob.equipment && selectedJob.equipment !== '[]' && (
                                    <div>
                                        <strong>{ar ? '\u0627\u0644\u0645\u0639\u062f\u0627\u062a:' : 'Equipment:'}</strong>{' '}
                                        {parseJsonField<string[]>(selectedJob.equipment, []).join(', ')}
                                    </div>
                                )}
                                {selectedJob.deliverables && selectedJob.deliverables !== '[]' && (
                                    <div>
                                        <strong>{ar ? '\u0627\u0644\u0645\u062e\u0631\u062c\u0627\u062a:' : 'Deliverables:'}</strong>{' '}
                                        {parseJsonField<string[]>(selectedJob.deliverables, []).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stage Actions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? '\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0645\u0631\u062d\u0644\u0629' : 'Change Stage'}</div>
                            <div className={s.actionRow}>
                                {PIPELINE_STAGES.map(st => (
                                    <button
                                        key={st}
                                        className={`${s.actionBtn} ${selectedJob.status === st ? s.btnPrimary : ''}`}
                                        onClick={() => handleStageChange(selectedJob.id, st)}
                                        style={
                                            selectedJob.status === st
                                                ? { background: STAGE_META[st].color, color: 'white', borderColor: 'transparent' }
                                                : undefined
                                        }
                                    >
                                        {ar ? STAGE_META[st].ar : STAGE_META[st].en}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className={s.drawerSection}>
                            <div className={s.actionRow}>
                                {selectedJob.clientId && (
                                    <Link href={`/production/client/${selectedJob.clientId}`} className={s.actionBtn}>
                                        {'\uD83D\uDC64'} {ar ? '\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u064a\u0644' : 'Client Workspace'}
                                    </Link>
                                )}
                                {selectedJob.campaignId && (
                                    <Link href={`/production/campaign/${selectedJob.campaignId}`} className={s.actionBtn}>
                                        {'\uD83D\uDCE6'} {ar ? '\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u062d\u0645\u0644\u0629' : 'Campaign Workspace'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ NEW JOB MODAL ═══ */}
            {showNewJob && (
                <div className={s.modalOverlay} onClick={() => setShowNewJob(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <div className={s.modalTitle}>
                            {'\uD83D\uDCCC'} {ar ? '\u0645\u0647\u0645\u0629 \u0625\u0646\u062a\u0627\u062c \u062c\u062f\u064a\u062f\u0629' : 'New Production Job'}
                        </div>

                        {/* Title */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0639\u0646\u0648\u0627\u0646 (EN)' : 'Title (EN)'}</label>
                            <input
                                className={s.modalInput}
                                value={newJob.title}
                                onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                                placeholder={ar ? '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0647\u0645\u0629...' : 'Job title...'}
                            />
                        </div>

                        {/* Title AR */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0639\u0646\u0648\u0627\u0646 (\u0639\u0631\u0628\u064a)' : 'Title (AR)'}</label>
                            <input
                                className={s.modalInput}
                                value={newJob.titleAr}
                                onChange={e => setNewJob(prev => ({ ...prev, titleAr: e.target.value }))}
                                placeholder={ar ? '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0647\u0645\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064a...' : 'Arabic title...'}
                            />
                        </div>

                        {/* Client */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0639\u0645\u064a\u0644' : 'Client'}</label>
                            <select
                                className={s.modalSelect}
                                value={newJob.clientId}
                                onChange={e => setNewJob(prev => ({ ...prev, clientId: e.target.value }))}
                            >
                                <option value="">{ar ? '\u0627\u062e\u062a\u0631 \u0639\u0645\u064a\u0644' : 'Select client'}</option>
                                {clients.map((c: ClientData) => (
                                    <option key={c.id} value={c.id}>{ar ? (c.nameAr || c.name) : c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Campaign */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u062d\u0645\u0644\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)' : 'Campaign (optional)'}</label>
                            <select
                                className={s.modalSelect}
                                value={newJob.campaignId}
                                onChange={e => setNewJob(prev => ({ ...prev, campaignId: e.target.value }))}
                            >
                                <option value="">{ar ? '\u0628\u062f\u0648\u0646 \u062d\u0645\u0644\u0629' : 'No campaign'}</option>
                                {campaigns
                                    .filter((c: CampaignData) => !newJob.clientId || c.clientId === newJob.clientId)
                                    .map((c: CampaignData) => (
                                        <option key={c.id} value={c.id}>{ar ? (c.nameAr || c.name) : c.name}</option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Job Type */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0646\u0648\u0639' : 'Job Type'}</label>
                            <select
                                className={s.modalSelect}
                                value={newJob.jobType}
                                onChange={e => setNewJob(prev => ({ ...prev, jobType: e.target.value }))}
                            >
                                {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {JOB_TYPE_ICONS[key]} {ar ? label.ar : label.en}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629' : 'Priority'}</label>
                            <select
                                className={s.modalSelect}
                                value={newJob.priority}
                                onChange={e => setNewJob(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{ar ? label.ar : label.en}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0645\u0633\u0624\u0648\u0644' : 'Assignee'}</label>
                            <select
                                className={s.modalSelect}
                                value={newJob.assigneeId}
                                onChange={e => setNewJob(prev => ({ ...prev, assigneeId: e.target.value }))}
                            >
                                <option value="">{ar ? '\u063a\u064a\u0631 \u0645\u0639\u064a\u0646' : 'Unassigned'}</option>
                                {users.map((u: UserData) => (
                                    <option key={u.id} value={u.id}>
                                        {ar ? (u.nameAr || u.name) : u.name}
                                        {u.position ? ` \u2014 ${ar ? (u.positionAr || u.position) : u.position}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Shoot Date */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0635\u0648\u064a\u0631' : 'Shoot Date'}</label>
                            <input
                                className={s.modalInput}
                                type="date"
                                value={newJob.shootDate}
                                onChange={e => setNewJob(prev => ({ ...prev, shootDate: e.target.value }))}
                            />
                        </div>

                        {/* Due Date */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0646\u0647\u0627\u0626\u064a' : 'Due Date'}</label>
                            <input
                                className={s.modalInput}
                                type="date"
                                value={newJob.dueDate}
                                onChange={e => setNewJob(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>

                        {/* Location */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0645\u0648\u0642\u0639' : 'Location'}</label>
                            <input
                                className={s.modalInput}
                                value={newJob.location}
                                onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                                placeholder={ar ? '\u0645\u0648\u0642\u0639 \u0627\u0644\u062a\u0635\u0648\u064a\u0631...' : 'Shoot location...'}
                            />
                        </div>

                        {/* Equipment */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0645\u0639\u062f\u0627\u062a (\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0648\u0627\u0635\u0644)' : 'Equipment (comma-separated)'}</label>
                            <input
                                className={s.modalInput}
                                value={newJob.equipment}
                                onChange={e => setNewJob(prev => ({ ...prev, equipment: e.target.value }))}
                                placeholder={ar ? '\u0643\u0627\u0645\u064a\u0631\u0627, \u0625\u0636\u0627\u0621\u0629, \u0645\u064a\u0643\u0631\u0648\u0641\u0648\u0646...' : 'Camera, Lighting, Mic...'}
                            />
                        </div>

                        {/* Deliverables */}
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? '\u0627\u0644\u0645\u062e\u0631\u062c\u0627\u062a (\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0648\u0627\u0635\u0644)' : 'Deliverables (comma-separated)'}</label>
                            <input
                                className={s.modalInput}
                                value={newJob.deliverables}
                                onChange={e => setNewJob(prev => ({ ...prev, deliverables: e.target.value }))}
                                placeholder={ar ? '\u0631\u064a\u0644 30\u062b, \u0635\u0648\u0631 \u0645\u0646\u062a\u062c...' : 'Reel 30s, Product photos...'}
                            />
                        </div>

                        {/* Actions */}
                        <div className={s.modalActions}>
                            <button
                                className={s.btnPrimary}
                                onClick={handleCreateJob}
                                disabled={!newJob.title.trim() || creating}
                            >
                                {creating
                                    ? (ar ? '\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621...' : 'Creating...')
                                    : `\u2705 ${ar ? '\u0625\u0646\u0634\u0627\u0621' : 'Create'}`
                                }
                            </button>
                            <button className={s.btnSecondary} onClick={() => { setShowNewJob(false); setNewJob(EMPTY_FORM); }}>
                                {ar ? '\u0625\u0644\u063a\u0627\u0621' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && <div className={s.toast}>{toast}</div>}
        </div>
    );
}
