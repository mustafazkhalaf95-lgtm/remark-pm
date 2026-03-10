'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';

/* ═══════════════════════════════════════════════════════════
   Remark PM — Project Timeline / Gantt Chart
   Pure CSS timeline with milestones, dependencies,
   zoom controls, and task grouping by client
   ═══════════════════════════════════════════════════════════ */

interface TimelineTask {
    id: string;
    board: string;
    title: string;
    titleAr: string;
    status: string;
    priority: string;
    startDate: string | null;
    dueDate: string | null;
    completedAt: string | null;
    client: { id: string; name: string; nameAr: string } | null;
    campaign: { id: string; name: string; nameAr: string } | null;
    assignee: { id: string; name: string; nameAr: string } | null;
    color: string;
}

interface Milestone {
    id: string;
    campaignId: string | null;
    clientId: string | null;
    title: string;
    titleAr: string;
    description: string;
    dueDate: string;
    completedAt: string | null;
    status: string;
    color: string;
    sortOrder: number;
}

interface Dependency {
    id: string;
    taskType: string;
    taskId: string;
    dependsOnType: string;
    dependsOnId: string;
    dependencyType: string;
}

interface Client {
    id: string;
    name: string;
    nameAr: string;
}

// ─── Constants ───
const BOARD_COLORS: Record<string, string> = {
    marketing: '#6366f1',
    creative: '#8b5cf6',
    production: '#f59e0b',
    publishing: '#22c55e',
};

const BOARD_LABELS: Record<string, { ar: string; en: string }> = {
    marketing: { ar: 'التسويق', en: 'Marketing' },
    creative: { ar: 'الإبداعي', en: 'Creative' },
    production: { ar: 'البرودكشن', en: 'Production' },
    publishing: { ar: 'النشر', en: 'Publishing' },
};

const STATUS_ICONS: Record<string, string> = {
    completed: '\u2713',
    approved: '\u2713',
    published: '\u2713',
    in_progress: '\u23F3',
    active: '\u23F3',
    pending: '\u25CB',
    draft: '\u25CB',
    review: '\u{1F50D}',
    overdue: '\u26A0',
};

type ZoomLevel = 'day' | 'week' | 'month';

