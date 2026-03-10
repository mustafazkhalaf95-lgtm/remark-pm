'use client';
/* ══════════════════════════════════════════════════════════════════
   Remark Publishing HQ — API-driven board
   Hooks: usePublishingItems, useClients, useCampaigns, useUsers
   No localStorage stores.
   ══════════════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { usePublishingItems, type PublishingItemData } from '@/lib/hooks';
import { useClients, type ClientData } from '@/lib/hooks';
import { useCampaigns, type CampaignData } from '@/lib/hooks';
import { useUsers, type UserData } from '@/lib/hooks';
import { useSettings } from '@/lib/useSettings';

/* ── Constants ── */

const PIPELINE_STAGES = ['draft', 'in_review', 'scheduled', 'published', 'archived'] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STAGE_META: Record<string, { en: string; ar: string; color: string }> = {
    draft:     { en: 'Draft',      ar: 'مسودة',          color: '#6b7280' },
    in_review: { en: 'In Review',  ar: 'قيد المراجعة',   color: '#8b5cf6' },
    scheduled: { en: 'Scheduled',  ar: 'مجدولة',         color: '#f59e0b' },
    published: { en: 'Published',  ar: 'منشورة',         color: '#22c55e' },
    archived:  { en: 'Archived',   ar: 'مؤرشفة',         color: '#6366f1' },
};

const PLATFORM_ICONS: Record<string, string> = {
    instagram: '📸', facebook: '👤', twitter: '🐦',
    linkedin: '💼', tiktok: '🎵', youtube: '📺',
};

const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'] as const;

/* ── Helpers ── */

function platformColor(p: string): string {
    const low = p.toLowerCase();
    if (low.includes('instagram')) return '#e1306c';
    if (low.includes('tiktok'))    return '#000';
    if (low.includes('facebook'))  return '#1877f2';
    if (low.includes('twitter') || low === 'x') return '#000';
    if (low.includes('linkedin')) return '#0a66c2';
    if (low.includes('youtube'))  return '#ff0000';
    return '#6366f1';
}

