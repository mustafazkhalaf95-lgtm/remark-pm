'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/hooks';

/* ══════════════════════════════════════════════════════════
   Remark PM — Time Tracking / Timesheet
   Full timer, weekly/monthly views, entries list, summary
   ══════════════════════════════════════════════════════════ */

// ─── Types ───

interface TimeEntry {
    id: string;
    userId: string;
    clientId: string | null;
    taskType: string;
    taskId: string;
    description: string;
    descriptionAr: string;
    startTime: string;
    endTime: string | null;
    duration: number;
    billable: boolean;
    rate: number;
    status: string;
    createdAt: string;
    user?: {
        profile?: {
            fullName: string;
            fullNameAr: string;
            avatar: string;
        };
    };
}

interface ClientItem {
    id: string;
    name: string;
    nameAr: string;
}

interface SummaryData {
    totalHours: number;
    totalMinutes: number;
    billableHours: number;
    billableMinutes: number;
    nonBillableHours: number;
    avgDailyHours: number;
    byClient: Array<{
        clientId: string;
        clientName: string;
        clientNameAr: string;
        totalHours: number;
    }>;
    byTaskType: Array<{
        taskType: string;
        totalHours: number;
    }>;
    byDay: Array<{
        date: string;
        totalMinutes: number;
        billableMinutes: number;
    }>;
}

// ─── Constants ───

const TASK_TYPES = [
    { value: 'marketing', label: 'التسويق', labelEn: 'Marketing', color: '#6366f1' },
    { value: 'creative', label: 'الإبداعي', labelEn: 'Creative', color: '#8b5cf6' },
    { value: 'production', label: 'الإنتاج', labelEn: 'Production', color: '#22c55e' },
    { value: 'publishing', label: 'النشر', labelEn: 'Publishing', color: '#f59e0b' },
    { value: 'general', label: 'عام', labelEn: 'General', color: '#06b6d4' },
];

const TASK_TYPE_MAP: Record<string, { label: string; labelEn: string; color: string }> = {};
for (const t of TASK_TYPES) TASK_TYPE_MAP[t.value] = t;

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ───

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

function formatTimer(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getWeekDates(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

// ─── Shared Styles ───

const glass = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
} as const;

const glassInner = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
} as const;

const accent = '#6366f1';
const violet = '#8b5cf6';

