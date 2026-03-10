'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { useCreativeRequests, useClients, useUsers } from '@/lib/hooks';
import type { CreativeRequestData } from '@/lib/hooks';
import { useSettings } from '@/lib/useSettings';

/* ─── Pipeline stage definitions ─── */

const PIPELINE_STAGES = [
    'new_request',
    'concept_writing',
    'concept_review',
    'in_execution',
    'final_review',
    'approved_ready',
] as const;

type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STAGE_META: Record<
    string,
    { en: string; ar: string; color: string; owner_en: string; owner_ar: string }
> = {
    new_request: { en: 'New Request', ar: 'طلب جديد', color: '#6366f1', owner_en: 'Account Manager', owner_ar: 'مدير الحسابات' },
    concept_writing: { en: 'Concept Writing', ar: 'كتابة المفهوم', color: '#8b5cf6', owner_en: 'Concept Writer', owner_ar: 'كاتب المفهوم' },
    concept_review: { en: 'Concept Review', ar: 'مراجعة المفهوم', color: '#ec4899', owner_en: 'Creative Director', owner_ar: 'المدير الإبداعي' },
    in_execution: { en: 'In Execution', ar: 'قيد التنفيذ', color: '#f59e0b', owner_en: 'Designer/Executor', owner_ar: 'المصمم/المنفذ' },
    final_review: { en: 'Final Review', ar: 'المراجعة النهائية', color: '#14b8a6', owner_en: 'Account Manager', owner_ar: 'مدير الحسابات' },
    approved_ready: { en: 'Approved & Ready', ar: 'معتمد وجاهز', color: '#22c55e', owner_en: 'Done', owner_ar: 'مكتمل' },
};

/* ─── Category constants ─── */

const CATEGORY_ICONS: Record<string, string> = {
    social_post: '📱',
    video: '🎬',
    motion: '🎞️',
    branding: '🏷️',
    print: '🖨️',
};

const CATEGORY_LABELS_AR: Record<string, string> = {
    social_post: 'منشور',
    video: 'فيديو',
    motion: 'موشن',
    branding: 'هوية',
    print: 'مطبوعات',
};

const CATEGORY_LABELS_EN: Record<string, string> = {
    social_post: 'Social Post',
    video: 'Video',
    motion: 'Motion',
    branding: 'Branding',
    print: 'Print',
};

/* ─── Priority badge CSS class key helper ─── */

function prioBadgeKey(priority: string): string {
    if (!priority) return '';
    return 'p' + priority[0].toUpperCase();
}

/* ─── Resolve display name for a user ID ─── */

function resolveUserName(
    req: CreativeRequestData,
    usersMap: Map<string, string>,
    lang: string,
): string {
    // Prefer executor relation
    if (req.executor?.profile) {
        return lang === 'ar' ? req.executor.profile.fullNameAr : req.executor.profile.fullName;
    }
    // Then concept writer relation
    if (req.conceptWriter?.profile) {
        return lang === 'ar' ? req.conceptWriter.profile.fullNameAr : req.conceptWriter.profile.fullName;
    }
    // Fallback to users map lookup
    const uid = req.executorId || req.conceptWriterId || req.assignedTo;
    if (uid && usersMap.has(uid)) return usersMap.get(uid)!;
    // Last resort: the raw assignedTo field
    return req.assignedTo || '';
}

/* ─── Format due date for display ─── */

function formatDue(isoDate: string | null): string {
    if (!isoDate) return '—';
    try {
        const d = new Date(isoDate);
        return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    } catch {
        return isoDate;
    }
}

/* ═══════════════════════════════════════════════
   Creative HQ — API-driven board page
   ═══════════════════════════════════════════════ */

