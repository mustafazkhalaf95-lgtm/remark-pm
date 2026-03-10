'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/hooks';

/* ══════════════════════════════════════════════════════════
   Remark PM — Analytics Dashboard
   KPIs, charts (CSS-only), board analytics, team stats
   ══════════════════════════════════════════════════════════ */

// ─── Types ───

interface AnalyticsData {
    period: string;
    startDate: string;
    endDate: string;
    kpis: {
        totalRevenue: number;
        activeClients: number;
        conversionRate: number;
        avgCompletionDays: number;
        totalHours: number;
        onTimeRate: number;
        totalExpenses: number;
        netIncome: number;
    };
    boardStats: {
        marketing: {
            total: number;
            inPeriod: number;
            statuses: Record<string, number>;
            completedInPeriod: number;
            byPriority: { high: number; medium: number; low: number };
        };
        creative: {
            total: number;
            inPeriod: number;
            statuses: Record<string, number>;
            approvalRate: number;
            avgRevisionRounds: number;
            byCategory: Record<string, number>;
        };
        production: {
            total: number;
            inPeriod: number;
            statuses: Record<string, number>;
            completedInPeriod: number;
            byJobType: Record<string, number>;
            onTimeDelivery: number;
        };
        publishing: {
            total: number;
            inPeriod: number;
            statuses: Record<string, number>;
            publishedInPeriod: number;
            byPlatform: Record<string, number>;
            schedulingAccuracy: number;
        };
    };
    revenueByMonth: Record<string, number>;
    revenueByClient: Array<{
        clientId: string;
        clientName: string;
        clientNameAr: string;
        total: number;
    }>;
    tasksDistribution: {
        marketing: { count: number; percentage: number };
        creative: { count: number; percentage: number };
        production: { count: number; percentage: number };
        publishing: { count: number; percentage: number };
    };
    teamStats: Array<{
        userId: string;
        name: string;
        nameAr: string;
        avatar: string;
        tasksCompleted: number;
        tasksTotal: number;
        hoursLogged: number;
        utilization: number;
        onTimeRate: number;
    }>;
}

// ─── Constants ───

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const BOARD_COLORS: Record<string, string> = {
    marketing: '#6366f1',
    creative: '#8b5cf6',
    production: '#22c55e',
    publishing: '#f59e0b',
};

const BOARD_LABELS: Record<string, { ar: string; en: string }> = {
    marketing: { ar: 'التسويق', en: 'Marketing' },
    creative: { ar: 'الإبداعي', en: 'Creative' },
    production: { ar: 'الإنتاج', en: 'Production' },
    publishing: { ar: 'النشر', en: 'Publishing' },
};

const MONTH_LABELS_AR: Record<string, string> = {
    '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
    '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
    '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر',
};

const MONTH_LABELS_EN: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

// ─── Helpers ───

function formatCurrency(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
}

// ─── Styles ───

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

