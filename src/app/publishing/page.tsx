'use client';
import { useState, useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { getPublishingStore, PUB_STAGES, PUB_STAGE_META, POST_CAT_AR, POST_CAT_EN, POST_CAT_ICON, PUB_TEAM, POST_CATEGORIES, PLATFORMS, type PubStage, type PublishingPost } from '@/lib/publishingStore';
import { getCreativeStore } from '@/lib/creativeStore';
import { useSettings } from '@/lib/useSettings';

export default function PublishingHQ() {
    const store = getPublishingStore();
    const cStore = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    useSyncExternalStore(cb => cStore.subscribe(cb), () => cStore.getVersion(), () => 0);

    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const [toast, setToast] = useState('');
    const [showNewPost, setShowNewPost] = useState(false);
    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);

    const [newPost, setNewPost] = useState({ title: '', clientId: 'client_warda', category: 'social_post' as any, platform: 'Instagram', caption: '', hashtags: '', scheduledDate: '', scheduledTime: '', owner: 'ريم', notes: '' });

    useEffect(() => { const t = store.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [ver, store]);

    const clients = cStore.clients;
    const kpis = store.getKPIs();
    const ar = lang === 'ar';
    const catL = ar ? POST_CAT_AR : POST_CAT_EN;

    // Calendar helpers
    const now = new Date(); const cY = now.getFullYear(); const cM = now.getMonth();
    const dim = new Date(cY, cM + 1, 0).getDate(); const fdw = new Date(cY, cM, 1).getDay();
    const dn = ar ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayStr = `${cY}-${String(cM + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const evDay = (day: number) => { const ds = `${cY}-${String(cM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return filteredCalendar.filter(e => e.date === ds); };

    // Filtered posts based on selected client
    const filteredPosts = selectedClient ? store.getClientPosts(selectedClient) : store.posts;
    const filteredActivities = selectedClient ? store.getClientActivities(selectedClient) : store.activities;
    const filteredCalendar = selectedClient ? store.getClientCalendar(selectedClient) : store.calendarEvents;
    const todayPosts = store.posts.filter(p => p.scheduledDate === todayStr && p.stage !== 'published' && p.stage !== 'performance_review');

    // Workload
    const workload = PUB_TEAM.map(m => { const items = filteredPosts.filter(p => p.stage !== 'published' && p.stage !== 'performance_review' && (p.assignedTeam.includes(m.name) || p.assignedTeam.includes(m.nameEn))); return { ...m, count: items.length }; });
    const maxLoad = Math.max(...workload.map(w => w.count), 1);

    // Client name helper
    const cn = (id: string) => clients.find(c => c.clientId === id)?.name || id;
    const cnEn = (id: string) => clients.find(c => c.clientId === id)?.nameEn || id;
    const clientAvatar = (id: string) => clients.find(c => c.clientId === id)?.avatar || '📦';
    const clientSector = (id: string) => { const c = clients.find(cl => cl.clientId === id); return ar ? (c?.sector || '') : (c?.sectorEn || ''); };

    // Unique client IDs with posts
    const clientIdsWithPosts = [...new Set(store.posts.map(p => p.clientId))];

    const sPost = selectedPost ? store.getPost(selectedPost) : null;
    const selClientObj = selectedClient ? clients.find(c => c.clientId === selectedClient) : null;

    // Create post handler
    const handleCreatePost = () => {
        store.createPost({ title: newPost.title, clientId: newPost.clientId, category: newPost.category, platform: newPost.platform, caption: newPost.caption, hashtags: newPost.hashtags.split(',').map(h => h.trim()).filter(Boolean), scheduledDate: newPost.scheduledDate, scheduledTime: newPost.scheduledTime, stage: 'content_received', owner: newPost.owner, assignedTeam: [newPost.owner], linkedCreativeRequestId: '', linkedProductionJobId: '', approved: false, blocked: false, blockReason: '', notes: newPost.notes }, lang);
        setShowNewPost(false);
        setNewPost({ title: '', clientId: 'client_warda', category: 'social_post', platform: 'Instagram', caption: '', hashtags: '', scheduledDate: '', scheduledTime: '', owner: 'ريم', notes: '' });
    };

    // Platform badge color
    const platformColor = (p: string) => {
        if (p.includes('Instagram')) return '#e1306c';
        if (p.includes('TikTok')) return '#000';
        if (p.includes('Facebook')) return '#1877f2';
        if (p.includes('Twitter') || p === 'X') return '#000';
        if (p.includes('LinkedIn')) return '#0a66c2';
        if (p.includes('YouTube')) return '#ff0000';
        if (p.includes('Email')) return '#14b8a6';
        if (p.includes('Snapchat')) return '#fffc00';
        return '#6366f1';
    };

    return (
        <div className={s.board} dir="rtl">
            {/* ── Header ── */}
            <header className={s.header}>
                <div className={s.headerRight}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.boardTitle}><div className={s.boardDot} /><h1 className={s.boardName}>{ar ? 'النشر' : 'Publishing'}</h1></div>
                </div>
                <div className={s.headerLeft}>
                    <button className={s.iconBtn} onClick={toggleTheme}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg></button>
                    <button className={s.iconBtn} onClick={toggleLang}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></button>
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
                {!selectedClient && <>
                    {/* ── KPIs ── */}
                    <div className={s.kpiGrid}>
                        {[
                            { v: kpis.total, l: ar ? 'إجمالي المنشورات' : 'Total Posts' },
                            { v: kpis.active, l: ar ? 'نشطة' : 'Active' },
                            { v: kpis.inReview, l: ar ? 'قيد المراجعة' : 'In Review' },
                            { v: kpis.scheduled, l: ar ? 'مجدولة' : 'Scheduled' },
                            { v: kpis.published, l: ar ? 'تم النشر' : 'Published' },
                            { v: kpis.publishedThisMonth, l: ar ? 'هذا الشهر' : 'This Month' },
                            { v: kpis.blocked, l: ar ? 'محظور' : 'Blocked' },
                            { v: `${kpis.avgEngagement}%`, l: ar ? 'متوسط التفاعل' : 'Avg. Engagement' },
                        ].map((k, i) => (
                            <div key={i} className={s.kpiCard}><div className={s.kpiValue}>{k.v}</div><div className={s.kpiLabel}>{k.l}</div></div>
                        ))}
                    </div>

                    {/* ── Today's Posts (all clients) ── */}
                    <div className={s.sectionHeader}>
                        <span className={s.sectionTitle}>📅 {ar ? `المطلوب نشرها اليوم — ${todayStr}` : `To Publish Today — ${todayStr}`}</span>
                        <div className={s.sectionLine} />
                        <span className={s.sectionCount}>{todayPosts.length} {ar ? 'منشور' : 'posts'}</span>
                    </div>
                    {todayPosts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>✅ {ar ? 'لا توجد منشورات مطلوبة اليوم' : 'No posts scheduled for today'}</div>
                    ) : (
                        <div className={s.todayGrid}>
                            {todayPosts.map(p => (
                                <div key={p.postId} className={s.todayCard} onClick={() => setSelectedPost(p.postId)}>
                                    <div className={s.todayCardHeader}>
                                        <span style={{ fontSize: 22 }}>{clientAvatar(p.clientId)}</span>
                                        <div style={{ flex: 1 }}>
                                            <div className={s.todayCardTitle}>{POST_CAT_ICON[p.category]} {p.title}</div>
                                            <div className={s.todayCardMeta}>{cn(p.clientId)} • {p.platform} • {p.scheduledTime || '--:--'}</div>
                                        </div>
                                        <span className={s.campBadge} style={{ borderColor: PUB_STAGE_META[p.stage].color, color: PUB_STAGE_META[p.stage].color }}>{ar ? PUB_STAGE_META[p.stage].ar : PUB_STAGE_META[p.stage].en}</span>
                                    </div>
                                    {p.caption && <div className={s.todayCardCaption}>{p.caption.slice(0, 80)}{p.caption.length > 80 ? '...' : ''}</div>}
                                    {p.blocked && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>⛔ {p.blockReason}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Client Cards ── */}
                    <div className={s.sectionHeader}>
                        <span className={s.sectionTitle}>👥 {ar ? 'العملاء' : 'Clients'}</span>
                        <div className={s.sectionLine} />
                        <span className={s.sectionCount}>{clientIdsWithPosts.length} {ar ? 'عميل' : 'clients'}</span>
                        <button className={s.btnPrimary} onClick={() => setShowNewPost(true)}>+ {ar ? 'منشور جديد' : 'New Post'}</button>
                    </div>
                    <div className={s.clientGrid}>
                        {clientIdsWithPosts.map(cid => {
                            const cPosts = store.getClientPosts(cid);
                            const activePosts = cPosts.filter(p => p.stage !== 'published' && p.stage !== 'performance_review');
                            const publishedPosts = cPosts.filter(p => p.stage === 'published');
                            const blockedPosts = cPosts.filter(p => p.blocked);
                            const todayClient = cPosts.filter(p => p.scheduledDate === todayStr && p.stage !== 'published');
                            return (
                                <div key={cid} className={s.clientCard} onClick={() => setSelectedClient(cid)}>
                                    <div className={s.clientCardHead}>
                                        <span className={s.clientCardAvatar}>{clientAvatar(cid)}</span>
                                        <div style={{ flex: 1 }}>
                                            <div className={s.clientCardName}>{cn(cid)}</div>
                                            <div className={s.clientCardSector}>{clientSector(cid)}</div>
                                        </div>
                                        <span style={{ fontSize: 20 }}>←</span>
                                    </div>
                                    <div className={s.clientCardStats}>
                                        <div className={s.clientStat}><div className={s.clientStatVal}>{cPosts.length}</div><div className={s.clientStatLbl}>{ar ? 'إجمالي' : 'Total'}</div></div>
                                        <div className={s.clientStat}><div className={s.clientStatVal} style={{ color: '#6366f1' }}>{activePosts.length}</div><div className={s.clientStatLbl}>{ar ? 'نشطة' : 'Active'}</div></div>
                                        <div className={s.clientStat}><div className={s.clientStatVal} style={{ color: '#22c55e' }}>{publishedPosts.length}</div><div className={s.clientStatLbl}>{ar ? 'منشور' : 'Published'}</div></div>
                                        {blockedPosts.length > 0 && <div className={s.clientStat}><div className={s.clientStatVal} style={{ color: '#dc2626' }}>{blockedPosts.length}</div><div className={s.clientStatLbl}>{ar ? 'محظور' : 'Blocked'}</div></div>}
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
                            const day = i + 1; const evts = evDay(day);
                            return (
                                <div key={day} className={s.calDay}>
                                    <div className={s.calDayNum}>{day}</div>
                                    {evts.map(ev => <div key={ev.id} className={s.calEvent} style={{ background: platformColor(ev.platform) }} title={`${ev.title} — ${ev.platform}`}>{POST_CAT_ICON[store.getPost(ev.postId || '')?.category || 'social_post']} {ev.title}</div>)}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Alerts ── */}
                    {store.posts.filter(p => p.blocked).length > 0 && <>
                        <div className={s.sectionHeader}><span className={s.sectionTitle}>🚨 {ar ? 'تنبيهات' : 'Alerts'}</span><div className={s.sectionLine} /></div>
                        {store.posts.filter(p => p.blocked).map(p => (
                            <div key={p.postId} className={s.alertCard}>
                                <span className={s.alertIcon}>⛔</span>
                                <span style={{ flex: 1 }}>{p.title} — {cn(p.clientId)} — {p.blockReason}</span>
                                <button className={s.actionBtn} onClick={() => { store.unblock(p.postId, lang); }}>✅ {ar ? 'رفع الحظر' : 'Unblock'}</button>
                            </div>
                        ))}
                    </>}
                </>}

                {/* ═══ CLIENT DRILL-DOWN MODE ═══ */}
                {selectedClient && selClientObj && <>
                    {/* Back button + Client header */}
                    <div className={s.clientDrillHeader}>
                        <button className={s.backBtn} onClick={() => setSelectedClient(null)}>→ {ar ? 'العودة للعملاء' : 'Back to Clients'}</button>
                        <span className={s.clientDrillAvatar}>{selClientObj.avatar}</span>
                        <div style={{ flex: 1 }}>
                            <div className={s.clientDrillName}>{ar ? selClientObj.name : selClientObj.nameEn}</div>
                            <div className={s.clientDrillSector}>{ar ? selClientObj.sector : selClientObj.sectorEn}</div>
                        </div>
                        <button className={s.btnPrimary} onClick={() => { setNewPost({ ...newPost, clientId: selectedClient }); setShowNewPost(true); }}>+ {ar ? 'منشور جديد' : 'New Post'}</button>
                    </div>

                    {/* Client KPIs */}
                    <div className={s.kpiGrid}>
                        {[
                            { v: filteredPosts.length, l: ar ? 'إجمالي' : 'Total' },
                            { v: filteredPosts.filter(p => p.stage !== 'published' && p.stage !== 'performance_review').length, l: ar ? 'نشطة' : 'Active' },
                            { v: filteredPosts.filter(p => p.stage === 'review').length, l: ar ? 'مراجعة' : 'Review' },
                            { v: filteredPosts.filter(p => p.stage === 'published').length, l: ar ? 'منشور' : 'Published' },
                            { v: filteredPosts.filter(p => p.blocked).length, l: ar ? 'محظور' : 'Blocked' },
                        ].map((k, i) => (
                            <div key={i} className={s.kpiCard}><div className={s.kpiValue}>{k.v}</div><div className={s.kpiLabel}>{k.l}</div></div>
                        ))}
                    </div>

                    {/* Client Pipeline */}
                    <div className={s.sectionHeader}>
                        <span className={s.sectionTitle}>📌 {ar ? 'خط النشر' : 'Publishing Pipeline'}</span>
                        <div className={s.sectionLine} />
                        <span className={s.sectionCount}>{filteredPosts.length} {ar ? 'منشور' : 'posts'}</span>
                    </div>
                    <div className={s.pipelineCols}>
                        {PUB_STAGES.map(stage => {
                            const sm = PUB_STAGE_META[stage];
                            const stagePosts = filteredPosts.filter(p => p.stage === stage);
                            return (
                                <div key={stage} className={s.pipelineCol}>
                                    <div className={s.pipelineColHeader}>
                                        <div className={s.pipelineColDot} style={{ background: sm.color }} />
                                        <span>{ar ? sm.ar : sm.en}</span>
                                        <span className={s.pipelineColCount}>{stagePosts.length}</span>
                                    </div>
                                    {stagePosts.map(p => (
                                        <div key={p.postId} className={s.pipelineJobCard} onClick={() => setSelectedPost(p.postId)} style={p.blocked ? { borderColor: 'rgba(220,38,38,.4)' } : undefined}>
                                            <div className={s.pipelineJobTitle}>{POST_CAT_ICON[p.category]} {p.title}</div>
                                            <div className={s.pipelineJobMeta}>{p.platform} • {p.scheduledDate || ''}</div>
                                            {p.scheduledDate && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>📅 {p.scheduledDate} {p.scheduledTime}</div>}
                                            {p.blocked && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>⛔ {p.blockReason}</div>}
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
                            const day = i + 1; const evts = evDay(day);
                            return (
                                <div key={day} className={s.calDay}>
                                    <div className={s.calDayNum}>{day}</div>
                                    {evts.map(ev => <div key={ev.id} className={s.calEvent} style={{ background: platformColor(ev.platform) }} title={`${ev.title} — ${ev.platform}`}>{POST_CAT_ICON[store.getPost(ev.postId || '')?.category || 'social_post']} {ev.title}</div>)}
                                </div>
                            );
                        })}
                    </div>

                    {/* Client Team Workload */}
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>👥 {ar ? 'حمل الفريق' : 'Team Workload'}</span><div className={s.sectionLine} /></div>
                    <div className={s.teamGrid}>
                        {workload.filter(m => m.count > 0).map(m => (
                            <div key={m.id} className={s.teamCard}>
                                <div className={s.teamAvatar} style={{ background: `${m.color}20` }}>{m.avatar}</div>
                                <div style={{ flex: 1 }}>
                                    <div className={s.teamName}>{ar ? m.name : m.nameEn}</div>
                                    <div className={s.teamRole}>{ar ? m.role : m.roleEn}</div>
                                    <div className={s.teamBar}><div className={s.teamBarFill} style={{ width: `${(m.count / maxLoad) * 100}%`, background: m.color }} /></div>
                                </div>
                                <div className={s.teamCount}>{m.count}</div>
                            </div>
                        ))}
                    </div>

                    {/* Client Activity Feed */}
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>📢 {ar ? 'آخر الأحداث' : 'Activity Feed'}</span><div className={s.sectionLine} /></div>
                    <div className={s.activityList}>
                        {filteredActivities.slice(0, 10).map(a => (
                            <div key={a.id} className={s.activityItem}>
                                <span className={s.activityIcon}>{a.icon}</span>
                                <span className={s.activityText}>{ar ? a.text : a.textEn}</span>
                                <span className={s.activityTime}>{a.time}</span>
                            </div>
                        ))}
                    </div>

                    {/* Client Alerts */}
                    {filteredPosts.filter(p => p.blocked).length > 0 && <>
                        <div className={s.sectionHeader}><span className={s.sectionTitle}>🚨 {ar ? 'تنبيهات' : 'Alerts'}</span><div className={s.sectionLine} /></div>
                        {filteredPosts.filter(p => p.blocked).map(p => (
                            <div key={p.postId} className={s.alertCard}>
                                <span className={s.alertIcon}>⛔</span>
                                <span style={{ flex: 1 }}>{p.title} — {p.blockReason}</span>
                                <button className={s.actionBtn} onClick={() => { store.unblock(p.postId, lang); }}>✅ {ar ? 'رفع الحظر' : 'Unblock'}</button>
                            </div>
                        ))}
                    </>}
                </>}
            </main>

            {/* ═══ POST DETAIL DRAWER ═══ */}
            {sPost && (
                <div className={s.modalOverlay} onClick={() => setSelectedPost(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <button className={s.drawerClose} onClick={() => setSelectedPost(null)}>✕</button>
                        <div className={s.drawerTitle}>{POST_CAT_ICON[sPost.category]} {sPost.title}</div>
                        <div className={s.campBadges}>
                            <span className={s.campBadge} style={{ borderColor: PUB_STAGE_META[sPost.stage].color, color: PUB_STAGE_META[sPost.stage].color }}>{ar ? PUB_STAGE_META[sPost.stage].ar : PUB_STAGE_META[sPost.stage].en}</span>
                            <span className={s.campBadge}>{cn(sPost.clientId)}</span>
                            <span className={s.campBadge} style={{ borderColor: platformColor(sPost.platform), color: platformColor(sPost.platform) }}>{sPost.platform}</span>
                            {sPost.blocked && <span className={`${s.campBadge} ${s.campBadgeRed}`}>⛔ {ar ? 'محظور' : 'Blocked'}</span>}
                        </div>

                        {/* Caption & Hashtags */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'النص' : 'Caption'}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.8, background: 'var(--bg-glass)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>{sPost.caption}</div>
                            {sPost.hashtags.length > 0 && <div className={s.campBadges} style={{ marginTop: 8 }}>{sPost.hashtags.map(h => <span key={h} className={`${s.campBadge} ${s.campBadgePurple}`}>#{h}</span>)}</div>}
                        </div>

                        {/* Schedule Info */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'التفاصيل' : 'Details'}</div>
                            <div style={{ fontSize: 13 }}>
                                <div><strong>{ar ? 'النوع:' : 'Category:'}</strong> {catL[sPost.category]}</div>
                                <div><strong>{ar ? 'المنصة:' : 'Platform:'}</strong> {sPost.platform}</div>
                                <div><strong>{ar ? 'الموعد:' : 'Scheduled:'}</strong> {sPost.scheduledDate} {sPost.scheduledTime}</div>
                                <div><strong>{ar ? 'المسؤول:' : 'Owner:'}</strong> {sPost.owner}</div>
                                <div><strong>{ar ? 'الفريق:' : 'Team:'}</strong> {sPost.assignedTeam.join(', ')}</div>
                                {sPost.notes && <div><strong>{ar ? 'ملاحظات:' : 'Notes:'}</strong> {sPost.notes}</div>}
                                {sPost.publishedUrl && <div><strong>{ar ? 'الرابط:' : 'URL:'}</strong> <a href={sPost.publishedUrl} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>{sPost.publishedUrl}</a></div>}
                            </div>
                        </div>

                        {/* Performance */}
                        {sPost.performance && (
                            <div className={s.drawerSection}>
                                <div className={s.drawerLabel}>📊 {ar ? 'الأداء' : 'Performance'}</div>
                                <div className={s.perfGrid}>
                                    {[
                                        { v: sPost.performance.reach.toLocaleString(), l: ar ? 'الوصول' : 'Reach' },
                                        { v: sPost.performance.impressions.toLocaleString(), l: ar ? 'الانطباعات' : 'Impressions' },
                                        { v: `${sPost.performance.engagement}%`, l: ar ? 'التفاعل' : 'Engagement' },
                                        { v: sPost.performance.likes.toLocaleString(), l: ar ? 'إعجاب' : 'Likes' },
                                        { v: sPost.performance.comments.toLocaleString(), l: ar ? 'تعليقات' : 'Comments' },
                                        { v: sPost.performance.shares.toLocaleString(), l: ar ? 'مشاركة' : 'Shares' },
                                        { v: sPost.performance.saves.toLocaleString(), l: ar ? 'حفظ' : 'Saves' },
                                    ].map((k, i) => (
                                        <div key={i} className={s.perfCard}><div className={s.perfValue}>{k.v}</div><div className={s.perfLabel}>{k.l}</div></div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stage Actions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'تغيير المرحلة' : 'Change Stage'}</div>
                            <div className={s.actionRow}>
                                {PUB_STAGES.map(st => (
                                    <button key={st} className={`${s.actionBtn} ${sPost.stage === st ? s.btnPrimary : ''}`} onClick={() => store.movePostToStage(sPost.postId, st, lang)} style={sPost.stage === st ? { background: PUB_STAGE_META[st].color, color: 'white', borderColor: 'transparent' } : undefined}>
                                        {ar ? PUB_STAGE_META[st].ar : PUB_STAGE_META[st].en}
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
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'العنوان' : 'Title'}</label><input className={s.modalInput} value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'العميل' : 'Client'}</label>
                            <select className={s.modalSelect} value={newPost.clientId} onChange={e => setNewPost({ ...newPost, clientId: e.target.value })}>
                                {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'النوع' : 'Category'}</label>
                            <select className={s.modalSelect} value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value as any })}>
                                {POST_CATEGORIES.map(k => <option key={k} value={k}>{POST_CAT_ICON[k]} {catL[k]}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'المنصة' : 'Platform'}</label>
                            <select className={s.modalSelect} value={newPost.platform} onChange={e => setNewPost({ ...newPost, platform: e.target.value })}>
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'النص' : 'Caption'}</label><textarea className={s.modalTextarea} value={newPost.caption} onChange={e => setNewPost({ ...newPost, caption: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'الهاشتاقات (مفصولة بفاصلة)' : 'Hashtags (comma-separated)'}</label><input className={s.modalInput} value={newPost.hashtags} onChange={e => setNewPost({ ...newPost, hashtags: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'تاريخ النشر' : 'Scheduled Date'}</label><input className={s.modalInput} type="date" value={newPost.scheduledDate} onChange={e => setNewPost({ ...newPost, scheduledDate: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'وقت النشر' : 'Scheduled Time'}</label><input className={s.modalInput} type="time" value={newPost.scheduledTime} onChange={e => setNewPost({ ...newPost, scheduledTime: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'المسؤول' : 'Owner'}</label>
                            <select className={s.modalSelect} value={newPost.owner} onChange={e => setNewPost({ ...newPost, owner: e.target.value })}>
                                {PUB_TEAM.map(m => <option key={m.id} value={m.name}>{m.name} — {m.role}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'ملاحظات' : 'Notes'}</label><textarea className={s.modalTextarea} value={newPost.notes} onChange={e => setNewPost({ ...newPost, notes: e.target.value })} /></div>
                        <div className={s.modalActions}>
                            <button className={s.btnPrimary} onClick={handleCreatePost} disabled={!newPost.title.trim()}>✅ {ar ? 'إنشاء' : 'Create'}</button>
                            <button className={s.btnSecondary} onClick={() => setShowNewPost(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Export */}
            <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 40 }}>
                <button className={s.btnPrimary} onClick={() => { const report = store.exportMonthlyReport(lang); const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `publishing_monthly_report_${report.date}.json`; a.click(); }}>📊 {ar ? 'تصدير تقرير النشر الشهري' : 'Export Monthly Publishing Report'}</button>
            </div>

            {toast && <div className={s.toast}>{toast}</div>}
        </div>
    );
}