function platformIcon(p: string): string {
    return PLATFORM_ICONS[p.toLowerCase()] || '📢';
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toISOString(dateStr: string, timeStr: string): string | null {
    if (!dateStr) return null;
    const t = timeStr || '00:00';
    return new Date(`${dateStr}T${t}:00`).toISOString();
}

const EMPTY_NEW_POST = {
    title: '',
    titleAr: '',
    clientId: '',
    campaignId: '',
    platform: 'instagram' as string,
    content: '',
    scheduledDate: '',
    scheduledTime: '',
    reviewerId: '',
    status: 'draft' as string,
};

/* ══════════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════════ */

export default function PublishingHQ() {
    /* ── Data hooks ── */
    const { items, loading: loadingItems, error: errorItems, createItem, updateItem } = usePublishingItems();
    const { clients, loading: loadingClients, error: errorClients } = useClients();
    const { campaigns, loading: loadingCampaigns } = useCampaigns();
    const { users, loading: loadingUsers } = useUsers();

    /* ── Settings ── */
    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const ar = lang === 'ar';

    /* ── UI State ── */
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<PublishingItemData | null>(null);
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPost, setNewPost] = useState(EMPTY_NEW_POST);
    const [filterPlatform, setFilterPlatform] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);

    /* ── Toast helper ── */
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

    /* ── Derived data ── */
    const isLoading = loadingItems || loadingClients;
    const loadError = errorItems || errorClients;

    // Client lookup maps
    const clientMap = useMemo(() => {
        const m = new Map<string, ClientData>();
        clients.forEach(c => m.set(c.id, c));
        return m;
    }, [clients]);

    const campaignMap = useMemo(() => {
        const m = new Map<string, CampaignData>();
        campaigns.forEach(c => m.set(c.id, c));
        return m;
    }, [campaigns]);

    const userMap = useMemo(() => {
        const m = new Map<string, UserData>();
        users.forEach(u => m.set(u.id, u));
        return m;
    }, [users]);

    // Apply filters
    const filteredItems = useMemo(() => {
        let result = items;
        if (selectedClient) result = result.filter(i => i.clientId === selectedClient);
        if (filterPlatform !== 'all') result = result.filter(i => i.platform.toLowerCase() === filterPlatform);
        if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
        return result;
    }, [items, selectedClient, filterPlatform, filterStatus]);

    // Today's date string
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // KPIs (across all or filtered items)
    const kpis = useMemo(() => {
        const src = selectedClient ? filteredItems : items;
        return {
            total:     src.length,
            scheduled: src.filter(i => i.status === 'scheduled').length,
            published: src.filter(i => i.status === 'published').length,
            inReview:  src.filter(i => i.status === 'in_review').length,
            draft:     src.filter(i => i.status === 'draft').length,
        };
    }, [items, filteredItems, selectedClient]);

    // Today's scheduled (overview only — across all clients, not published/archived)
    const todayPosts = useMemo(() => {
        return items.filter(i => {
            if (!i.scheduledAt) return false;
            const d = formatDate(i.scheduledAt);
            return d === todayStr && i.status !== 'published' && i.status !== 'archived';
        });
    }, [items, todayStr]);

    // Unique client IDs that have publishing items
    const clientIdsWithItems = useMemo(() => {
        return [...new Set(items.map(i => i.clientId))];
    }, [items]);

    // Calendar data for current month
    const cY = now.getFullYear();
    const cM = now.getMonth();
    const dim = new Date(cY, cM + 1, 0).getDate();
    const fdw = new Date(cY, cM, 1).getDay();
    const dn = ar
        ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calendarItems = useMemo(() => {
        const src = selectedClient ? filteredItems : items;
        return src.filter(i => i.scheduledAt);
    }, [items, filteredItems, selectedClient]);

    const evDay = (day: number) => {
        const ds = `${cY}-${String(cM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarItems.filter(i => formatDate(i.scheduledAt) === ds);
    };

    // Workload: items per reviewer (not published/archived)
    const workload = useMemo(() => {
        const src = selectedClient ? filteredItems : items;
        const counts = new Map<string, number>();
        src.forEach(i => {
            if (i.status === 'published' || i.status === 'archived') return;
            if (i.reviewerId) counts.set(i.reviewerId, (counts.get(i.reviewerId) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([uid, count]) => {
            const u = userMap.get(uid);
            return { id: uid, name: u?.nameAr || '', nameEn: u?.name || uid, avatar: u?.avatar || '👤', role: u?.roleAr || '', roleEn: u?.role || '', count };
        }).filter(w => w.count > 0);
    }, [items, filteredItems, selectedClient, userMap]);

    const maxLoad = Math.max(...workload.map(w => w.count), 1);

    /* ── Client helpers ── */
    const cn = (id: string) => clientMap.get(id)?.nameAr || clientMap.get(id)?.name || id;
    const cnEn = (id: string) => clientMap.get(id)?.name || id;
    const clientAvatar = (id: string) => clientMap.get(id)?.avatar || '📦';
    const clientSector = (id: string) => {
        const c = clientMap.get(id);
        return ar ? (c?.sectorAr || c?.sector || '') : (c?.sector || '');
    };

    const selClientObj = selectedClient ? clientMap.get(selectedClient) : null;

    /* ── Handlers ── */
    const handleCreatePost = async () => {
        if (!newPost.title.trim()) return;
        setSubmitting(true);
        const body: Partial<PublishingItemData> = {
            title: newPost.title,
            titleAr: newPost.titleAr,
            clientId: newPost.clientId || clients[0]?.id || '',
            campaignId: newPost.campaignId || null,
            platform: newPost.platform,
            content: newPost.content,
            status: 'draft',
            scheduledAt: toISOString(newPost.scheduledDate, newPost.scheduledTime),
            reviewerId: newPost.reviewerId || null,
        };
        const res = await createItem(body);
        setSubmitting(false);
        if (res.error) {
            showToast(ar ? `خطأ: ${res.error}` : `Error: ${res.error}`);
        } else {
            showToast(ar ? 'تم إنشاء المنشور بنجاح' : 'Post created successfully');
            setShowNewPost(false);
            setNewPost({ ...EMPTY_NEW_POST, clientId: selectedClient || '' });
        }
    };

    const handleStageChange = async (item: PublishingItemData, newStatus: PipelineStage) => {
        const patch: Partial<PublishingItemData> = { status: newStatus };
        if (newStatus === 'published') patch.publishedAt = new Date().toISOString();
        const res = await updateItem(item.id, patch);
        if (res.error) {
            showToast(ar ? `خطأ: ${res.error}` : `Error: ${res.error}`);
        } else {
            showToast(ar ? `تم نقل "${item.title}" إلى ${STAGE_META[newStatus].ar}` : `Moved "${item.title}" to ${STAGE_META[newStatus].en}`);
            if (selectedItem?.id === item.id) {
                setSelectedItem({ ...item, status: newStatus });
            }
        }
    };

    /* ── Loading state ── */
    if (isLoading) {
        return (
            <div className={s.board} dir="rtl">
                <header className={s.header}>
                    <div className={s.headerRight}>
                        <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                        <div className={s.boardTitle}><div className={s.boardDot} /><h1 className={s.boardName}>{ar ? 'النشر' : 'Publishing'}</h1></div>
                    </div>
                </header>
                <main className={s.content}>
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>📢</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{ar ? 'جاري تحميل البيانات...' : 'Loading data...'}</div>
                    </div>
                </main>
            </div>
        );
    }

    /* ── Error state ── */
    if (loadError) {
        return (
            <div className={s.board} dir="rtl">
                <header className={s.header}>
                    <div className={s.headerRight}>
                        <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                        <div className={s.boardTitle}><div className={s.boardDot} /><h1 className={s.boardName}>{ar ? 'النشر' : 'Publishing'}</h1></div>
                    </div>
                </header>
                <main className={s.content}>
                    <div className={s.alertCard}>
                        <span className={s.alertIcon}>⚠️</span>
                        <span style={{ flex: 1 }}>{ar ? 'حدث خطأ أثناء تحميل البيانات' : 'An error occurred while loading data'}: {loadError}</span>
                    </div>
                </main>
            </div>
        );
    }

    /* ── Main render ── */
    return (
        <div className={s.board} dir="rtl">
            {/* ── Header ── */}
            <header className={s.header}>
                <div className={s.headerRight}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.boardTitle}><div className={s.boardDot} /><h1 className={s.boardName}>{ar ? 'النشر' : 'Publishing'}</h1></div>
                </div>
                <div className={s.headerLeft}>
                    <button className={s.iconBtn} onClick={toggleTheme}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    </button>
                    <button className={s.iconBtn} onClick={toggleLang}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    </button>
                    <div className={s.userAvatar}>م.خ</div>
                    <div className={s.headerDivider} />
                    <div className={s.navSwitcher}>
                        <Link href="/" className={s.navInactive}>📋 {ar ? 'التسويق' : 'Marketing'}</Link>
                        <Link href="/creative" className={s.navInactive}>🎨 {ar ? 'الإبداعي' : 'Creative'}</Link>
                        <Link href="/production" className={s.navInactive}>🎬 {ar ? 'الإنتاج' : 'Production'}</Link>
                        <span className={s.navActive}>📢 {ar ? 'النشر' : 'Publishing'}</span>
                    </div>
                </div>
            </header>

            <main className={s.content}>
                {/* ═══ OVERVIEW MODE (no client selected) ═══ */}
                {!selectedClient && (
                    <>
                        {/* ── KPIs ── */}
                        <div className={s.kpiGrid}>
                            {[
                                { v: kpis.total,     l: ar ? 'إجمالي المنشورات' : 'Total Items' },
                                { v: kpis.scheduled, l: ar ? 'مجدولة'           : 'Scheduled' },
                                { v: kpis.published, l: ar ? 'منشورة'           : 'Published' },
                                { v: kpis.inReview,  l: ar ? 'قيد المراجعة'      : 'In Review' },
                                { v: kpis.draft,     l: ar ? 'مسودة'            : 'Draft' },
                            ].map((k, i) => (
                                <div key={i} className={s.kpiCard}>
                                    <div className={s.kpiValue}>{k.v}</div>
                                    <div className={s.kpiLabel}>{k.l}</div>
                                </div>
                            ))}
                        </div>

                        {/* ── Filter dropdowns ── */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 160 }}
                                value={filterPlatform}
                                onChange={e => setFilterPlatform(e.target.value)}
                            >
                                <option value="all">{ar ? 'كل المنصات' : 'All Platforms'}</option>
                                {PLATFORMS.map(p => (
                                    <option key={p} value={p}>{platformIcon(p)} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                            </select>
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 160 }}
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="all">{ar ? 'كل الحالات' : 'All Statuses'}</option>
                                {PIPELINE_STAGES.map(st => (
                                    <option key={st} value={st}>{ar ? STAGE_META[st].ar : STAGE_META[st].en}</option>
                                ))}
                            </select>
                        </div>

                        {/* ── Today's Scheduled ── */}
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>📅 {ar ? `المطلوب نشرها اليوم — ${todayStr}` : `To Publish Today — ${todayStr}`}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{todayPosts.length} {ar ? 'منشور' : 'posts'}</span>
                        </div>
                        {todayPosts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                                {ar ? 'لا توجد منشورات مطلوبة اليوم' : 'No posts scheduled for today'}
                            </div>
                        ) : (
                            <div className={s.todayGrid}>
                                {todayPosts.map(item => (
                                    <div key={item.id} className={s.todayCard} onClick={() => setSelectedItem(item)}>
                                        <div className={s.todayCardHeader}>
                                            <span style={{ fontSize: 22 }}>{clientAvatar(item.clientId)}</span>
                                            <div style={{ flex: 1 }}>
                                                <div className={s.todayCardTitle}>{platformIcon(item.platform)} {ar ? (item.titleAr || item.title) : item.title}</div>
                                                <div className={s.todayCardMeta}>
                                                    {ar ? cn(item.clientId) : cnEn(item.clientId)} {' '} {item.platform} {' '} {formatTime(item.scheduledAt) || '--:--'}
                                                </div>
                                            </div>
                                            <span className={s.campBadge} style={{ borderColor: STAGE_META[item.status]?.color, color: STAGE_META[item.status]?.color }}>
                                                {ar ? STAGE_META[item.status]?.ar : STAGE_META[item.status]?.en}
                                            </span>
                                        </div>
                                        {item.content && (
                                            <div className={s.todayCardCaption}>
                                                {item.content.slice(0, 80)}{item.content.length > 80 ? '...' : ''}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Client Cards ── */}
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>👥 {ar ? 'العملاء' : 'Clients'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{clientIdsWithItems.length} {ar ? 'عميل' : 'clients'}</span>
                            <button className={s.btnPrimary} onClick={() => { setNewPost({ ...EMPTY_NEW_POST, clientId: clients[0]?.id || '' }); setShowNewPost(true); }}>
                                + {ar ? 'منشور جديد' : 'New Post'}
                            </button>
                        </div>
                        <div className={s.clientGrid}>
                            {clientIdsWithItems.map(cid => {
                                const cItems = items.filter(i => i.clientId === cid);
                                const activeItems = cItems.filter(i => i.status !== 'published' && i.status !== 'archived');
                                const publishedItems = cItems.filter(i => i.status === 'published');
                                const todayClient = cItems.filter(i => {
                                    if (!i.scheduledAt) return false;
                                    return formatDate(i.scheduledAt) === todayStr && i.status !== 'published' && i.status !== 'archived';
                                });
                                return (
                                    <div key={cid} className={s.clientCard} onClick={() => setSelectedClient(cid)}>
                                        <div className={s.clientCardHead}>
                                            <span className={s.clientCardAvatar}>{clientAvatar(cid)}</span>
                                            <div style={{ flex: 1 }}>
                                                <div className={s.clientCardName}>{ar ? cn(cid) : cnEn(cid)}</div>
                                                <div className={s.clientCardSector}>{clientSector(cid)}</div>
                                            </div>
                                            <span style={{ fontSize: 20 }}>{ar ? '←' : '→'}</span>
                                        </div>
                                        <div className={s.clientCardStats}>
                                            <div className={s.clientStat}>
                                                <div className={s.clientStatVal}>{cItems.length}</div>
                                                <div className={s.clientStatLbl}>{ar ? 'إجمالي' : 'Total'}</div>
                                            </div>
                                            <div className={s.clientStat}>
                                                <div className={s.clientStatVal} style={{ color: '#6366f1' }}>{activeItems.length}</div>
                                                <div className={s.clientStatLbl}>{ar ? 'نشطة' : 'Active'}</div>
                                            </div>
                                            <div className={s.clientStat}>
                                                <div className={s.clientStatVal} style={{ color: '#22c55e' }}>{publishedItems.length}</div>
                                                <div className={s.clientStatLbl}>{ar ? 'منشورة' : 'Published'}</div>
                                            </div>
                                        </div>
                                        {todayClient.length > 0 && (
                                            <div className={s.clientTodayBadge}>📅 {todayClient.length} {ar ? 'منشور اليوم' : 'today'}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Calendar ── */}
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>📅 {ar ? 'تقويم النشر' : 'Publishing Calendar'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{now.toLocaleDateString(ar ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className={s.calGrid}>
                            {dn.map(d => <div key={d} className={s.calHeader}>{d}</div>)}
                            {Array.from({ length: fdw }).map((_, i) => <div key={`e${i}`} className={s.calEmpty} />)}
                            {Array.from({ length: dim }).map((_, i) => {
                                const day = i + 1;
                                const evts = evDay(day);
                                return (
                                    <div key={day} className={s.calDay}>
                                        <div className={s.calDayNum}>{day}</div>
                                        {evts.map(ev => (
                                            <div
                                                key={ev.id}
                                                className={s.calEvent}
                                                style={{ background: platformColor(ev.platform) }}
                                                title={`${ev.title} — ${ev.platform}`}
                                                onClick={() => setSelectedItem(ev)}
                                            >
                                                {platformIcon(ev.platform)} {ar ? (ev.titleAr || ev.title) : ev.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Workload ── */}
                        {workload.length > 0 && (
                            <>
                                <div className={s.sectionHeader}>
                                    <span className={s.sectionTitle}>👥 {ar ? 'حمل الفريق' : 'Team Workload'}</span>
                                    <div className={s.sectionLine} />
                                </div>
                                <div className={s.teamGrid}>
                                    {workload.map(m => (
                                        <div key={m.id} className={s.teamCard}>
                                            <div className={s.teamAvatar}>{m.avatar}</div>
                                            <div style={{ flex: 1 }}>
                                                <div className={s.teamName}>{ar ? m.name : m.nameEn}</div>
                                                <div className={s.teamRole}>{ar ? m.role : m.roleEn}</div>
                                                <div className={s.teamBar}>
                                                    <div className={s.teamBarFill} style={{ width: `${(m.count / maxLoad) * 100}%`, background: '#6366f1' }} />
                                                </div>
                                            </div>
                                            <div className={s.teamCount}>{m.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ═══ CLIENT DRILL-DOWN MODE ═══ */}
                {selectedClient && selClientObj && (
                    <>
                        {/* Back button + Client header */}
                        <div className={s.clientDrillHeader}>
                            <button className={s.backBtn} onClick={() => { setSelectedClient(null); setFilterPlatform('all'); setFilterStatus('all'); }}>
                                {ar ? '→ العودة للعملاء' : '← Back to Clients'}
                            </button>
                            <span className={s.clientDrillAvatar}>{selClientObj.avatar}</span>
                            <div style={{ flex: 1 }}>
                                <div className={s.clientDrillName}>{ar ? selClientObj.nameAr : selClientObj.name}</div>
                                <div className={s.clientDrillSector}>{ar ? (selClientObj.sectorAr || selClientObj.sector) : selClientObj.sector}</div>
                            </div>
                            <button className={s.btnPrimary} onClick={() => { setNewPost({ ...EMPTY_NEW_POST, clientId: selectedClient }); setShowNewPost(true); }}>
                                + {ar ? 'منشور جديد' : 'New Post'}
                            </button>
                        </div>

                        {/* Client KPIs */}
                        <div className={s.kpiGrid}>
                            {[
                                { v: kpis.total,     l: ar ? 'إجمالي'      : 'Total' },
                                { v: kpis.scheduled, l: ar ? 'مجدولة'      : 'Scheduled' },
                                { v: kpis.published, l: ar ? 'منشورة'      : 'Published' },
                                { v: kpis.inReview,  l: ar ? 'قيد المراجعة' : 'In Review' },
                                { v: kpis.draft,     l: ar ? 'مسودة'       : 'Draft' },
                            ].map((k, i) => (
                                <div key={i} className={s.kpiCard}>
                                    <div className={s.kpiValue}>{k.v}</div>
                                    <div className={s.kpiLabel}>{k.l}</div>
                                </div>
                            ))}
                        </div>

                        {/* Filter dropdowns (drill-down) */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 160 }}
                                value={filterPlatform}
                                onChange={e => setFilterPlatform(e.target.value)}
                            >
                                <option value="all">{ar ? 'كل المنصات' : 'All Platforms'}</option>
                                {PLATFORMS.map(p => (
                                    <option key={p} value={p}>{platformIcon(p)} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                            </select>
                            <select
                                className={s.modalSelect}
                                style={{ width: 'auto', minWidth: 160 }}
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="all">{ar ? 'كل الحالات' : 'All Statuses'}</option>
                                {PIPELINE_STAGES.map(st => (
                                    <option key={st} value={st}>{ar ? STAGE_META[st].ar : STAGE_META[st].en}</option>
                                ))}
                            </select>
                        </div>

                        {/* Client Pipeline */}
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>📌 {ar ? 'خط النشر' : 'Publishing Pipeline'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{filteredItems.length} {ar ? 'منشور' : 'posts'}</span>
                        </div>
                        <div className={s.pipelineCols}>
                            {PIPELINE_STAGES.map(stage => {
                                const sm = STAGE_META[stage];
                                const stageItems = filteredItems.filter(i => i.status === stage);
                                return (
                                    <div key={stage} className={s.pipelineCol}>
                                        <div className={s.pipelineColHeader}>
                                            <div className={s.pipelineColDot} style={{ background: sm.color }} />
                                            <span>{ar ? sm.ar : sm.en}</span>
                                            <span className={s.pipelineColCount}>{stageItems.length}</span>
                                        </div>
                                        {stageItems.map(item => (
                                            <div
                                                key={item.id}
                                                className={s.pipelineJobCard}
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <div className={s.pipelineJobTitle}>{platformIcon(item.platform)} {ar ? (item.titleAr || item.title) : item.title}</div>
                                                <div className={s.pipelineJobMeta}>{item.platform} {formatDate(item.scheduledAt) ? ` ${formatDate(item.scheduledAt)}` : ''}</div>
                                                {item.scheduledAt && (
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                                        📅 {formatDate(item.scheduledAt)} {formatTime(item.scheduledAt)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Client Calendar */}
                        <div className={s.sectionHeader}>
                            <span className={s.sectionTitle}>📅 {ar ? 'تقويم النشر' : 'Publishing Calendar'}</span>
                            <div className={s.sectionLine} />
                            <span className={s.sectionCount}>{now.toLocaleDateString(ar ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className={s.calGrid}>
                            {dn.map(d => <div key={d} className={s.calHeader}>{d}</div>)}
                            {Array.from({ length: fdw }).map((_, i) => <div key={`e${i}`} className={s.calEmpty} />)}
                            {Array.from({ length: dim }).map((_, i) => {
                                const day = i + 1;
                                const evts = evDay(day);
                                return (
                                    <div key={day} className={s.calDay}>
                                        <div className={s.calDayNum}>{day}</div>
                                        {evts.map(ev => (
                                            <div
                                                key={ev.id}
                                                className={s.calEvent}
                                                style={{ background: platformColor(ev.platform) }}
                                                title={`${ev.title} — ${ev.platform}`}
                                                onClick={() => setSelectedItem(ev)}
                                            >
                                                {platformIcon(ev.platform)} {ar ? (ev.titleAr || ev.title) : ev.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Client Team Workload */}
                        {workload.length > 0 && (
                            <>
                                <div className={s.sectionHeader}>
                                    <span className={s.sectionTitle}>👥 {ar ? 'حمل الفريق' : 'Team Workload'}</span>
                                    <div className={s.sectionLine} />
                                </div>
                                <div className={s.teamGrid}>
                                    {workload.map(m => (
                                        <div key={m.id} className={s.teamCard}>
                                            <div className={s.teamAvatar}>{m.avatar}</div>
                                            <div style={{ flex: 1 }}>
                                                <div className={s.teamName}>{ar ? m.name : m.nameEn}</div>
                                                <div className={s.teamRole}>{ar ? m.role : m.roleEn}</div>
                                                <div className={s.teamBar}>
                                                    <div className={s.teamBarFill} style={{ width: `${(m.count / maxLoad) * 100}%`, background: '#8b5cf6' }} />
                                                </div>
                                            </div>
                                            <div className={s.teamCount}>{m.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Selected client but client not found in map (edge case) */}
                {selectedClient && !selClientObj && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                        <div>{ar ? 'لم يتم العثور على العميل' : 'Client not found'}</div>
                        <button className={s.btnSecondary} style={{ marginTop: 16 }} onClick={() => setSelectedClient(null)}>
                            {ar ? 'العودة' : 'Go Back'}
                        </button>
                    </div>
                )}
            </main>

            {/* ═══ ITEM DETAIL DRAWER ═══ */}
            {selectedItem && (
                <div className={s.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700, position: 'relative' }}>
                        <button className={s.drawerClose} onClick={() => setSelectedItem(null)}>✕</button>
                        <div className={s.drawerTitle}>
                            {platformIcon(selectedItem.platform)} {ar ? (selectedItem.titleAr || selectedItem.title) : selectedItem.title}
                        </div>
                        <div className={s.campBadges}>
                            <span className={s.campBadge} style={{ borderColor: STAGE_META[selectedItem.status]?.color, color: STAGE_META[selectedItem.status]?.color }}>
                                {ar ? STAGE_META[selectedItem.status]?.ar : STAGE_META[selectedItem.status]?.en}
                            </span>
                            <span className={s.campBadge}>
                                {ar ? cn(selectedItem.clientId) : cnEn(selectedItem.clientId)}
                            </span>
                            <span className={s.campBadge} style={{ borderColor: platformColor(selectedItem.platform), color: platformColor(selectedItem.platform) }}>
                                {platformIcon(selectedItem.platform)} {selectedItem.platform}
                            </span>
                            {selectedItem.campaignId && campaignMap.get(selectedItem.campaignId) && (
                                <span className={`${s.campBadge} ${s.campBadgePurple}`}>
                                    🎯 {ar ? campaignMap.get(selectedItem.campaignId)!.nameAr : campaignMap.get(selectedItem.campaignId)!.name}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        {selectedItem.content && (
                            <div className={s.drawerSection}>
                                <div className={s.drawerLabel}>{ar ? 'المحتوى' : 'Content'}</div>
                                <div style={{ fontSize: 13, lineHeight: 1.8, background: 'var(--bg-glass)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                                    {selectedItem.content}
                                </div>
                            </div>
                        )}

                        {/* Details */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'التفاصيل' : 'Details'}</div>
                            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div><strong>{ar ? 'المنصة:' : 'Platform:'}</strong> {selectedItem.platform}</div>
                                {selectedItem.scheduledAt && (
                                    <div><strong>{ar ? 'الموعد:' : 'Scheduled:'}</strong> {formatDate(selectedItem.scheduledAt)} {formatTime(selectedItem.scheduledAt)}</div>
                                )}
                                {selectedItem.publishedAt && (
                                    <div><strong>{ar ? 'تاريخ النشر:' : 'Published:'}</strong> {formatDate(selectedItem.publishedAt)} {formatTime(selectedItem.publishedAt)}</div>
                                )}
                                {selectedItem.reviewerId && userMap.get(selectedItem.reviewerId) && (
                                    <div>
                                        <strong>{ar ? 'المراجع:' : 'Reviewer:'}</strong>{' '}
                                        {ar ? userMap.get(selectedItem.reviewerId)!.nameAr : userMap.get(selectedItem.reviewerId)!.name}
                                    </div>
                                )}
                                {selectedItem.linkedProductionJobId && (
                                    <div><strong>{ar ? 'وظيفة الإنتاج:' : 'Production Job:'}</strong> {selectedItem.linkedProductionJobId}</div>
                                )}
                                {selectedItem.linkedCreativeRequestId && (
                                    <div><strong>{ar ? 'الطلب الإبداعي:' : 'Creative Request:'}</strong> {selectedItem.linkedCreativeRequestId}</div>
                                )}
                                {selectedItem.syncStatus && selectedItem.syncStatus !== 'none' && (
                                    <div><strong>{ar ? 'حالة المزامنة:' : 'Sync Status:'}</strong> {selectedItem.syncStatus}</div>
                                )}
                            </div>
                        </div>

                        {/* Media URLs */}
                        {selectedItem.mediaUrls && selectedItem.mediaUrls !== '[]' && (() => {
                            try {
                                const urls: string[] = JSON.parse(selectedItem.mediaUrls);
                                if (urls.length === 0) return null;
                                return (
                                    <div className={s.drawerSection}>
                                        <div className={s.drawerLabel}>{ar ? 'الوسائط' : 'Media'}</div>
                                        <div className={s.campBadges}>
                                            {urls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={s.campBadge} style={{ textDecoration: 'none', color: 'var(--accent)' }}>
                                                    🔗 {ar ? `ملف ${i + 1}` : `File ${i + 1}`}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                );
                            } catch { return null; }
                        })()}

                        {/* Stage Actions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'تغيير المرحلة' : 'Change Stage'}</div>
                            <div className={s.actionRow}>
                                {PIPELINE_STAGES.map(st => (
                                    <button
                                        key={st}
                                        className={`${s.actionBtn} ${selectedItem.status === st ? s.btnPrimary : ''}`}
                                        style={selectedItem.status === st ? { background: STAGE_META[st].color, color: 'white', borderColor: 'transparent' } : undefined}
                                        onClick={() => handleStageChange(selectedItem, st)}
                                    >
                                        {ar ? STAGE_META[st].ar : STAGE_META[st].en}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ NEW POST MODAL ═══ */}
            {showNewPost && (
                <div className={s.modalOverlay} onClick={() => setShowNewPost(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <div className={s.modalTitle}>📢 {ar ? 'منشور جديد' : 'New Post'}</div>

                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'العنوان (EN)' : 'Title (EN)'}</label>
                            <input className={s.modalInput} value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder={ar ? 'العنوان بالإنجليزية' : 'Title in English'} />
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'العنوان (AR)' : 'Title (AR)'}</label>
                            <input className={s.modalInput} value={newPost.titleAr} onChange={e => setNewPost({ ...newPost, titleAr: e.target.value })} placeholder={ar ? 'العنوان بالعربية' : 'Title in Arabic'} />
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'العميل' : 'Client'}</label>
                            <select className={s.modalSelect} value={newPost.clientId} onChange={e => setNewPost({ ...newPost, clientId: e.target.value })}>
                                <option value="">{ar ? '-- اختر عميل --' : '-- Select Client --'}</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{ar ? c.nameAr : c.name}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'الحملة' : 'Campaign'}</label>
                            <select className={s.modalSelect} value={newPost.campaignId} onChange={e => setNewPost({ ...newPost, campaignId: e.target.value })}>
                                <option value="">{ar ? '-- بدون حملة --' : '-- No Campaign --'}</option>
                                {campaigns
                                    .filter(c => !newPost.clientId || c.clientId === newPost.clientId)
                                    .map(c => <option key={c.id} value={c.id}>{ar ? c.nameAr : c.name}</option>)
                                }
                            </select>
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'المنصة' : 'Platform'}</label>
                            <select className={s.modalSelect} value={newPost.platform} onChange={e => setNewPost({ ...newPost, platform: e.target.value })}>
                                {PLATFORMS.map(p => (
                                    <option key={p} value={p}>{platformIcon(p)} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'المحتوى' : 'Content'}</label>
                            <textarea className={s.modalTextarea} value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} placeholder={ar ? 'نص المنشور...' : 'Post content...'} />
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'تاريخ النشر' : 'Scheduled Date'}</label>
                            <input className={s.modalInput} type="date" value={newPost.scheduledDate} onChange={e => setNewPost({ ...newPost, scheduledDate: e.target.value })} />
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'وقت النشر' : 'Scheduled Time'}</label>
                            <input className={s.modalInput} type="time" value={newPost.scheduledTime} onChange={e => setNewPost({ ...newPost, scheduledTime: e.target.value })} />
                        </div>
                        <div className={s.modalField}>
                            <label className={s.modalLabel}>{ar ? 'المراجع' : 'Reviewer'}</label>
                            <select className={s.modalSelect} value={newPost.reviewerId} onChange={e => setNewPost({ ...newPost, reviewerId: e.target.value })}>
                                <option value="">{ar ? '-- بدون مراجع --' : '-- No Reviewer --'}</option>
                                {users.map(u => <option key={u.id} value={u.id}>{ar ? u.nameAr : u.name} — {ar ? u.roleAr : u.role}</option>)}
                            </select>
                        </div>

                        <div className={s.modalActions}>
                            <button className={s.btnPrimary} onClick={handleCreatePost} disabled={!newPost.title.trim() || !newPost.clientId || submitting}>
                                {submitting
                                    ? (ar ? 'جاري الإنشاء...' : 'Creating...')
                                    : (ar ? 'إنشاء' : 'Create')
                                }
                            </button>
                            <button className={s.btnSecondary} onClick={() => setShowNewPost(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && <div className={s.toast}>{toast}</div>}
        </div>
    );
}