export default function AnalyticsPage() {
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const ar = lang === 'ar';

    const [period, setPeriod] = useState('month');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [boardTab, setBoardTab] = useState<'marketing' | 'creative' | 'production' | 'publishing'>('marketing');
    const [teamSort, setTeamSort] = useState<'tasksCompleted' | 'hoursLogged' | 'utilization' | 'onTimeRate'>('tasksCompleted');
    const [teamSortDir, setTeamSortDir] = useState<'asc' | 'desc'>('desc');

    // ─── Fetch ───

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl(`/api/analytics?period=${period}`));
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error('Failed to fetch analytics:', e);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── Period Buttons ───

    const periods = [
        { key: 'week', label: ar ? 'هذا الأسبوع' : 'This Week' },
        { key: 'month', label: ar ? 'هذا الشهر' : 'This Month' },
        { key: 'quarter', label: ar ? 'هذا الربع' : 'This Quarter' },
        { key: 'year', label: ar ? 'هذه السنة' : 'This Year' },
    ];

    // ─── Team Sort ───

    const sortedTeam = data?.teamStats
        ? [...data.teamStats].sort((a, b) => {
            const aVal = a[teamSort];
            const bVal = b[teamSort];
            return teamSortDir === 'desc' ? bVal - aVal : aVal - bVal;
        })
        : [];

    const handleTeamSort = (col: typeof teamSort) => {
        if (teamSort === col) {
            setTeamSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setTeamSort(col);
            setTeamSortDir('desc');
        }
    };

    // ─── Board tabs ───

    const boardTabs = [
        { key: 'marketing' as const, label: ar ? 'التسويق' : 'Marketing' },
        { key: 'creative' as const, label: ar ? 'الإبداعي' : 'Creative' },
        { key: 'production' as const, label: ar ? 'الإنتاج' : 'Production' },
        { key: 'publishing' as const, label: ar ? 'النشر' : 'Publishing' },
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
                        {ar ? 'لوحة التحليلات' : 'Analytics Dashboard'}
                    </h1>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
                        {ar ? 'رؤية شاملة لأداء الأعمال والفريق' : 'Comprehensive business and team performance overview'}
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

            {/* ── Date Range Filter ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, ...glass, padding: 4, width: 'fit-content' }}>
                {periods.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        style={{
                            padding: '10px 20px', borderRadius: 12, border: 'none',
                            cursor: 'pointer', fontWeight: 700, fontSize: 13,
                            color: period === p.key ? '#fff' : '#94a3b8',
                            background: period === p.key ? `linear-gradient(135deg, ${accent}, ${violet})` : 'transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 16 }}>
                    {ar ? 'جاري تحميل البيانات...' : 'Loading analytics data...'}
                </div>
            ) : data ? (
                <>
                    {/* ═══ KPI Cards Row ═══ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                        {[
                            {
                                label: ar ? 'إجمالي الإيرادات' : 'Revenue',
                                value: formatCurrency(data.kpis.totalRevenue),
                                color: '#22c55e',
                                icon: '$',
                            },
                            {
                                label: ar ? 'عدد العملاء النشطين' : 'Active Clients',
                                value: String(data.kpis.activeClients),
                                color: accent,
                                icon: '',
                            },
                            {
                                label: ar ? 'معدل التحويل' : 'Conversion Rate',
                                value: `${data.kpis.conversionRate}%`,
                                color: violet,
                                icon: '%',
                            },
                            {
                                label: ar ? 'متوسط وقت الإنجاز' : 'Avg Completion',
                                value: `${data.kpis.avgCompletionDays}d`,
                                color: '#06b6d4',
                                icon: '',
                            },
                            {
                                label: ar ? 'إجمالي ساعات العمل' : 'Total Hours',
                                value: `${data.kpis.totalHours}h`,
                                color: '#f59e0b',
                                icon: '',
                            },
                            {
                                label: ar ? 'معدل الإنجاز في الوقت' : 'On-time Rate',
                                value: `${data.kpis.onTimeRate}%`,
                                color: '#ec4899',
                                icon: '',
                            },
                        ].map((kpi, i) => (
                            <div key={i} style={{ ...glass, padding: 20 }}>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
                                    {kpi.label}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, fontFamily: 'monospace' }}>
                                    {kpi.value}
                                </div>
                                {/* Small accent bar */}
                                <div style={{
                                    width: 40, height: 3, borderRadius: 2,
                                    background: kpi.color, marginTop: 10, opacity: 0.6,
                                }} />
                            </div>
                        ))}
                    </div>

                    {/* ═══ Charts Section ═══ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

                        {/* ── Revenue Over Time ── */}
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#cbd5e1' }}>
                                {ar ? 'الإيرادات حسب الشهر' : 'Revenue Over Time'}
                            </h3>
                            {Object.keys(data.revenueByMonth).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {(() => {
                                        const monthEntries = Object.entries(data.revenueByMonth).sort(([a], [b]) => a.localeCompare(b));
                                        const maxVal = Math.max(...monthEntries.map(([, v]) => v), 1);
                                        return monthEntries.map(([month, value], i) => {
                                            const monthNum = month.split('-')[1];
                                            const label = ar ? MONTH_LABELS_AR[monthNum] || month : MONTH_LABELS_EN[monthNum] || month;
                                            const pct = (value / maxVal) * 100;
                                            return (
                                                <div key={month}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                        <span style={{ color: '#94a3b8' }}>{label}</span>
                                                        <span style={{ color: '#22c55e', fontWeight: 700 }}>{formatCurrency(value)}</span>
                                                    </div>
                                                    <div style={{
                                                        height: 20, borderRadius: 6,
                                                        background: 'rgba(255,255,255,0.04)',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 6,
                                                            background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}90, ${CHART_COLORS[i % CHART_COLORS.length]})`,
                                                            width: `${pct}%`,
                                                            transition: 'width 0.8s ease',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                            paddingInlineEnd: 8, fontSize: 10, fontWeight: 700, color: '#fff',
                                                            minWidth: pct > 15 ? undefined : 0,
                                                        }}>
                                                            {pct > 15 ? formatCurrency(value) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 30, color: '#475569', fontSize: 13 }}>
                                    {ar ? 'لا توجد بيانات إيرادات' : 'No revenue data'}
                                </div>
                            )}
                        </div>

                        {/* ── Tasks Distribution ── */}
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#cbd5e1' }}>
                                {ar ? 'توزيع المهام' : 'Tasks Distribution'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {Object.entries(data.tasksDistribution).map(([board, info]) => (
                                    <div key={board}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                            <span style={{ color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    width: 10, height: 10, borderRadius: 3,
                                                    background: BOARD_COLORS[board], display: 'inline-block',
                                                }} />
                                                {ar ? BOARD_LABELS[board]?.ar : BOARD_LABELS[board]?.en}
                                            </span>
                                            <span style={{ color: BOARD_COLORS[board], fontWeight: 700 }}>
                                                {info.count} ({info.percentage}%)
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 24, borderRadius: 8,
                                            background: 'rgba(255,255,255,0.04)',
                                            overflow: 'hidden', position: 'relative',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 8,
                                                background: `linear-gradient(90deg, ${BOARD_COLORS[board]}40, ${BOARD_COLORS[board]})`,
                                                width: `${info.percentage}%`,
                                                transition: 'width 0.8s ease',
                                                display: 'flex', alignItems: 'center',
                                                paddingInlineEnd: 10,
                                                justifyContent: 'flex-end',
                                                fontSize: 11, fontWeight: 700, color: '#fff',
                                            }}>
                                                {info.percentage > 10 ? `${info.percentage}%` : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total all tasks */}
                            <div style={{
                                marginTop: 16, paddingTop: 12,
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', justifyContent: 'space-between', fontSize: 14,
                            }}>
                                <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                                    {ar ? 'إجمالي المهام' : 'Total Tasks'}
                                </span>
                                <span style={{ color: accent, fontWeight: 800 }}>
                                    {Object.values(data.tasksDistribution).reduce((s, v) => s + v.count, 0)}
                                </span>
                            </div>
                        </div>

                        {/* ── Team Performance ── */}
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#cbd5e1' }}>
                                {ar ? 'أداء الفريق' : 'Team Performance'}
                            </h3>
                            {sortedTeam.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {sortedTeam.slice(0, 8).map((m, i) => {
                                        const maxTasks = Math.max(...sortedTeam.map(t => t.tasksCompleted), 1);
                                        const pct = (m.tasksCompleted / maxTasks) * 100;
                                        return (
                                            <div key={m.userId}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                                                        {ar ? m.nameAr || m.name : m.name}
                                                    </span>
                                                    <span style={{ color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 700 }}>
                                                        {m.tasksCompleted} {ar ? 'مهمة' : 'tasks'}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: 16, borderRadius: 6,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 6,
                                                        background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}60, ${CHART_COLORS[i % CHART_COLORS.length]})`,
                                                        width: `${pct}%`,
                                                        transition: 'width 0.8s ease',
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 30, color: '#475569', fontSize: 13 }}>
                                    {ar ? 'لا توجد بيانات فريق' : 'No team data'}
                                </div>
                            )}
                        </div>

                        {/* ── Client Revenue ── */}
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#cbd5e1' }}>
                                {ar ? 'إيرادات العملاء (أعلى 5)' : 'Client Revenue (Top 5)'}
                            </h3>
                            {data.revenueByClient.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {data.revenueByClient.slice(0, 5).map((c, i) => {
                                        const maxRev = data.revenueByClient[0]?.total || 1;
                                        const pct = (c.total / maxRev) * 100;
                                        return (
                                            <div key={c.clientId}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                                                        {ar ? c.clientNameAr || c.clientName : c.clientName}
                                                    </span>
                                                    <span style={{ color: '#22c55e', fontWeight: 700 }}>
                                                        {formatCurrency(c.total)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: 20, borderRadius: 6,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 6,
                                                        background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}60, ${CHART_COLORS[i % CHART_COLORS.length]})`,
                                                        width: `${pct}%`,
                                                        transition: 'width 0.8s ease',
                                                        display: 'flex', alignItems: 'center',
                                                        paddingInlineEnd: 8, justifyContent: 'flex-end',
                                                        fontSize: 10, fontWeight: 700, color: '#fff',
                                                    }}>
                                                        {pct > 20 ? formatCurrency(c.total) : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 30, color: '#475569', fontSize: 13 }}>
                                    {ar ? 'لا توجد بيانات إيرادات عملاء' : 'No client revenue data'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══ Board Analytics Tabs ═══ */}
                    <div style={{ ...glass, padding: 24, marginBottom: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>
                            {ar ? 'تحليلات الأقسام' : 'Board Analytics'}
                        </h2>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 20, ...glassInner, padding: 4, width: 'fit-content' }}>
                            {boardTabs.map(bt => (
                                <button
                                    key={bt.key}
                                    onClick={() => setBoardTab(bt.key)}
                                    style={{
                                        padding: '8px 20px', borderRadius: 10, border: 'none',
                                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                        color: boardTab === bt.key ? '#fff' : '#94a3b8',
                                        background: boardTab === bt.key
                                            ? BOARD_COLORS[bt.key]
                                            : 'transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {bt.label}
                                </button>
                            ))}
                        </div>

                        {/* ── Marketing Tab ── */}
                        {boardTab === 'marketing' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                {/* Conversion Funnel */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'قمع التحويل' : 'Conversion Funnel'}
                                    </div>
                                    {['pending', 'in_progress', 'review', 'approved', 'completed'].map((status, i, arr) => {
                                        const count = data.boardStats.marketing.statuses[status] || 0;
                                        const total = data.boardStats.marketing.total || 1;
                                        const pct = Math.round((count / total) * 100);
                                        const width = 100 - (i * 15);
                                        return (
                                            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <div style={{
                                                    height: 20, borderRadius: 4,
                                                    background: `${accent}${String(Math.floor(20 + i * 20)).padStart(2, '0')}`,
                                                    width: `${width}%`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, fontWeight: 700, color: '#e2e8f0',
                                                }}>
                                                    {status.replace('_', ' ')} ({count})
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pipeline Velocity */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'سرعة الأنبوب' : 'Pipeline Velocity'}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 36, fontWeight: 800, color: accent }}>
                                            {data.boardStats.marketing.completedInPeriod}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {ar ? 'مهام مكتملة هذه الفترة' : 'Completed this period'}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#06b6d4', textAlign: 'center' }}>
                                            {data.kpis.avgCompletionDays}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                                            {ar ? 'أيام متوسط الإنجاز' : 'Avg days to complete'}
                                        </div>
                                    </div>
                                </div>

                                {/* Priority Breakdown */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'حسب الأولوية' : 'By Priority'}
                                    </div>
                                    {[
                                        { key: 'high', label: ar ? 'عالية' : 'High', color: '#ef4444', count: data.boardStats.marketing.byPriority.high },
                                        { key: 'medium', label: ar ? 'متوسطة' : 'Medium', color: '#f59e0b', count: data.boardStats.marketing.byPriority.medium },
                                        { key: 'low', label: ar ? 'منخفضة' : 'Low', color: '#22c55e', count: data.boardStats.marketing.byPriority.low },
                                    ].map(p => {
                                        const total = data.boardStats.marketing.inPeriod || 1;
                                        const pct = Math.round((p.count / total) * 100);
                                        return (
                                            <div key={p.key} style={{ marginBottom: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                    <span style={{ color: '#cbd5e1' }}>{p.label}</span>
                                                    <span style={{ color: p.color, fontWeight: 700 }}>{p.count} ({pct}%)</span>
                                                </div>
                                                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 4,
                                                        background: p.color, width: `${pct}%`,
                                                        transition: 'width 0.5s',
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Creative Tab ── */}
                        {boardTab === 'creative' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                {/* Approval Rate */}
                                <div style={{ ...glassInner, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'معدل الموافقة' : 'Approval Rate'}
                                    </div>
                                    {/* Circular progress indicator using CSS */}
                                    <div style={{
                                        width: 100, height: 100, borderRadius: '50%',
                                        background: `conic-gradient(${violet} ${data.boardStats.creative.approvalRate * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 8px',
                                    }}>
                                        <div style={{
                                            width: 76, height: 76, borderRadius: '50%',
                                            background: '#1a1a2e', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{ fontSize: 22, fontWeight: 800, color: violet }}>
                                                {data.boardStats.creative.approvalRate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        {ar ? 'نسبة الموافقة النهائية' : 'Final approval rate'}
                                    </div>
                                </div>

                                {/* Revision Rounds */}
                                <div style={{ ...glassInner, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'متوسط جولات المراجعة' : 'Avg Revision Rounds'}
                                    </div>
                                    <div style={{ fontSize: 48, fontWeight: 800, color: '#ec4899' }}>
                                        {data.boardStats.creative.avgRevisionRounds}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        {ar ? 'جولة مراجعة في المتوسط' : 'rounds per request'}
                                    </div>
                                </div>

                                {/* By Category */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'حسب الفئة' : 'By Category'}
                                    </div>
                                    {Object.entries(data.boardStats.creative.byCategory).length > 0 ? (
                                        Object.entries(data.boardStats.creative.byCategory).map(([cat, count], i) => {
                                            const total = data.boardStats.creative.inPeriod || 1;
                                            const pct = Math.round((count / total) * 100);
                                            return (
                                                <div key={cat} style={{ marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                                        <span style={{ color: '#cbd5e1' }}>{cat.replace('_', ' ')}</span>
                                                        <span style={{ color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 700 }}>{count}</span>
                                                    </div>
                                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 3,
                                                            background: CHART_COLORS[i % CHART_COLORS.length],
                                                            width: `${pct}%`,
                                                            transition: 'width 0.5s',
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: 16 }}>
                                            {ar ? 'لا توجد بيانات' : 'No data'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Production Tab ── */}
                        {boardTab === 'production' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                {/* On-time Delivery */}
                                <div style={{ ...glassInner, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'التسليم في الوقت' : 'On-time Delivery'}
                                    </div>
                                    <div style={{
                                        width: 100, height: 100, borderRadius: '50%',
                                        background: `conic-gradient(#22c55e ${data.boardStats.production.onTimeDelivery * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 8px',
                                    }}>
                                        <div style={{
                                            width: 76, height: 76, borderRadius: '50%',
                                            background: '#1a1a2e', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>
                                                {data.boardStats.production.onTimeDelivery}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active vs Completed */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'نشط مقابل مكتمل' : 'Active vs Completed'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>
                                                {data.boardStats.production.inPeriod - data.boardStats.production.completedInPeriod}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>
                                                {ar ? 'نشط' : 'Active'}
                                            </div>
                                        </div>
                                        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>
                                                {data.boardStats.production.completedInPeriod}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>
                                                {ar ? 'مكتمل' : 'Done'}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Utilization bar */}
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)', display: 'flex', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', background: '#22c55e',
                                                width: data.boardStats.production.inPeriod > 0
                                                    ? `${(data.boardStats.production.completedInPeriod / data.boardStats.production.inPeriod) * 100}%`
                                                    : '0%',
                                                transition: 'width 0.5s',
                                            }} />
                                            <div style={{
                                                height: '100%', background: '#f59e0b',
                                                flex: 1,
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* By Job Type */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'حسب نوع العمل' : 'By Job Type'}
                                    </div>
                                    {Object.entries(data.boardStats.production.byJobType).length > 0 ? (
                                        Object.entries(data.boardStats.production.byJobType).map(([type, count], i) => {
                                            const total = data.boardStats.production.inPeriod || 1;
                                            const pct = Math.round((count / total) * 100);
                                            return (
                                                <div key={type} style={{ marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                                        <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{type}</span>
                                                        <span style={{ color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 700 }}>{count}</span>
                                                    </div>
                                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 3,
                                                            background: CHART_COLORS[i % CHART_COLORS.length],
                                                            width: `${pct}%`,
                                                            transition: 'width 0.5s',
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: 16 }}>
                                            {ar ? 'لا توجد بيانات' : 'No data'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Publishing Tab ── */}
                        {boardTab === 'publishing' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                {/* Posts per Platform */}
                                <div style={{ ...glassInner, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'المنشورات حسب المنصة' : 'Posts per Platform'}
                                    </div>
                                    {Object.entries(data.boardStats.publishing.byPlatform).length > 0 ? (
                                        Object.entries(data.boardStats.publishing.byPlatform).map(([platform, count], i) => {
                                            const total = data.boardStats.publishing.inPeriod || 1;
                                            const pct = Math.round((count / total) * 100);
                                            return (
                                                <div key={platform} style={{ marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                                        <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{platform}</span>
                                                        <span style={{ color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 700 }}>{count}</span>
                                                    </div>
                                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 3,
                                                            background: CHART_COLORS[i % CHART_COLORS.length],
                                                            width: `${pct}%`,
                                                            transition: 'width 0.5s',
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: 16 }}>
                                            {ar ? 'لا توجد بيانات' : 'No data'}
                                        </div>
                                    )}
                                </div>

                                {/* Scheduling Accuracy */}
                                <div style={{ ...glassInner, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'دقة الجدولة' : 'Scheduling Accuracy'}
                                    </div>
                                    <div style={{
                                        width: 100, height: 100, borderRadius: '50%',
                                        background: `conic-gradient(#06b6d4 ${data.boardStats.publishing.schedulingAccuracy * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 8px',
                                    }}>
                                        <div style={{
                                            width: 76, height: 76, borderRadius: '50%',
                                            background: '#1a1a2e', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4' }}>
                                                {data.boardStats.publishing.schedulingAccuracy}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        {ar ? 'دقة النشر في الموعد' : 'On-schedule publish rate'}
                                    </div>
                                </div>

                                {/* Published Count */}
                                <div style={{ ...glassInner, padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                                        {ar ? 'المنشور هذه الفترة' : 'Published This Period'}
                                    </div>
                                    <div style={{ fontSize: 48, fontWeight: 800, color: '#f59e0b' }}>
                                        {data.boardStats.publishing.publishedInPeriod}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        {ar ? `من أصل ${data.boardStats.publishing.inPeriod}` : `out of ${data.boardStats.publishing.inPeriod}`}
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            background: '#f59e0b',
                                            width: data.boardStats.publishing.inPeriod > 0
                                                ? `${(data.boardStats.publishing.publishedInPeriod / data.boardStats.publishing.inPeriod) * 100}%`
                                                : '0%',
                                            transition: 'width 0.5s',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ Team Analytics Table ═══ */}
                    <div style={{ ...glass, padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>
                            {ar ? 'تحليلات الفريق' : 'Team Analytics'}
                        </h2>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            padding: '12px', textAlign: ar ? 'right' : 'left',
                                            color: '#94a3b8', fontWeight: 600,
                                            borderBottom: '2px solid rgba(255,255,255,0.08)',
                                        }}>
                                            {ar ? 'العضو' : 'Member'}
                                        </th>
                                        {[
                                            { key: 'tasksCompleted' as const, label: ar ? 'المهام المكتملة' : 'Tasks Done' },
                                            { key: 'hoursLogged' as const, label: ar ? 'الساعات المسجلة' : 'Hours Logged' },
                                            { key: 'utilization' as const, label: ar ? 'الاستغلال %' : 'Utilization %' },
                                            { key: 'onTimeRate' as const, label: ar ? 'في الوقت %' : 'On-time %' },
                                        ].map(col => (
                                            <th
                                                key={col.key}
                                                onClick={() => handleTeamSort(col.key)}
                                                style={{
                                                    padding: '12px', textAlign: 'center',
                                                    color: teamSort === col.key ? accent : '#94a3b8',
                                                    fontWeight: 600, cursor: 'pointer',
                                                    borderBottom: '2px solid rgba(255,255,255,0.08)',
                                                    userSelect: 'none',
                                                }}
                                            >
                                                {col.label}
                                                {teamSort === col.key && (
                                                    <span style={{ marginInlineStart: 4 }}>
                                                        {teamSortDir === 'desc' ? '\u2193' : '\u2191'}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTeam.length > 0 ? (
                                        sortedTeam.map((m, i) => (
                                            <tr key={m.userId} style={{
                                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                            }}>
                                                <td style={{
                                                    padding: '12px', fontWeight: 500,
                                                    color: '#e2e8f0',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                    {ar ? m.nameAr || m.name : m.name}
                                                </td>
                                                <td style={{
                                                    padding: '12px', textAlign: 'center', fontWeight: 700,
                                                    color: accent,
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                    {m.tasksCompleted}
                                                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: 11 }}>
                                                        /{m.tasksTotal}
                                                    </span>
                                                </td>
                                                <td style={{
                                                    padding: '12px', textAlign: 'center', fontWeight: 700,
                                                    color: '#f59e0b',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                    {m.hoursLogged}h
                                                </td>
                                                <td style={{
                                                    padding: '12px', textAlign: 'center',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                                        <div style={{
                                                            width: 60, height: 6, borderRadius: 3,
                                                            background: 'rgba(255,255,255,0.05)',
                                                            overflow: 'hidden',
                                                        }}>
                                                            <div style={{
                                                                height: '100%', borderRadius: 3,
                                                                background: m.utilization >= 80 ? '#22c55e' : m.utilization >= 50 ? '#f59e0b' : '#ef4444',
                                                                width: `${m.utilization}%`,
                                                                transition: 'width 0.5s',
                                                            }} />
                                                        </div>
                                                        <span style={{
                                                            fontWeight: 700, fontSize: 12,
                                                            color: m.utilization >= 80 ? '#22c55e' : m.utilization >= 50 ? '#f59e0b' : '#ef4444',
                                                        }}>
                                                            {m.utilization}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{
                                                    padding: '12px', textAlign: 'center',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: 6,
                                                        fontSize: 12, fontWeight: 700,
                                                        background: m.onTimeRate >= 80 ? 'rgba(34,197,94,0.15)' : m.onTimeRate >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                        color: m.onTimeRate >= 80 ? '#22c55e' : m.onTimeRate >= 50 ? '#f59e0b' : '#ef4444',
                                                    }}>
                                                        {m.onTimeRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#475569' }}>
                                                {ar ? 'لا توجد بيانات فريق' : 'No team data available'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>
                    {ar ? 'فشل تحميل البيانات' : 'Failed to load data'}
                </div>
            )}
        </div>
    );
}