export default function TimesheetPage() {
    // ─── State ───
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const ar = lang === 'ar';

    const [tab, setTab] = useState<'timer' | 'weekly' | 'monthly'>('timer');
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    // Timer state
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerPaused, setTimerPaused] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
    const [timerTaskType, setTimerTaskType] = useState('general');
    const [timerClientId, setTimerClientId] = useState('');
    const [timerDescription, setTimerDescription] = useState('');
    const [timerBillable, setTimerBillable] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerStartRef = useRef<Date | null>(null);

    // Filters
    const [filterClient, setFilterClient] = useState('');
    const [filterTaskType, setFilterTaskType] = useState('');
    const [filterBillable, setFilterBillable] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Edit modal
    const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editTaskType, setEditTaskType] = useState('');
    const [editBillable, setEditBillable] = useState(true);
    const [editDuration, setEditDuration] = useState('');

    // Week navigation
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // ─── Fetch Data ───

    const fetchEntries = useCallback(async () => {
        try {
            const params = new URLSearchParams({ take: '200', orderBy: 'createdAt', orderDir: 'desc' });
            if (filterClient) params.set('clientId', filterClient);
            if (filterTaskType) params.set('taskType', filterTaskType);
            if (filterBillable) params.set('billable', filterBillable);
            if (filterDateFrom) params.set('startDate', filterDateFrom);
            if (filterDateTo) params.set('endDate', filterDateTo);

            const res = await fetch(apiUrl(`/api/time-entries?${params}`));
            const json = await res.json();
            setEntries(json.data || []);
        } catch (e) {
            console.error('Failed to fetch entries:', e);
        }
    }, [filterClient, filterTaskType, filterBillable, filterDateFrom, filterDateTo]);

    const fetchSummary = useCallback(async (period: string) => {
        try {
            const params = new URLSearchParams({ period });
            if (filterClient) params.set('clientId', filterClient);
            const res = await fetch(apiUrl(`/api/time-entries/summary?${params}`));
            const json = await res.json();
            setSummary(json);
        } catch (e) {
            console.error('Failed to fetch summary:', e);
        }
    }, [filterClient]);

    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch(apiUrl('/api/clients?take=100&status=active'));
            const json = await res.json();
            setClients(json.data || []);
        } catch (e) {
            console.error('Failed to fetch clients:', e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchEntries(), fetchSummary(tab === 'monthly' ? 'month' : 'week'), fetchClients()])
            .finally(() => setLoading(false));
    }, [fetchEntries, fetchSummary, fetchClients, tab]);

    // Check for running timer on mount
    useEffect(() => {
        const running = entries.find(e => e.status === 'running');
        if (running) {
            setActiveEntryId(running.id);
            setTimerRunning(true);
            timerStartRef.current = new Date(running.startTime);
            setTimerTaskType(running.taskType || 'general');
            setTimerClientId(running.clientId || '');
            setTimerDescription(running.description || '');
            setTimerBillable(running.billable);
            // Calculate elapsed
            const elapsed = Math.floor((Date.now() - new Date(running.startTime).getTime()) / 1000);
            setTimerSeconds(elapsed);
        }
    }, [entries]);

    // Timer tick
    useEffect(() => {
        if (timerRunning && !timerPaused) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerRunning, timerPaused]);

    // ─── Timer Actions ───

    const startTimer = async () => {
        try {
            const res = await fetch(apiUrl('/api/time-entries'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskType: timerTaskType,
                    clientId: timerClientId || null,
                    description: timerDescription,
                    billable: timerBillable,
                }),
            });
            const entry = await res.json();
            setActiveEntryId(entry.id);
            setTimerRunning(true);
            setTimerPaused(false);
            setTimerSeconds(0);
            timerStartRef.current = new Date();
        } catch (e) {
            console.error('Failed to start timer:', e);
        }
    };

    const stopTimer = async () => {
        if (!activeEntryId) return;
        try {
            await fetch(apiUrl(`/api/time-entries/${activeEntryId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'stop',
                    description: timerDescription,
                    taskType: timerTaskType,
                    clientId: timerClientId || null,
                    billable: timerBillable,
                }),
            });
            setTimerRunning(false);
            setTimerPaused(false);
            setTimerSeconds(0);
            setActiveEntryId(null);
            timerStartRef.current = null;
            fetchEntries();
            fetchSummary(tab === 'monthly' ? 'month' : 'week');
        } catch (e) {
            console.error('Failed to stop timer:', e);
        }
    };

    const togglePause = () => {
        setTimerPaused(prev => !prev);
    };

    // ─── Entry Actions ───

    const deleteEntry = async (id: string) => {
        try {
            await fetch(apiUrl(`/api/time-entries/${id}`), { method: 'DELETE' });
            fetchEntries();
            fetchSummary(tab === 'monthly' ? 'month' : 'week');
        } catch (e) {
            console.error('Failed to delete:', e);
        }
    };

    const openEdit = (entry: TimeEntry) => {
        setEditEntry(entry);
        setEditDescription(entry.description);
        setEditTaskType(entry.taskType);
        setEditBillable(entry.billable);
        setEditDuration(String(entry.duration));
    };

    const saveEdit = async () => {
        if (!editEntry) return;
        try {
            await fetch(apiUrl(`/api/time-entries/${editEntry.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: editDescription,
                    taskType: editTaskType,
                    billable: editBillable,
                    duration: parseInt(editDuration) || editEntry.duration,
                }),
            });
            setEditEntry(null);
            fetchEntries();
            fetchSummary(tab === 'monthly' ? 'month' : 'week');
        } catch (e) {
            console.error('Failed to update:', e);
        }
    };

    // ─── Computed Data ───

    const weekDates = getWeekDates(currentWeek);

    // Group entries by date
    const entriesByDate: Record<string, TimeEntry[]> = {};
    for (const e of entries) {
        if (e.status === 'running') continue;
        const d = new Date(e.startTime).toISOString().split('T')[0];
        if (!entriesByDate[d]) entriesByDate[d] = [];
        entriesByDate[d].push(e);
    }

    // Weekly grid: rows=days, columns=clients
    const weeklyClients = new Set<string>();
    const weeklyGrid: Record<string, Record<string, number>> = {};
    for (const d of weekDates) {
        const key = d.toISOString().split('T')[0];
        weeklyGrid[key] = {};
        const dayEntries = entries.filter(
            e => e.status !== 'running' && isSameDay(new Date(e.startTime), d)
        );
        for (const e of dayEntries) {
            const cid = e.clientId || '_none';
            weeklyClients.add(cid);
            weeklyGrid[key][cid] = (weeklyGrid[key][cid] || 0) + e.duration;
        }
    }
    const weekClientList = Array.from(weeklyClients);

    // Client name lookup
    const clientNameMap: Record<string, string> = { _none: ar ? 'بدون عميل' : 'No Client' };
    for (const c of clients) clientNameMap[c.id] = ar ? c.nameAr || c.name : c.name;

    // ─── Tab Labels ───
    const tabs = [
        { key: 'timer' as const, label: ar ? 'المؤقت' : 'Timer' },
        { key: 'weekly' as const, label: ar ? 'الأسبوعي' : 'Weekly' },
        { key: 'monthly' as const, label: ar ? 'الشهري' : 'Monthly' },
    ];

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════

    return (
        <div
            dir={ar ? 'rtl' : 'ltr'}
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
                color: '#e2e8f0',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                padding: '24px',
            }}
        >
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: `linear-gradient(135deg, ${accent}, ${violet})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {ar ? 'تتبع الوقت' : 'Time Tracking'}
                    </h1>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
                        {ar ? 'سجل وقتك وتابع إنتاجيتك' : 'Track your time and monitor productivity'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={() => setLang(ar ? 'en' : 'ar')}
                        style={{ ...glass, padding: '8px 16px', color: '#e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                        {ar ? 'EN' : 'عربي'}
                    </button>
                    <Link
                        href="/workspace"
                        style={{ ...glass, padding: '8px 16px', color: '#e2e8f0', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                    >
                        {ar ? 'الرئيسية' : 'Home'}
                    </Link>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, ...glass, padding: 4, width: 'fit-content' }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 12,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 14,
                            color: tab === t.key ? '#fff' : '#94a3b8',
                            background: tab === t.key ? `linear-gradient(135deg, ${accent}, ${violet})` : 'transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
                {/* ═══ Main Content ═══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── Active Timer Section ── */}
                    <div style={{ ...glass, padding: 28 }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
                                fontSize: 64,
                                fontWeight: 800,
                                letterSpacing: 4,
                                background: timerRunning
                                    ? timerPaused
                                        ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                        : `linear-gradient(135deg, ${accent}, ${violet})`
                                    : 'linear-gradient(135deg, #475569, #64748b)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: 8,
                            }}>
                                {formatTimer(timerSeconds)}
                            </div>
                            {timerRunning && (
                                <div style={{ fontSize: 12, color: timerPaused ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                                    {timerPaused
                                        ? (ar ? 'متوقف مؤقتا' : 'PAUSED')
                                        : (ar ? 'جاري التسجيل...' : 'RECORDING...')}
                                </div>
                            )}
                        </div>

                        {/* Timer Form */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'نوع المهمة' : 'Task Type'}
                                </label>
                                <select
                                    value={timerTaskType}
                                    onChange={e => setTimerTaskType(e.target.value)}
                                    disabled={timerRunning}
                                    style={{
                                        width: '100%', padding: '10px 12px', ...glassInner,
                                        color: '#e2e8f0', fontSize: 13, outline: 'none',
                                    }}
                                >
                                    {TASK_TYPES.map(t => (
                                        <option key={t.value} value={t.value} style={{ background: '#1a1a2e' }}>
                                            {ar ? t.label : t.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'العميل' : 'Client'}
                                </label>
                                <select
                                    value={timerClientId}
                                    onChange={e => setTimerClientId(e.target.value)}
                                    disabled={timerRunning}
                                    style={{
                                        width: '100%', padding: '10px 12px', ...glassInner,
                                        color: '#e2e8f0', fontSize: 13, outline: 'none',
                                    }}
                                >
                                    <option value="" style={{ background: '#1a1a2e' }}>
                                        {ar ? '-- اختر العميل --' : '-- Select Client --'}
                                    </option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>
                                            {ar ? c.nameAr || c.name : c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                {ar ? 'الوصف' : 'Description'}
                            </label>
                            <input
                                type="text"
                                value={timerDescription}
                                onChange={e => setTimerDescription(e.target.value)}
                                placeholder={ar ? 'ماذا تعمل؟' : 'What are you working on?'}
                                style={{
                                    width: '100%', padding: '10px 12px', ...glassInner,
                                    color: '#e2e8f0', fontSize: 13, outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#cbd5e1' }}>
                                <input
                                    type="checkbox"
                                    checked={timerBillable}
                                    onChange={e => setTimerBillable(e.target.checked)}
                                    disabled={timerRunning}
                                    style={{ accentColor: accent, width: 16, height: 16 }}
                                />
                                {ar ? 'قابل للفوترة' : 'Billable'}
                            </label>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {!timerRunning ? (
                                    <button
                                        onClick={startTimer}
                                        style={{
                                            padding: '12px 32px', borderRadius: 12, border: 'none',
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                                        }}
                                    >
                                        {ar ? 'ابدأ' : 'Start'}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={togglePause}
                                            style={{
                                                padding: '12px 24px', borderRadius: 12, border: 'none',
                                                background: timerPaused
                                                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                            }}
                                        >
                                            {timerPaused ? (ar ? 'استئناف' : 'Resume') : (ar ? 'إيقاف مؤقت' : 'Pause')}
                                        </button>
                                        <button
                                            onClick={stopTimer}
                                            style={{
                                                padding: '12px 32px', borderRadius: 12, border: 'none',
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                                boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
                                            }}
                                        >
                                            {ar ? 'إيقاف' : 'Stop'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Weekly View ── */}
                    {tab === 'weekly' && (
                        <div style={{ ...glass, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                                    {ar ? 'العرض الأسبوعي' : 'Weekly View'}
                                </h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => {
                                            const d = new Date(currentWeek);
                                            d.setDate(d.getDate() - 7);
                                            setCurrentWeek(d);
                                        }}
                                        style={{ ...glassInner, padding: '6px 12px', color: '#e2e8f0', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        {ar ? 'السابق' : 'Prev'}
                                    </button>
                                    <button
                                        onClick={() => setCurrentWeek(new Date())}
                                        style={{ ...glassInner, padding: '6px 12px', color: accent, cursor: 'pointer', border: `1px solid ${accent}40`, fontWeight: 700 }}
                                    >
                                        {ar ? 'هذا الأسبوع' : 'This Week'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const d = new Date(currentWeek);
                                            d.setDate(d.getDate() + 7);
                                            setCurrentWeek(d);
                                        }}
                                        style={{ ...glassInner, padding: '6px 12px', color: '#e2e8f0', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        {ar ? 'التالي' : 'Next'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '10px 12px', textAlign: ar ? 'right' : 'left', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                {ar ? 'اليوم' : 'Day'}
                                            </th>
                                            {weekClientList.map(cid => (
                                                <th key={cid} style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {clientNameMap[cid] || cid}
                                                </th>
                                            ))}
                                            <th style={{ padding: '10px 12px', textAlign: 'center', color: accent, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                {ar ? 'المجموع' : 'Total'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weekDates.map((d, i) => {
                                            const key = d.toISOString().split('T')[0];
                                            const dayData = weeklyGrid[key] || {};
                                            const dayTotal = Object.values(dayData).reduce((s, v) => s + v, 0);
                                            const isToday = isSameDay(d, new Date());
                                            return (
                                                <tr key={key} style={{ background: isToday ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                                                    <td style={{
                                                        padding: '10px 12px',
                                                        fontWeight: isToday ? 700 : 500,
                                                        color: isToday ? accent : '#cbd5e1',
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                    }}>
                                                        {ar ? DAY_NAMES_AR[i] : DAY_NAMES_EN[i]}
                                                        <span style={{ color: '#64748b', marginInlineStart: 6, fontSize: 11 }}>
                                                            {d.getDate()}/{d.getMonth() + 1}
                                                        </span>
                                                    </td>
                                                    {weekClientList.map(cid => {
                                                        const mins = dayData[cid] || 0;
                                                        return (
                                                            <td key={cid} style={{
                                                                padding: '10px 12px', textAlign: 'center',
                                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                                color: mins > 0 ? '#e2e8f0' : '#475569',
                                                            }}>
                                                                {mins > 0 ? formatDuration(mins) : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{
                                                        padding: '10px 12px', textAlign: 'center',
                                                        fontWeight: 700, color: dayTotal > 0 ? accent : '#475569',
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                    }}>
                                                        {dayTotal > 0 ? formatDuration(dayTotal) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Totals row */}
                                        <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 700, color: accent, borderTop: `2px solid ${accent}40` }}>
                                                {ar ? 'المجموع' : 'Total'}
                                            </td>
                                            {weekClientList.map(cid => {
                                                const total = weekDates.reduce((s, d) => {
                                                    const key = d.toISOString().split('T')[0];
                                                    return s + (weeklyGrid[key]?.[cid] || 0);
                                                }, 0);
                                                return (
                                                    <td key={cid} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: violet, borderTop: `2px solid ${accent}40` }}>
                                                        {total > 0 ? formatDuration(total) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td style={{
                                                padding: '10px 12px', textAlign: 'center',
                                                fontWeight: 800, color: accent, fontSize: 15,
                                                borderTop: `2px solid ${accent}40`,
                                            }}>
                                                {formatDuration(
                                                    weekDates.reduce((s, d) => {
                                                        const key = d.toISOString().split('T')[0];
                                                        return s + Object.values(weeklyGrid[key] || {}).reduce((a, b) => a + b, 0);
                                                    }, 0)
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Filters ── */}
                    <div style={{ ...glass, padding: 16 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'العميل' : 'Client'}
                                </label>
                                <select
                                    value={filterClient}
                                    onChange={e => setFilterClient(e.target.value)}
                                    style={{ padding: '8px 10px', ...glassInner, color: '#e2e8f0', fontSize: 12, outline: 'none', minWidth: 140 }}
                                >
                                    <option value="" style={{ background: '#1a1a2e' }}>{ar ? 'الكل' : 'All'}</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>
                                            {ar ? c.nameAr || c.name : c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'نوع المهمة' : 'Task Type'}
                                </label>
                                <select
                                    value={filterTaskType}
                                    onChange={e => setFilterTaskType(e.target.value)}
                                    style={{ padding: '8px 10px', ...glassInner, color: '#e2e8f0', fontSize: 12, outline: 'none', minWidth: 120 }}
                                >
                                    <option value="" style={{ background: '#1a1a2e' }}>{ar ? 'الكل' : 'All'}</option>
                                    {TASK_TYPES.map(t => (
                                        <option key={t.value} value={t.value} style={{ background: '#1a1a2e' }}>
                                            {ar ? t.label : t.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'الفوترة' : 'Billable'}
                                </label>
                                <select
                                    value={filterBillable}
                                    onChange={e => setFilterBillable(e.target.value)}
                                    style={{ padding: '8px 10px', ...glassInner, color: '#e2e8f0', fontSize: 12, outline: 'none', minWidth: 100 }}
                                >
                                    <option value="" style={{ background: '#1a1a2e' }}>{ar ? 'الكل' : 'All'}</option>
                                    <option value="true" style={{ background: '#1a1a2e' }}>{ar ? 'قابل للفوترة' : 'Billable'}</option>
                                    <option value="false" style={{ background: '#1a1a2e' }}>{ar ? 'غير قابل' : 'Non-Billable'}</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'من' : 'From'}
                                </label>
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={e => setFilterDateFrom(e.target.value)}
                                    style={{ padding: '8px 10px', ...glassInner, color: '#e2e8f0', fontSize: 12, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'إلى' : 'To'}
                                </label>
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={e => setFilterDateTo(e.target.value)}
                                    style={{ padding: '8px 10px', ...glassInner, color: '#e2e8f0', fontSize: 12, outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Time Entries List ── */}
                    <div style={{ ...glass, padding: 20 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
                            {ar ? 'سجل الوقت' : 'Time Entries'}
                            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400, marginInlineStart: 8 }}>
                                ({entries.filter(e => e.status !== 'running').length})
                            </span>
                        </h2>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                {ar ? 'جاري التحميل...' : 'Loading...'}
                            </div>
                        ) : Object.keys(entriesByDate).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                {ar ? 'لا توجد سجلات وقت' : 'No time entries found'}
                            </div>
                        ) : (
                            Object.entries(entriesByDate)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([date, dayEntries]) => {
                                    const dateObj = new Date(date);
                                    const dayLabel = ar
                                        ? DAY_NAMES_AR[dateObj.getDay()]
                                        : DAY_NAMES_EN[dateObj.getDay()];
                                    const totalDay = dayEntries.reduce((s, e) => s + e.duration, 0);

                                    return (
                                        <div key={date} style={{ marginBottom: 20 }}>
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8,
                                            }}>
                                                <span style={{ fontWeight: 700, color: '#cbd5e1', fontSize: 14 }}>
                                                    {dayLabel} {dateObj.getDate()}/{dateObj.getMonth() + 1}/{dateObj.getFullYear()}
                                                </span>
                                                <span style={{ fontWeight: 700, color: accent, fontSize: 14 }}>
                                                    {formatDuration(totalDay)}
                                                </span>
                                            </div>

                                            {dayEntries.map(entry => {
                                                const taskInfo = TASK_TYPE_MAP[entry.taskType] || TASK_TYPE_MAP.general;
                                                return (
                                                    <div key={entry.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '10px 12px', ...glassInner, marginBottom: 6,
                                                    }}>
                                                        {/* Task type indicator */}
                                                        <div style={{
                                                            width: 4, height: 36, borderRadius: 4,
                                                            background: taskInfo.color, flexShrink: 0,
                                                        }} />

                                                        {/* Duration */}
                                                        <div style={{
                                                            fontFamily: 'monospace', fontWeight: 700, fontSize: 15,
                                                            color: '#e2e8f0', minWidth: 70,
                                                        }}>
                                                            {formatDuration(entry.duration)}
                                                        </div>

                                                        {/* Description & meta */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: 13, color: '#e2e8f0', fontWeight: 500,
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            }}>
                                                                {entry.description || (ar ? 'بدون وصف' : 'No description')}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                                {ar ? taskInfo.label : taskInfo.labelEn}
                                                                {entry.clientId && clientNameMap[entry.clientId] && (
                                                                    <span style={{ marginInlineStart: 8 }}>
                                                                        {clientNameMap[entry.clientId]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Billable badge */}
                                                        <span style={{
                                                            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                                            background: entry.billable ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                                                            color: entry.billable ? '#22c55e' : '#ef4444',
                                                            flexShrink: 0,
                                                        }}>
                                                            {entry.billable ? (ar ? 'قابل للفوترة' : 'Billable') : (ar ? 'غير قابل' : 'Non-Billable')}
                                                        </span>

                                                        {/* Actions */}
                                                        <button
                                                            onClick={() => openEdit(entry)}
                                                            style={{
                                                                padding: '6px 10px', borderRadius: 8, border: 'none',
                                                                background: 'rgba(99,102,241,0.1)', color: accent,
                                                                cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0,
                                                            }}
                                                        >
                                                            {ar ? 'تعديل' : 'Edit'}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteEntry(entry.id)}
                                                            style={{
                                                                padding: '6px 10px', borderRadius: 8, border: 'none',
                                                                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                                                cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0,
                                                            }}
                                                        >
                                                            {ar ? 'حذف' : 'Delete'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* ═══ Summary Sidebar ═══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
                    {/* Total Hours */}
                    <div style={{ ...glass, padding: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#94a3b8' }}>
                            {ar ? 'ملخص الفترة' : 'Period Summary'}
                        </h3>

                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                fontSize: 42, fontWeight: 800, fontFamily: 'monospace',
                                background: `linear-gradient(135deg, ${accent}, ${violet})`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                {summary?.totalHours?.toFixed(1) || '0.0'}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                {ar ? 'إجمالي الساعات' : 'Total Hours'}
                            </div>
                        </div>

                        {/* Billable vs Non-Billable */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                                <span>{ar ? 'قابل للفوترة' : 'Billable'}</span>
                                <span style={{ color: '#22c55e', fontWeight: 700 }}>
                                    {summary?.billableHours?.toFixed(1) || '0.0'}h
                                </span>
                            </div>
                            <div style={{
                                height: 6, borderRadius: 3,
                                background: 'rgba(255,255,255,0.05)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                                    width: summary && summary.totalHours > 0
                                        ? `${(summary.billableHours / summary.totalHours) * 100}%`
                                        : '0%',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                                <span>{ar ? 'غير قابل للفوترة' : 'Non-Billable'}</span>
                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                    {summary?.nonBillableHours?.toFixed(1) || '0.0'}h
                                </span>
                            </div>
                            <div style={{
                                height: 6, borderRadius: 3,
                                background: 'rgba(255,255,255,0.05)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                    width: summary && summary.totalHours > 0
                                        ? `${(summary.nonBillableHours / summary.totalHours) * 100}%`
                                        : '0%',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>

                        {/* Average Daily */}
                        <div style={{
                            ...glassInner, padding: 12, textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: violet }}>
                                {summary?.avgDailyHours?.toFixed(1) || '0.0'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                                {ar ? 'متوسط يومي (ساعات)' : 'Avg Daily Hours'}
                            </div>
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div style={{ ...glass, padding: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#94a3b8' }}>
                            {ar ? 'أعلى العملاء' : 'Top Clients'}
                        </h3>
                        {summary?.byClient && summary.byClient.length > 0 ? (
                            summary.byClient.slice(0, 5).map((c, i) => {
                                const maxHours = summary.byClient[0].totalHours;
                                const pct = maxHours > 0 ? (c.totalHours / maxHours) * 100 : 0;
                                return (
                                    <div key={c.clientId} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                                                {ar ? c.clientNameAr || c.clientName : c.clientName}
                                            </span>
                                            <span style={{ color: accent, fontWeight: 700 }}>
                                                {c.totalHours.toFixed(1)}h
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 4, borderRadius: 2,
                                            background: 'rgba(255,255,255,0.05)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 2,
                                                background: `linear-gradient(90deg, ${accent}, ${violet})`,
                                                width: `${pct}%`,
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: 16 }}>
                                {ar ? 'لا توجد بيانات' : 'No data'}
                            </div>
                        )}
                    </div>

                    {/* By Task Type */}
                    <div style={{ ...glass, padding: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#94a3b8' }}>
                            {ar ? 'حسب النوع' : 'By Task Type'}
                        </h3>
                        {summary?.byTaskType && summary.byTaskType.length > 0 ? (
                            summary.byTaskType.map(t => {
                                const info = TASK_TYPE_MAP[t.taskType] || TASK_TYPE_MAP.general;
                                const maxH = summary.byTaskType[0].totalHours;
                                const pct = maxH > 0 ? (t.totalHours / maxH) * 100 : 0;
                                return (
                                    <div key={t.taskType} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                            <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: info.color, display: 'inline-block',
                                                }} />
                                                {ar ? info.label : info.labelEn}
                                            </span>
                                            <span style={{ color: info.color, fontWeight: 700 }}>
                                                {t.totalHours.toFixed(1)}h
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 4, borderRadius: 2,
                                            background: 'rgba(255,255,255,0.05)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 2,
                                                background: info.color,
                                                width: `${pct}%`,
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: 16 }}>
                                {ar ? 'لا توجد بيانات' : 'No data'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ Edit Modal ═══ */}
            {editEntry && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000,
                }}
                    onClick={() => setEditEntry(null)}
                >
                    <div
                        style={{ ...glass, padding: 28, width: 440, maxWidth: '90vw' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
                            {ar ? 'تعديل السجل' : 'Edit Entry'}
                        </h3>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                {ar ? 'الوصف' : 'Description'}
                            </label>
                            <input
                                type="text"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', ...glassInner, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'نوع المهمة' : 'Task Type'}
                                </label>
                                <select
                                    value={editTaskType}
                                    onChange={e => setEditTaskType(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', ...glassInner, color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                                >
                                    {TASK_TYPES.map(t => (
                                        <option key={t.value} value={t.value} style={{ background: '#1a1a2e' }}>
                                            {ar ? t.label : t.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    {ar ? 'المدة (دقائق)' : 'Duration (min)'}
                                </label>
                                <input
                                    type="number"
                                    value={editDuration}
                                    onChange={e => setEditDuration(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', ...glassInner, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 13, color: '#cbd5e1' }}>
                            <input
                                type="checkbox"
                                checked={editBillable}
                                onChange={e => setEditBillable(e.target.checked)}
                                style={{ accentColor: accent, width: 16, height: 16 }}
                            />
                            {ar ? 'قابل للفوترة' : 'Billable'}
                        </label>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditEntry(null)}
                                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                            >
                                {ar ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                onClick={saveEdit}
                                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, ${violet})`, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                            >
                                {ar ? 'حفظ' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