// ─── Helpers ───
function daysBetween(d1: Date, d2: Date): number {
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatShortDate(d: Date): string {
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

function isCompleted(status: string): boolean {
    return ['completed', 'approved', 'published'].includes(status);
}

function isOverdue(task: TimelineTask): boolean {
    if (isCompleted(task.status)) return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
}

// ─── Styles ───
const S = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        direction: 'rtl' as const,
    },
    container: { maxWidth: 1600, margin: '0 auto', padding: '24px 32px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 16 },
    title: { fontSize: 28, fontWeight: 800, color: '#fff' },
    titleAccent: { color: '#6366f1' },
    controls: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
    btn: {
        padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
    },
    btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' },
    btnGhost: { background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' },
    btnGhostActive: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' },
    select: {
        padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 13, outline: 'none',
    },
    glass: {
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
    },
    // Summary cards
    summaryRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
    summaryCard: {
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
        padding: '16px 24px', flex: '1 1 200px', textAlign: 'center' as const,
    },
    summaryNum: { fontSize: 28, fontWeight: 800 },
    summaryLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    // Timeline area
    timelineContainer: {
        display: 'flex', borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
    },
    taskPanel: {
        width: 320, minWidth: 320, borderLeft: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)', overflowY: 'auto' as const,
        maxHeight: 700,
    },
    chartArea: {
        flex: 1, overflowX: 'auto' as const, overflowY: 'auto' as const,
        maxHeight: 700, position: 'relative' as const,
    },
    clientGroup: { borderBottom: '1px solid rgba(255,255,255,0.06)' },
    clientHeader: {
        padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#a5b4fc',
        background: 'rgba(99,102,241,0.08)', cursor: 'pointer',
    },
    taskRow: {
        display: 'flex', alignItems: 'center', padding: '8px 16px', fontSize: 13,
        borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
        transition: 'background 0.2s', gap: 8,
    },
    taskRowHover: { background: 'rgba(255,255,255,0.05)' },
    taskName: { flex: 1, color: '#e2e8f0', fontSize: 13 },
    taskBoard: {
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    },
    taskStatus: { fontSize: 12, color: '#94a3b8', width: 60, textAlign: 'center' as const },
    taskDates: { fontSize: 11, color: '#64748b', width: 100 },
    // Gantt chart
    ganttHeader: {
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky' as const, top: 0, zIndex: 10,
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(8px)',
    },
    ganttCell: {
        textAlign: 'center' as const, padding: '8px 0', fontSize: 11, color: '#64748b',
        borderLeft: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
    },
    ganttRow: {
        display: 'flex', position: 'relative' as const,
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        height: 40,
    },
    ganttRowCell: {
        borderLeft: '1px solid rgba(255,255,255,0.03)',
        flexShrink: 0, height: '100%',
    },
    bar: {
        position: 'absolute' as const, top: 6, height: 28, borderRadius: 8,
        display: 'flex', alignItems: 'center', paddingRight: 8, paddingLeft: 8,
        fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' as const,
        overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.3s',
        cursor: 'pointer', zIndex: 5,
    },
    todayLine: {
        position: 'absolute' as const, top: 0, bottom: 0, width: 2,
        background: '#ef4444', zIndex: 8, pointerEvents: 'none' as const,
    },
    // Milestones
    milestoneDiamond: {
        position: 'absolute' as const, top: 10, width: 20, height: 20,
        transform: 'rotate(45deg)', zIndex: 6, cursor: 'pointer',
        border: '2px solid',
    },
    milestoneSection: {
        marginTop: 24, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24,
    },
    milestoneItem: {
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    // Modal
    overlay: {
        position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    modal: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 500,
    },
    formGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    },
    empty: { textAlign: 'center' as const, padding: 80, color: '#64748b' },
    badge: {
        display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontSize: 11,
        fontWeight: 600,
    },
};

export default function TimelinePage() {
    const [tasks, setTasks] = useState<TimelineTask[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState<ZoomLevel>('week');
    const [filterClient, setFilterClient] = useState('');
    const [filterBoard, setFilterBoard] = useState('');
    const [highlightedTask, setHighlightedTask] = useState<string | null>(null);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [milestoneForm, setMilestoneForm] = useState({ title: '', titleAr: '', description: '', dueDate: '', color: '#6366f1', clientId: '', campaignId: '' });
    const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
    const chartRef = useRef<HTMLDivElement>(null);

    // ─── Fetch ───
    const fetchTimeline = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterClient) params.set('clientId', filterClient);
            if (filterBoard) params.set('board', filterBoard);
            const res = await fetch(`/api/timeline?${params}`);
            const json = await res.json();
            setTasks(json.tasks || []);
            setMilestones(json.milestones || []);
            setDependencies(json.dependencies || []);
        } catch {
            setTasks([]); setMilestones([]); setDependencies([]);
        }
        setLoading(false);
    }, [filterClient, filterBoard]);

    useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

    // ─── Derived data ───
    const clients = useMemo(() => {
        const map = new Map<string, Client>();
        tasks.forEach((t) => {
            if (t.client) map.set(t.client.id, t.client);
        });
        return Array.from(map.values());
    }, [tasks]);

    const groupedTasks = useMemo(() => {
        const groups: Record<string, TimelineTask[]> = {};
        const uncategorized: TimelineTask[] = [];
        tasks.forEach((t) => {
            const cid = t.client?.id || '__none__';
            if (cid === '__none__') { uncategorized.push(t); return; }
            if (!groups[cid]) groups[cid] = [];
            groups[cid].push(t);
        });
        if (uncategorized.length) groups['__none__'] = uncategorized;
        return groups;
    }, [tasks]);

    // ─── Timeline range ───
    const { timelineStart, timelineEnd, totalDays, colWidth, columns } = useMemo(() => {
        const now = new Date();
        let minDate = new Date(now);
        let maxDate = new Date(now);
        minDate.setDate(minDate.getDate() - 14);
        maxDate.setDate(maxDate.getDate() + 60);

        tasks.forEach((t) => {
            if (t.startDate) {
                const sd = new Date(t.startDate);
                if (sd < minDate) minDate = sd;
            }
            if (t.dueDate) {
                const dd = new Date(t.dueDate);
                if (dd > maxDate) maxDate = dd;
            }
        });
        milestones.forEach((m) => {
            const md = new Date(m.dueDate);
            if (md > maxDate) maxDate = md;
            if (md < minDate) minDate = md;
        });

        // Add padding
        minDate = addDays(minDate, -7);
        maxDate = addDays(maxDate, 14);

        const total = daysBetween(minDate, maxDate);
        let cw = 40;
        if (zoom === 'day') cw = 60;
        if (zoom === 'week') cw = 40;
        if (zoom === 'month') cw = 16;

        // Build column headers
        const cols: { date: Date; label: string; isToday: boolean; isWeekend: boolean }[] = [];
        const todayStr = now.toDateString();
        for (let i = 0; i < total; i++) {
            const d = addDays(minDate, i);
            const day = d.getDay();
            const isWeekend = day === 5 || day === 6; // Friday & Saturday for Iraq
            let label = '';
            if (zoom === 'day') {
                label = d.toLocaleDateString('ar-EG', { day: 'numeric', weekday: 'short' });
            } else if (zoom === 'week') {
                if (d.getDay() === 0 || i === 0) label = formatShortDate(d);
            } else {
                if (d.getDate() === 1 || i === 0) label = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
            }
            cols.push({ date: d, label, isToday: d.toDateString() === todayStr, isWeekend });
        }

        return { timelineStart: minDate, timelineEnd: maxDate, totalDays: total, colWidth: cw, columns: cols };
    }, [tasks, milestones, zoom]);

    // ─── Position helpers ───
    const getBarPosition = (task: TimelineTask) => {
        const start = task.startDate ? new Date(task.startDate) : new Date();
        const end = task.dueDate ? new Date(task.dueDate) : addDays(start, 7);
        const startOffset = Math.max(0, daysBetween(timelineStart, start));
        const duration = Math.max(1, daysBetween(start, end));
        return { left: startOffset * colWidth, width: Math.max(duration * colWidth, colWidth) };
    };

    const getTodayPosition = () => {
        const todayOffset = daysBetween(timelineStart, new Date());
        return todayOffset * colWidth;
    };

    // ─── Summary stats ───
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => isCompleted(t.status)).length;
    const overdueTasks = tasks.filter(isOverdue).length;
    const onTimePercent = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;
    const nextMilestone = milestones
        .filter((m) => !m.completedAt)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    // ─── Scroll to today ───
    useEffect(() => {
        if (!loading && chartRef.current) {
            const todayPos = getTodayPosition();
            chartRef.current.scrollLeft = Math.max(0, todayPos - 300);
        }
    }, [loading, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Toggle client collapse ───
    const toggleClient = (clientId: string) => {
        const next = new Set(collapsedClients);
        if (next.has(clientId)) next.delete(clientId);
        else next.add(clientId);
        setCollapsedClients(next);
    };

    // ─── Milestone CRUD ───
    const handleSaveMilestone = async () => {
        if (!milestoneForm.title || !milestoneForm.dueDate) return;
        try {
            if (editingMilestone) {
                const res = await fetch(`/api/milestones/${editingMilestone.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(milestoneForm),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setMilestones(milestones.map((m) => m.id === updated.id ? updated : m));
                }
            } else {
                const res = await fetch('/api/milestones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(milestoneForm),
                });
                if (res.ok) {
                    const created = await res.json();
                    setMilestones([...milestones, created]);
                }
            }
        } catch { /* silent */ }
        setShowMilestoneModal(false);
        setEditingMilestone(null);
        setMilestoneForm({ title: '', titleAr: '', description: '', dueDate: '', color: '#6366f1', clientId: '', campaignId: '' });
    };

    const handleDeleteMilestone = async (id: string) => {
        if (!confirm('حذف هذا المعلم؟ / Delete this milestone?')) return;
        await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
        setMilestones(milestones.filter((m) => m.id !== id));
    };

    const openEditMilestone = (m: Milestone) => {
        setEditingMilestone(m);
        setMilestoneForm({
            title: m.title, titleAr: m.titleAr, description: m.description,
            dueDate: m.dueDate.split('T')[0], color: m.color,
            clientId: m.clientId || '', campaignId: m.campaignId || '',
        });
        setShowMilestoneModal(true);
    };

    // ─── Build flat task list for Gantt rows (maintains same order as panel) ───
    const flatTasks = useMemo(() => {
        const result: TimelineTask[] = [];
        const clientIds = Object.keys(groupedTasks);
        clientIds.forEach((cid) => {
            if (!collapsedClients.has(cid)) {
                result.push(...groupedTasks[cid]);
            }
        });
        return result;
    }, [groupedTasks, collapsedClients]);

    return (
        <AppLayout>
            <div style={S.page}>
                <div style={S.container}>
                    {/* Header */}
                    <div style={S.header}>
                        <div>
                            <h1 style={S.title}>
                                <span style={S.titleAccent}>{'🗓'}</span>{' '}
                                {'الجدول الزمني'}{' '}
                                <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>Timeline</span>
                            </h1>
                        </div>
                        <div style={S.controls}>
                            <select style={S.select} value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                                <option value="">{'كل العملاء / All Clients'}</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
                                ))}
                            </select>
                            <select style={S.select} value={filterBoard} onChange={(e) => setFilterBoard(e.target.value)}>
                                <option value="">{'كل الأقسام / All Boards'}</option>
                                {Object.entries(BOARD_LABELS).map(([key, labels]) => (
                                    <option key={key} value={key}>{labels.ar}</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3 }}>
                                {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
                                    <button
                                        key={z}
                                        style={{ ...S.btn, padding: '6px 14px', ...(zoom === z ? S.btnGhostActive : S.btnGhost), border: 'none' }}
                                        onClick={() => setZoom(z)}
                                    >
                                        {z === 'day' ? 'يوم / Day' : z === 'week' ? 'أسبوع / Week' : 'شهر / Month'}
                                    </button>
                                ))}
                            </div>
                            <button
                                style={{ ...S.btn, ...S.btnPrimary }}
                                onClick={() => {
                                    if (chartRef.current) {
                                        chartRef.current.scrollLeft = Math.max(0, getTodayPosition() - 300);
                                    }
                                }}
                            >
                                {'اليوم / Today'}
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div style={S.summaryRow}>
                        <div style={S.summaryCard}>
                            <div style={{ ...S.summaryNum, color: '#6366f1' }}>{totalTasks}</div>
                            <div style={S.summaryLabel}>{'اجمالي المهام / Total Tasks'}</div>
                        </div>
                        <div style={S.summaryCard}>
                            <div style={{ ...S.summaryNum, color: '#22c55e' }}>{onTimePercent}%</div>
                            <div style={S.summaryLabel}>{'في الوقت / On-time'}</div>
                        </div>
                        <div style={S.summaryCard}>
                            <div style={{ ...S.summaryNum, color: '#f87171' }}>{overdueTasks}</div>
                            <div style={S.summaryLabel}>{'متأخرة / Overdue'}</div>
                        </div>
                        <div style={S.summaryCard}>
                            <div style={{ ...S.summaryNum, color: '#f59e0b' }}>
                                {nextMilestone ? formatShortDate(new Date(nextMilestone.dueDate)) : '-'}
                            </div>
                            <div style={S.summaryLabel}>
                                {nextMilestone ? (nextMilestone.titleAr || nextMilestone.title) : 'لا معالم قادمة / No upcoming'}
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && <div style={S.empty}>{'جاري التحميل... / Loading...'}</div>}

                    {/* Timeline */}
                    {!loading && (
                        <div style={S.timelineContainer}>
                            {/* Task List Panel (right side in RTL) */}
                            <div style={S.taskPanel}>
                                {/* Panel header */}
                                <div style={{
                                    padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#64748b',
                                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(15,15,26,0.95)',
                                    position: 'sticky', top: 0, zIndex: 10,
                                    display: 'flex', gap: 8,
                                }}>
                                    <span style={{ flex: 1 }}>{'المهمة / Task'}</span>
                                    <span style={{ width: 60, textAlign: 'center' }}>{'الحالة'}</span>
                                </div>
                                {Object.entries(groupedTasks).map(([clientId, clientTasks]) => {
                                    const client = clients.find((c) => c.id === clientId);
                                    const isCollapsed = collapsedClients.has(clientId);
                                    return (
                                        <div key={clientId} style={S.clientGroup}>
                                            <div
                                                style={S.clientHeader}
                                                onClick={() => toggleClient(clientId)}
                                            >
                                                <span>{isCollapsed ? '◀' : '▼'}{' '}</span>
                                                {clientId === '__none__' ? 'بدون عميل / Uncategorized' :
                                                    (client?.nameAr || client?.name || clientId)}
                                                <span style={{ color: '#64748b', marginRight: 8, fontSize: 11 }}>
                                                    ({clientTasks.length})
                                                </span>
                                            </div>
                                            {!isCollapsed && clientTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    style={{
                                                        ...S.taskRow,
                                                        background: highlightedTask === task.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                    }}
                                                    onClick={() => setHighlightedTask(highlightedTask === task.id ? null : task.id)}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = highlightedTask === task.id ? 'rgba(99,102,241,0.1)' : 'transparent')}
                                                >
                                                    <span style={{ ...S.taskBoard, background: task.color }} />
                                                    <span style={S.taskName}>
                                                        {task.titleAr || task.title}
                                                    </span>
                                                    <span style={S.taskStatus}>
                                                        {STATUS_ICONS[task.status] || '\u25CB'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                                {tasks.length === 0 && (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        {'لا توجد مهام / No tasks'}
                                    </div>
                                )}
                            </div>

                            {/* Gantt Chart Area */}
                            <div style={S.chartArea} ref={chartRef}>
                                {/* Date headers */}
                                <div style={{ ...S.ganttHeader, width: totalDays * colWidth }}>
                                    {columns.map((col, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                ...S.ganttCell,
                                                width: colWidth,
                                                background: col.isToday ? 'rgba(239,68,68,0.1)' :
                                                    col.isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                fontWeight: col.isToday ? 700 : 400,
                                                color: col.isToday ? '#ef4444' : '#64748b',
                                            }}
                                        >
                                            {col.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Gantt rows */}
                                <div style={{ position: 'relative', width: totalDays * colWidth }}>
                                    {/* Today line */}
                                    <div style={{ ...S.todayLine, right: getTodayPosition() }} />

                                    {/* Client group headers in chart area */}
                                    {(() => {
                                        const rows: React.ReactNode[] = [];
                                        Object.entries(groupedTasks).forEach(([clientId, clientTasks]) => {
                                            const isCollapsed = collapsedClients.has(clientId);
                                            // Client header row
                                            rows.push(
                                                <div key={`h-${clientId}`} style={{
                                                    height: 34, width: totalDays * colWidth,
                                                    background: 'rgba(99,102,241,0.04)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                                }} />
                                            );
                                            if (!isCollapsed) {
                                                clientTasks.forEach((task) => {
                                                    const { left, width } = getBarPosition(task);
                                                    const completed = isCompleted(task.status);
                                                    const overdue = isOverdue(task);
                                                    rows.push(
                                                        <div key={task.id} style={{ ...S.ganttRow, width: totalDays * colWidth }}>
                                                            {/* Grid cells for background */}
                                                            {columns.map((col, ci) => (
                                                                <div
                                                                    key={ci}
                                                                    style={{
                                                                        ...S.ganttRowCell,
                                                                        width: colWidth,
                                                                        background: col.isToday ? 'rgba(239,68,68,0.04)' :
                                                                            col.isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent',
                                                                    }}
                                                                />
                                                            ))}
                                                            {/* Task bar */}
                                                            <div
                                                                style={{
                                                                    ...S.bar,
                                                                    right: left,
                                                                    width: width,
                                                                    background: completed
                                                                        ? `linear-gradient(135deg, ${task.color}88, ${task.color}44)`
                                                                        : overdue
                                                                            ? `linear-gradient(135deg, #ef4444, #dc2626)`
                                                                            : `linear-gradient(135deg, ${task.color}, ${task.color}cc)`,
                                                                    opacity: highlightedTask && highlightedTask !== task.id ? 0.3 : 1,
                                                                    boxShadow: highlightedTask === task.id ? `0 0 12px ${task.color}40` : 'none',
                                                                }}
                                                                onClick={() => setHighlightedTask(highlightedTask === task.id ? null : task.id)}
                                                            >
                                                                {completed && <span style={{ marginLeft: 4 }}>{'\u2713'}</span>}
                                                                {!completed && !overdue && task.status.includes('progress') && <span style={{ marginLeft: 4 }}>{'\u23F3'}</span>}
                                                                {overdue && <span style={{ marginLeft: 4 }}>{'\u26A0'}</span>}
                                                                {width > 80 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.titleAr || task.title}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            }
                                        });

                                        // Milestone diamonds on the chart
                                        milestones.forEach((m) => {
                                            const mDay = daysBetween(timelineStart, new Date(m.dueDate));
                                            const mPos = mDay * colWidth;
                                            rows.push(
                                                <div
                                                    key={`ms-${m.id}`}
                                                    style={{
                                                        position: 'absolute', top: 0, right: mPos - 10,
                                                        width: 0, height: '100%', zIndex: 7,
                                                        borderRight: `2px dashed ${m.color}40`,
                                                        pointerEvents: 'none',
                                                    }}
                                                />
                                            );
                                        });

                                        return rows;
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Milestones Section */}
                    {!loading && (
                        <div style={S.milestoneSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                                    {'المعالم الرئيسية / Milestones'}{' '}
                                    <span style={{ fontSize: 13, color: '#64748b' }}>({milestones.length})</span>
                                </h2>
                                <button
                                    style={{ ...S.btn, ...S.btnPrimary }}
                                    onClick={() => {
                                        setEditingMilestone(null);
                                        setMilestoneForm({ title: '', titleAr: '', description: '', dueDate: '', color: '#6366f1', clientId: '', campaignId: '' });
                                        setShowMilestoneModal(true);
                                    }}
                                >
                                    {'+ إضافة معلم'}
                                </button>
                            </div>
                            {milestones.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                                    {'لا توجد معالم / No milestones'}
                                </div>
                            )}
                            {milestones.map((m) => (
                                <div key={m.id} style={S.milestoneItem}>
                                    <div style={{
                                        width: 16, height: 16, transform: 'rotate(45deg)',
                                        background: m.completedAt ? m.color : 'transparent',
                                        border: `2px solid ${m.color}`, flexShrink: 0,
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                                            {m.titleAr || m.title}
                                            {m.completedAt && <span style={{ color: '#22c55e', marginRight: 8 }}>{' \u2713'}</span>}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {formatShortDate(new Date(m.dueDate))}
                                            {m.description && ` - ${m.description}`}
                                        </div>
                                    </div>
                                    <span style={{
                                        ...S.badge,
                                        background: m.status === 'completed' ? 'rgba(34,197,94,0.15)' :
                                            m.status === 'overdue' ? 'rgba(248,113,113,0.15)' :
                                                m.status === 'in_progress' ? 'rgba(245,158,11,0.15)' :
                                                    'rgba(99,102,241,0.15)',
                                        color: m.status === 'completed' ? '#22c55e' :
                                            m.status === 'overdue' ? '#f87171' :
                                                m.status === 'in_progress' ? '#f59e0b' :
                                                    '#a5b4fc',
                                    }}>
                                        {m.status === 'completed' ? 'مكتمل' : m.status === 'overdue' ? 'متأخر' :
                                            m.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                                    </span>
                                    <button
                                        style={{ ...S.btn, ...S.btnGhost, padding: '6px 10px', fontSize: 12 }}
                                        onClick={() => openEditMilestone(m)}
                                    >
                                        {'تعديل'}
                                    </button>
                                    <button
                                        style={{ ...S.btn, padding: '6px 10px', fontSize: 12, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                                        onClick={() => handleDeleteMilestone(m.id)}
                                    >
                                        {'حذف'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ═══ Milestone Modal ═══ */}
                    {showMilestoneModal && (
                        <div style={S.overlay} onClick={() => setShowMilestoneModal(false)}>
                            <div style={S.modal} onClick={(e) => e.stopPropagation()}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>
                                    {editingMilestone ? 'تعديل المعلم / Edit Milestone' : 'إضافة معلم جديد / Add Milestone'}
                                </h2>
                                <div style={S.formGroup}>
                                    <label style={S.label}>{'العنوان (عربي) / Title (Arabic)'}</label>
                                    <input
                                        style={S.input}
                                        value={milestoneForm.title}
                                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                        placeholder="عنوان المعلم..."
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>{'العنوان (إنجليزي) / Title (English)'}</label>
                                    <input
                                        style={S.input}
                                        value={milestoneForm.titleAr}
                                        onChange={(e) => setMilestoneForm({ ...milestoneForm, titleAr: e.target.value })}
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>{'الوصف / Description'}</label>
                                    <input
                                        style={S.input}
                                        value={milestoneForm.description}
                                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>{'التاريخ / Due Date'}</label>
                                        <input
                                            style={S.input}
                                            type="date"
                                            value={milestoneForm.dueDate}
                                            onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>{'اللون / Color'}</label>
                                        <input
                                            style={{ ...S.input, padding: 4, height: 42 }}
                                            type="color"
                                            value={milestoneForm.color}
                                            onChange={(e) => setMilestoneForm({ ...milestoneForm, color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                                    <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setShowMilestoneModal(false)}>
                                        {'إلغاء / Cancel'}
                                    </button>
                                    <button
                                        style={{ ...S.btn, ...S.btnPrimary }}
                                        onClick={handleSaveMilestone}
                                        disabled={!milestoneForm.title || !milestoneForm.dueDate}
                                    >
                                        {editingMilestone ? 'تحديث / Update' : 'إنشاء / Create'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Board legend */}
                    {!loading && tasks.length > 0 && (
                        <div style={{ display: 'flex', gap: 20, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {Object.entries(BOARD_COLORS).map(([board, color]) => (
                                <div key={board} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
                                    {BOARD_LABELS[board]?.ar || board}
                                </div>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                                <span style={{ width: 12, height: 2, background: '#ef4444', display: 'inline-block' }} />
                                {'خط اليوم / Today'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