export default function CreativeHQ() {
    const { requests, loading: reqLoading, error: reqError } = useCreativeRequests();
    const { clients, loading: cliLoading, error: cliError } = useClients();
    const { users, loading: usrLoading, error: usrError } = useUsers();
    const { theme, lang, toggleTheme, toggleLang } = useSettings();

    const [fClient, setFClient] = useState('all');
    const [fType, setFType] = useState('all');
    const [fPrio, setFPrio] = useState('all');

    const isLoading = reqLoading || cliLoading || usrLoading;
    const combinedError = reqError || cliError || usrError;

    /* ─── Derived lookups (memoized) ─── */

    const usersMap = useMemo(() => {
        const m = new Map<string, string>();
        for (const u of users) {
            m.set(u.id, lang === 'ar' ? (u.nameAr || u.displayName || u.name) : (u.displayName || u.name));
        }
        return m;
    }, [users, lang]);

    const clientsMap = useMemo(() => {
        const m = new Map<string, { name: string; nameAr: string; avatar: string; sector: string; sectorAr: string; planType: string }>();
        for (const c of clients) {
            m.set(c.id, { name: c.name, nameAr: c.nameAr, avatar: c.avatar, sector: c.sector, sectorAr: c.sectorAr, planType: c.planType });
        }
        return m;
    }, [clients]);

    /* ─── Labels ─── */

    const catL = lang === 'ar' ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;
    const pL: Record<string, string> = {
        urgent: lang === 'ar' ? 'عاجل' : 'Urgent',
        high: lang === 'ar' ? 'مرتفع' : 'High',
        medium: lang === 'ar' ? 'متوسط' : 'Medium',
        low: lang === 'ar' ? 'منخفض' : 'Low',
    };

    /* ─── Filtering ─── */

    const filtered = useMemo(() => {
        return requests.filter((r) => {
            if (fClient !== 'all' && r.clientId !== fClient) return false;
            if (fType !== 'all' && r.category !== fType) return false;
            if (fPrio !== 'all' && r.priority !== fPrio) return false;
            return true;
        });
    }, [requests, fClient, fType, fPrio]);

    const active = useMemo(() => filtered.filter((r) => r.status !== 'approved_ready'), [filtered]);

    /* ─── KPIs ─── */

    const kA = active.length;
    const kR = useMemo(
        () => active.filter((r) => r.status === 'concept_review' || r.status === 'final_review').length,
        [active],
    );
    const kB = useMemo(() => active.filter((r) => r.blocked).length, [active]);
    const kH = useMemo(() => filtered.filter((r) => r.status === 'approved_ready').length, [filtered]);
    const kOv = useMemo(
        () => active.filter((r) => r.dueDate && new Date(r.dueDate) < new Date()).length,
        [active],
    );
    const kVid = useMemo(() => active.filter((r) => r.category === 'video').length, [active]);

    /* ─── Workload: count active items per user ─── */

    const workload = useMemo(() => {
        return users.map((u) => {
            const count = active.filter(
                (r) => r.executorId === u.id || r.conceptWriterId === u.id || r.assignedTo === u.id,
            ).length;
            return { id: u.id, name: lang === 'ar' ? (u.nameAr || u.name) : (u.displayName || u.name), role: lang === 'ar' ? (u.roleAr || u.role) : u.role, avatar: u.avatar, count };
        });
    }, [users, active, lang]);

    /* ─── Client request counts ─── */

    const clientStats = useMemo(() => {
        const m = new Map<string, { active: number; ready: number; video: number }>();
        for (const c of clients) {
            m.set(c.id, { active: 0, ready: 0, video: 0 });
        }
        for (const r of requests) {
            const st = m.get(r.clientId);
            if (!st) continue;
            if (r.status === 'approved_ready') st.ready++;
            else st.active++;
            if (r.category === 'video') st.video++;
        }
        return m;
    }, [clients, requests]);

    /* ─── Pipeline stage groups ─── */

    const stageItems = useMemo(() => {
        const m = new Map<string, CreativeRequestData[]>();
        for (const stage of PIPELINE_STAGES) m.set(stage, []);
        for (const r of filtered) {
            const arr = m.get(r.status);
            if (arr) arr.push(r);
        }
        return m;
    }, [filtered]);

    /* ─── Render ─── */

    return (
        <div className={s.board} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* ─── LOADING STATE ─── */}
            {isLoading && (
                <div className={s.toast} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
            )}

            {/* ─── ERROR STATE ─── */}
            {combinedError && !isLoading && (
                <div className={s.toast} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    {lang === 'ar' ? 'خطأ: ' : 'Error: '}{combinedError}
                </div>
            )}

            {/* ═══ HEADER ═══ */}
            <header className={s.header}>
                <div className={s.headerR}>
                    <div className={s.logo}>
                        <div className={s.logoIcon}>R</div>
                        <span className={s.logoText}>Remark</span>
                    </div>
                    <div className={s.boardTitle}>
                        <div className={s.dot} />
                        <h1 className={s.boardName}>{lang === 'ar' ? 'المقر الإبداعي' : 'Creative HQ'}</h1>
                    </div>
                </div>
                <div className={s.headerL}>
                    <div className={s.switcher}>
                        <Link href="/" className={s.swBtn}>{lang === 'ar' ? '📋 التسويق' : '📋 Marketing'}</Link>
                        <span className={`${s.swBtn} ${s.swActive}`}>{lang === 'ar' ? '🎨 الإبداعي' : '🎨 Creative'}</span>
                        <Link href="/production" className={s.swBtn}>{lang === 'ar' ? '🎬 الإنتاج' : '🎬 Production'}</Link>
                        <Link href="/publishing" className={s.swBtn}>{lang === 'ar' ? '📢 النشر' : '📢 Publishing'}</Link>
                    </div>
                    <button className={s.iconBtn} onClick={toggleTheme}>🌙</button>
                    <button className={s.iconBtn} onClick={toggleLang}>🌐</button>
                </div>
            </header>

            <main className={s.content}>

                {/* ═══ FILTERS ═══ */}
                <div className={s.filterBar}>
                    <select className={s.filterSel} value={fClient} onChange={(e) => setFClient(e.target.value)}>
                        <option value="all">{lang === 'ar' ? 'جميع العملاء' : 'All Clients'}</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>{c.avatar} {lang === 'ar' ? c.nameAr : c.name}</option>
                        ))}
                    </select>
                    <select className={s.filterSel} value={fType} onChange={(e) => setFType(e.target.value)}>
                        <option value="all">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                        {Object.entries(catL).map(([k, v]) => (
                            <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>
                        ))}
                    </select>
                    <select className={s.filterSel} value={fPrio} onChange={(e) => setFPrio(e.target.value)}>
                        <option value="all">{lang === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</option>
                        <option value="urgent">🔴 {pL.urgent}</option>
                        <option value="high">🟠 {pL.high}</option>
                        <option value="medium">🔵 {pL.medium}</option>
                        <option value="low">⚪ {pL.low}</option>
                    </select>
                </div>

                {/* ═══ KPIs ═══ */}
                <div className={s.kpiRow}>
                    {([
                        [lang === 'ar' ? 'نشطة' : 'Active', kA, '#3b82f6'],
                        [lang === 'ar' ? 'بانتظار القرار' : 'Decisions', kR, '#ec4899'],
                        [lang === 'ar' ? 'فيديو' : 'Video', kVid, '#f59e0b'],
                        [lang === 'ar' ? 'محظورة' : 'Blocked', kB, kB > 0 ? '#ef4444' : '#6b7280'],
                        [lang === 'ar' ? 'جاهزة' : 'Ready', kH, '#22c55e'],
                        [lang === 'ar' ? 'متأخرة' : 'Overdue', kOv, kOv > 0 ? '#ef4444' : '#6b7280'],
                    ] as [string, number, string][]).map(([label, value, color], i) => (
                        <div key={i} className={s.kpiCard} style={{ borderRight: `4px solid ${color}` }}>
                            <div className={s.kpiLabel}>{label}</div>
                            <div className={s.kpiValue} style={{ color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* ═══ CLIENT CARDS ═══ */}
                <div className={s.secHeader}>
                    <div className={s.secLine} />
                    <div className={s.secTitle}>👥 {lang === 'ar' ? 'العملاء' : 'Clients'}</div>
                    <div className={s.secCount}>{clients.length}</div>
                    <div className={s.secLine} />
                </div>
                <div className={s.clientGrid}>
                    {clients.map((cl) => {
                        const stats = clientStats.get(cl.id) || { active: 0, ready: 0, video: 0 };
                        return (
                            <div key={cl.id} className={s.clientCard}>
                                <div className={s.clientCardHead}>
                                    <div className={s.clientAv}>{cl.avatar}</div>
                                    <div className={s.clientInfo}>
                                        <div className={s.clientName}>{lang === 'ar' ? cl.nameAr : cl.name}</div>
                                        <div className={s.clientSec}>
                                            {lang === 'ar' ? cl.sectorAr : cl.sector} {cl.planType ? `• ${cl.planType}` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className={s.clientMetrics}>
                                    <div className={s.metricItem}>
                                        <span className={s.metricVal}>{stats.active}</span>
                                        <span className={s.metricLbl}>{lang === 'ar' ? 'نشطة' : 'Active'}</span>
                                    </div>
                                    <div className={s.metricItem}>
                                        <span className={s.metricVal}>{stats.ready}</span>
                                        <span className={s.metricLbl}>{lang === 'ar' ? 'جاهزة' : 'Ready'}</span>
                                    </div>
                                    <div className={s.metricItem}>
                                        <span className={s.metricVal}>{stats.video}</span>
                                        <span className={s.metricLbl}>{lang === 'ar' ? 'فيديو' : 'Video'}</span>
                                    </div>
                                </div>
                                <Link href={`/creative/client/${cl.id}`} className={s.clientLink}>
                                    {lang === 'ar' ? 'فتح المساحة \u2190' : 'Open Workspace \u2192'}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* ═══ 6-COLUMN PIPELINE ═══ */}
                <div className={s.secHeader}>
                    <div className={s.secLine} />
                    <div className={s.secTitle}>🔄 {lang === 'ar' ? 'خط الإنتاج' : 'Pipeline'}</div>
                    <div className={s.secCount}>{filtered.length}</div>
                    <div className={s.secLine} />
                </div>
                <div className={s.pipeScroll}>
                    <div className={s.pipeline}>
                        {PIPELINE_STAGES.map((stage) => {
                            const sm = STAGE_META[stage];
                            const items = stageItems.get(stage) || [];
                            return (
                                <div key={stage} className={s.pipeCol}>
                                    <div className={s.pipeColHead}>
                                        <div className={s.pipeColDot} style={{ background: sm.color }} />
                                        <div className={s.pipeColName}>{lang === 'ar' ? sm.ar : sm.en}</div>
                                        <div className={s.pipeColCount}>{items.length}</div>
                                    </div>
                                    <div className={s.pipeColOwner}>
                                        👤 {lang === 'ar' ? sm.owner_ar : sm.owner_en}
                                    </div>
                                    <div className={s.pipeCards}>
                                        {items.map((req) => {
                                            const cl = req.client || (clientsMap.has(req.clientId) ? clientsMap.get(req.clientId) : null);
                                            const clientDisplay = cl
                                                ? `${cl.avatar} ${lang === 'ar' ? (cl as any).nameAr || cl.name : cl.name}`
                                                : '';
                                            const assigneeName = resolveUserName(req, usersMap, lang);
                                            const isOverdue = req.dueDate && new Date(req.dueDate) < new Date() && req.status !== 'approved_ready';

                                            return (
                                                <div key={req.id} className={s.pipeCard}>
                                                    <div className={s.pipeCardTitle}>
                                                        {CATEGORY_ICONS[req.category] || ''} {lang === 'ar' ? (req.titleAr || req.title) : req.title}
                                                    </div>
                                                    {clientDisplay && (
                                                        <div className={s.cardClient} style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                                                            {clientDisplay}
                                                        </div>
                                                    )}
                                                    <div className={s.cardBadges}>
                                                        {req.priority && (
                                                            <span className={`${s.badge} ${s[prioBadgeKey(req.priority)]}`}>
                                                                {pL[req.priority] || req.priority}
                                                            </span>
                                                        )}
                                                        {req.category === 'video' && (
                                                            <span
                                                                className={s.badge}
                                                                style={{
                                                                    color: '#f59e0b',
                                                                    borderColor: 'rgba(245,158,11,.2)',
                                                                    background: 'rgba(245,158,11,.06)',
                                                                }}
                                                            >
                                                                🎬
                                                            </span>
                                                        )}
                                                        {req.platform && (
                                                            <span
                                                                className={s.badge}
                                                                style={{
                                                                    color: '#6366f1',
                                                                    borderColor: 'rgba(99,102,241,.2)',
                                                                    background: 'rgba(99,102,241,.06)',
                                                                }}
                                                            >
                                                                {req.platform}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {assigneeName && (
                                                        <div className={s.cardAssignee}>🎯 {assigneeName}</div>
                                                    )}
                                                    <div className={s.cardDue} style={isOverdue ? { color: '#ef4444' } : undefined}>
                                                        📅 {formatDue(req.dueDate)}
                                                    </div>
                                                    {req.reviewRound > 1 && (
                                                        <div className={s.cardNext}>
                                                            🔄 {lang === 'ar' ? `جولة ${req.reviewRound}` : `Round ${req.reviewRound}`}
                                                        </div>
                                                    )}
                                                    {req.conceptApproved && (
                                                        <div className={s.okBadge}>
                                                            ✅ {lang === 'ar' ? 'المفهوم معتمد' : 'Concept OK'}
                                                        </div>
                                                    )}
                                                    {req.finalApproved && (
                                                        <div className={s.okBadge}>
                                                            ✅ {lang === 'ar' ? 'نهائي معتمد' : 'Final OK'}
                                                        </div>
                                                    )}
                                                    {req.blocked && (
                                                        <div className={s.blockedBadge}>
                                                            ⛔ {req.blockReason ? req.blockReason.slice(0, 25) : (lang === 'ar' ? 'محظور' : 'Blocked')}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ═══ TEAM WORKLOAD ═══ */}
                <div className={s.secHeader}>
                    <div className={s.secLine} />
                    <div className={s.secTitle}>👥 {lang === 'ar' ? 'حمل العمل' : 'Workload'}</div>
                    <div className={s.secLine} />
                </div>
                <div className={s.kpiRow}>
                    {workload.map((m) => (
                        <div key={m.id} className={s.kpiCard} style={{ borderRight: '4px solid #6366f1' }}>
                            <div className={s.kpiLabel}>{m.avatar} {m.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                            <div className={s.kpiValue} style={{ color: m.count > 3 ? '#ef4444' : '#6366f1' }}>
                                {m.count}
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
