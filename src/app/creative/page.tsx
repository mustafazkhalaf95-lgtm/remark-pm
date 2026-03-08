'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { getCreativeStore, STAGE_META, CATEGORY_ICONS, CATEGORY_LABELS_AR, CATEGORY_LABELS_EN, TEAM_MEMBERS, type PipelineStage } from '@/lib/creativeStore';

const ASSET_LABELS: Record<string, string> = { logo: '🏷️ شعار', identity: '📐 هوية', product_image: '📷 صور', video: '🎬 فيديو', approved_design: '✅ تصاميم', visual_ref: '🖼️ مراجع' };

export default function CreativeHQ() {
    const store = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const [fClient, setFClient] = useState('all');
    const [fType, setFType] = useState('all');
    const [fPrio, setFPrio] = useState('all');
    const [assetSearch, setAssetSearch] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => { theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }, [theme]);
    useEffect(() => { const t = store.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [ver]);

    const catL = lang === 'ar' ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;
    const pL: Record<string, string> = { urgent: lang === 'ar' ? 'عاجل' : 'Urgent', high: lang === 'ar' ? 'مرتفع' : 'High', medium: lang === 'ar' ? 'متوسط' : 'Medium', low: lang === 'ar' ? 'منخفض' : 'Low' };
    const allReqs = store.requests;
    const filtered = allReqs.filter(r => {
        if (fClient !== 'all' && r.clientId !== fClient) return false;
        if (fType !== 'all' && r.category !== fType) return false;
        if (fPrio !== 'all' && r.priority !== fPrio) return false;
        return true;
    });
    const active = filtered.filter(r => store.isActive(r));
    const kA = active.length;
    const kR = active.filter(r => ['awaiting_concept_approval', 'cd_review', 'final_approval'].includes(r.status)).length;
    const kB = active.filter(r => r.blocked).length;
    const kH = filtered.filter(r => r.status === 'ready_for_handoff').length;
    const kOv = active.filter(r => r.dueDate && new Date(r.dueDate) < new Date()).length;

    const visStages: PipelineStage[] = ['new_request', 'brief_completion', 'inspiration_ready', 'concept_in_progress', 'awaiting_concept_approval', 'creative_execution', 'cd_review', 'revisions_required', 'final_approval', 'ready_for_handoff'];

    // Calendar
    const now = new Date(); const cY = now.getFullYear(); const cM = now.getMonth();
    const dim = new Date(cY, cM + 1, 0).getDate(); const fdw = new Date(cY, cM, 1).getDay();
    const dn = lang === 'ar' ? ['أحد', 'إثن', 'ثلا', 'أربع', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calEvts = fClient === 'all' ? store.calendarEvents : store.calendarEvents.filter(e => e.clientId === fClient);
    const evDay = (day: number) => { const ds = `${cY}-${String(cM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return calEvts.filter(e => e.date === ds); };

    // Workload
    const workload = TEAM_MEMBERS.map(m => { const items = active.filter(r => r.assignedTo.includes(m.name) || r.assignedTo.includes(m.nameEn)); return { ...m, count: items.length }; });

    // Assets
    const filteredAssets = store.brandAssets.filter(a => {
        if (fClient !== 'all' && a.clientId !== fClient) return false;
        if (assetSearch) { const s = assetSearch.toLowerCase(); if (!a.name.toLowerCase().includes(s) && !a.description.toLowerCase().includes(s)) return false; }
        return true;
    });

    // CD attention
    const cdItems = active.filter(r => r.status === 'cd_review' || r.blocked || r.status === 'awaiting_concept_approval');

    return (
        <div className={s.board} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {toast && <div className={s.toast}>{toast}</div>}

            {/* HEADER */}
            <header className={s.header}>
                <div className={s.headerR}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.boardTitle}><div className={s.dot} /><h1 className={s.boardName}>{lang === 'ar' ? 'المقر الإبداعي' : 'Creative HQ'}</h1></div>
                </div>
                <div className={s.headerL}>
                    <div className={s.switcher}><Link href="/" className={s.swBtn}>{lang === 'ar' ? '📋 التسويق' : '📋 Marketing'}</Link><span className={`${s.swBtn} ${s.swActive}`}>{lang === 'ar' ? '🎨 الإبداعي' : '🎨 Creative'}</span><Link href="/production" className={s.swBtn}>{lang === 'ar' ? '🎬 الإنتاج' : '🎬 Production'}</Link><Link href="/publishing" className={s.swBtn}>{lang === 'ar' ? '📢 النشر' : '📢 Publishing'}</Link></div>
                    <button className={s.iconBtn} onClick={() => setTheme(p => p === 'light' ? 'dark' : 'light')}>🌙</button>
                    <button className={s.iconBtn} onClick={() => setLang(p => p === 'ar' ? 'en' : 'ar')}>🌐</button>
                </div>
            </header>

            <main className={s.content}>
                {/* FILTERS */}
                <div className={s.filterBar}>
                    <select className={s.filterSel} value={fClient} onChange={e => setFClient(e.target.value)}><option value="all">{lang === 'ar' ? 'جميع العملاء' : 'All Clients'}</option>{store.clients.map(c => <option key={c.clientId} value={c.clientId}>{c.avatar} {c.name}</option>)}</select>
                    <select className={s.filterSel} value={fType} onChange={e => setFType(e.target.value)}><option value="all">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>{Object.entries(catL).map(([k, v]) => <option key={k} value={k}>{CATEGORY_ICONS[k as keyof typeof CATEGORY_ICONS]} {v}</option>)}</select>
                    <select className={s.filterSel} value={fPrio} onChange={e => setFPrio(e.target.value)}><option value="all">{lang === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</option><option value="urgent">🔴 {pL.urgent}</option><option value="high">🟠 {pL.high}</option><option value="medium">🔵 {pL.medium}</option></select>
                </div>

                {/* KPIs */}
                <div className={s.kpiRow}>
                    {[[lang === 'ar' ? 'نشطة' : 'Active', kA, '#3b82f6'], [lang === 'ar' ? 'بانتظار القرار' : 'Awaiting Decision', kR, '#ec4899'], [lang === 'ar' ? 'محظورة' : 'Blocked', kB, kB > 0 ? '#ef4444' : '#6b7280'], [lang === 'ar' ? 'جاهزة للتسليم' : 'Ready', kH, '#22c55e'], [lang === 'ar' ? 'متأخرة' : 'Overdue', kOv, kOv > 0 ? '#ef4444' : '#6b7280']].map(([l, v, c], i) => (
                        <div key={i} className={s.kpiCard} style={{ borderRight: `4px solid ${c}` }}><div className={s.kpiLabel}>{l as string}</div><div className={s.kpiValue} style={{ color: c as string }}>{v as number}</div></div>
                    ))}
                </div>

                {/* CLIENT CARDS */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>👥 {lang === 'ar' ? 'العملاء' : 'Clients'}</div><div className={s.secCount}>{store.clients.length}</div><div className={s.secLine} /></div>
                <div className={s.clientGrid}>{store.clients.map(cl => {
                    const cReqs = store.getClientRequests(cl.clientId); const cActive = cReqs.filter(r => store.isActive(r)); const cBlocked = cActive.filter(r => r.blocked); const cReview = cActive.filter(r => ['cd_review', 'awaiting_concept_approval', 'final_approval'].includes(r.status)); const profile = store.getProfile(cl.clientId); const msgs = store.getClientChat(cl.clientId); const nextDue = cActive.filter(r => r.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
                    return (<div key={cl.clientId} className={s.clientCard}>
                        <div className={s.clientCardHead}><div className={s.clientAv} style={{ background: profile ? `linear-gradient(135deg,${profile.primaryColor},${profile.secondaryColor})` : undefined }}>{cl.avatar}</div><div className={s.clientInfo}><div className={s.clientName}>{cl.name}</div><div className={s.clientSec}>{cl.sector} • {cl.planType}</div></div></div>
                        <div className={s.clientMetrics}>
                            <div className={s.metricItem}><span className={s.metricVal}>{cActive.length}</span><span className={s.metricLbl}>{lang === 'ar' ? 'نشطة' : 'Active'}</span></div>
                            <div className={s.metricItem}><span className={s.metricVal} style={{ color: cReview.length > 0 ? '#ec4899' : undefined }}>{cReview.length}</span><span className={s.metricLbl}>{lang === 'ar' ? 'قرار' : 'Decision'}</span></div>
                            <div className={s.metricItem}><span className={s.metricVal} style={{ color: cBlocked.length > 0 ? '#ef4444' : undefined }}>{cBlocked.length}</span><span className={s.metricLbl}>{lang === 'ar' ? 'محظور' : 'Blocked'}</span></div>
                        </div>
                        {nextDue && <div className={s.clientDue}>📅 {nextDue.dueDate} — {nextDue.title}</div>}
                        {cl.linkedFromMarketing && <div className={s.clientDue} style={{ borderRight: '2px solid #14b8a6', color: '#14b8a6' }}>🔗 {lang === 'ar' ? 'مرتبط بالتسويق' : 'Linked to Marketing'} • {cl.marketingTaskCount || 0} {lang === 'ar' ? 'مهمة' : 'tasks'}</div>}
                        <div className={s.clientActions}><Link href={`/creative/client/${cl.clientId}`} className={s.clientBtn}>{lang === 'ar' ? 'فتح مساحة العمل →' : 'Open Workspace →'}</Link><div className={s.quickStats}><span>💬{msgs.length}</span><span>📋{cReqs.length}</span>{cl.linkedFromMarketing && <Link href="/" style={{ fontSize: 11, color: '#14b8a6', textDecoration: 'none' }}>📋→</Link>}</div></div>
                    </div>);
                })}</div>

                {/* ═══ PANORAMIC SHOWCASE ═══ */}
                {store.showcaseVideos.length > 0 && (<>
                    <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🏆 {lang === 'ar' ? 'إنجازاتكم فخر ريمارك' : 'Our Pride — Remark Achievements'}</div><div className={s.secLine} /></div>
                    <div className={s.showcaseWrap}>
                        <div className={s.showcaseTrack}>
                            {[...store.showcaseVideos, ...store.showcaseVideos, ...store.showcaseVideos].map((v, i) => {
                                const cl = store.getClient(v.clientId); return (
                                    <Link href={`/creative/client/${v.clientId}`} key={`${v.showcaseId}_${i}`} className={s.showcaseTile}>
                                        <div className={s.showcaseScreen}><div className={s.showcasePlay}>▶</div><div className={s.showcaseDur}>{v.duration}</div></div>
                                        <div className={s.showcaseLabel}><span className={s.showcaseTitle}>{cl?.avatar} {v.title}</span><span className={s.showcaseMeta}>{cl?.name} • {catL[v.category]} • ✅ {v.approvedAt}</span></div>
                                    </Link>);
                            })}
                        </div>
                    </div>
                </>)}

                {/* PIPELINE */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🔄 {lang === 'ar' ? 'خط الإنتاج' : 'Pipeline'}</div><div className={s.secCount}>{filtered.length}</div><div className={s.secLine} /></div>
                <div className={s.pipeScroll}><div className={s.pipeline}>
                    {visStages.map(stage => {
                        const sm = STAGE_META[stage]; const items = filtered.filter(r => r.status === stage); return (
                            <div key={stage} className={s.pipeCol}>
                                <div className={s.pipeColHead}><div className={s.pipeColDot} style={{ background: sm.color }} /><div className={s.pipeColName}>{lang === 'ar' ? sm.ar : sm.en}</div><div className={s.pipeColCount}>{items.length}</div></div>
                                <div className={s.pipeColOwner}>{lang === 'ar' ? sm.owner_ar : sm.owner_en}</div>
                                <div className={s.pipeCards}>{items.map(req => {
                                    const cl = store.getClient(req.clientId); return (
                                        <Link href={`/creative/client/${req.clientId}`} key={req.requestId} className={s.pipeCard}>
                                            <div className={s.pipeCardClient}>{cl?.avatar} {cl?.name}</div>
                                            <div className={s.pipeCardTitle}>{CATEGORY_ICONS[req.category]} {req.title}</div>
                                            <div className={s.pipeCardBadges}>
                                                <span className={`${s.badge} ${s['p' + req.priority[0].toUpperCase()]}`}>{pL[req.priority]}</span>
                                                <span className={s.ownerBadge}>👤 {lang === 'ar' ? sm.owner_ar : sm.owner_en}</span>
                                            </div>
                                            {req.assignedTo && <div className={s.pipeCardAssignee}>🎯 {req.assignedTo}</div>}
                                            <div className={s.pipeCardDue}>📅 {req.dueDate}</div>
                                            <div className={s.pipeCardNext}>▶ {lang === 'ar' ? sm.nextAction_ar : sm.nextAction_en}</div>
                                            {req.blocked && <div className={s.blockedBadge}>⛔ {lang === 'ar' ? 'محظور' : 'Blocked'}: {req.blockReason.slice(0, 30)}</div>}
                                            {req.conceptApproved && <div className={s.approvedBadge}>✅ {lang === 'ar' ? 'مفهوم معتمد' : 'Concept OK'}</div>}
                                            {req.finalApproved && <div className={s.approvedBadge}>🎉 {lang === 'ar' ? 'اعتماد نهائي' : 'Final OK'}</div>}
                                            {req.sourceBoard === 'marketing' && <div className={s.approvedBadge} style={{ color: '#14b8a6', borderColor: 'rgba(20,184,166,.2)', background: 'rgba(20,184,166,.06)' }}>📋 {lang === 'ar' ? 'من التسويق' : 'Marketing'}</div>}
                                        </Link>);
                                })}</div>
                            </div>);
                    })}
                </div></div>

                {/* CALENDAR */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>📅 {lang === 'ar' ? 'التقويم' : 'Calendar'}</div><div className={s.secLine} /></div>
                <div className={s.bigCal}>
                    <div className={s.calHeader}><div className={s.calMonth}>{now.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}</div><div className={s.calLegend}><span className={s.calLeg}><span className={s.calDot} style={{ background: '#ef4444' }} />⏰</span><span className={s.calLeg}><span className={s.calDot} style={{ background: '#8b5cf6' }} />📸</span><span className={s.calLeg}><span className={s.calDot} style={{ background: '#22c55e' }} />🚀</span><span className={s.calLeg}><span className={s.calDot} style={{ background: '#f59e0b' }} />🔍</span></div></div>
                    <div className={s.calGrid}>
                        {dn.map(d => <div key={d} className={s.calDH}>{d}</div>)}
                        {Array.from({ length: fdw }).map((_, i) => <div key={`e${i}`} className={`${s.calDay} ${s.calEmpty}`} />)}
                        {Array.from({ length: dim }).map((_, i) => {
                            const day = i + 1; const today = day === now.getDate(); const evs = evDay(day); return (
                                <div key={day} className={`${s.calDay} ${today ? s.calToday : ''}`}><div className={s.calDayNum}>{day}</div><div className={s.calEvts}>{evs.slice(0, 3).map(ev => { const cl = store.getClient(ev.clientId); return <div key={ev.id} className={s.calEv} style={{ background: ev.color }} title={ev.title}>{cl?.avatar}</div>; })}{evs.length > 3 && <div className={s.calMore}>+{evs.length - 3}</div>}</div></div>);
                        })}
                    </div>
                </div>

                {/* BOTTOM: CD + Workload + Activity */}
                <div className={s.bottom3}>
                    <div className={s.panel}><div className={s.panelTitle}>🎯 {lang === 'ar' ? 'يحتاج اهتمامك' : 'Needs Attention'}</div>{cdItems.length === 0 && <div className={s.emptyMsg}>✅ {lang === 'ar' ? 'لا مشاكل' : 'No issues'}</div>}{cdItems.slice(0, 5).map(r => { const cl = store.getClient(r.clientId); const sm = STAGE_META[r.status]; return (<Link href={`/creative/client/${r.clientId}`} key={r.requestId} className={s.cdItem}><span>{r.blocked ? '⛔' : '🔍'}</span><div><div className={s.cdTitle}>{cl?.avatar} {r.title}</div><div className={s.cdSub}>{lang === 'ar' ? sm.ar : sm.en} • {lang === 'ar' ? sm.owner_ar : sm.owner_en}</div></div></Link>); })}</div>
                    <div className={s.panel}><div className={s.panelTitle}>📊 {lang === 'ar' ? 'توزيع العمل' : 'Workload'}</div>{workload.map(m => (<div key={m.id} className={s.wlItem}><div className={s.wlAv} style={{ background: m.color }}>{m.avatar}</div><div className={s.wlName}>{lang === 'ar' ? m.name : m.nameEn} <span className={s.wlRole}>({lang === 'ar' ? m.role : m.roleEn})</span></div><div className={s.wlBar}><div className={s.wlFill} style={{ width: `${Math.min(m.count * 20, 100)}%`, background: m.count > 4 ? '#ef4444' : m.count > 2 ? '#f59e0b' : '#22c55e' }} /></div><div className={s.wlCount} style={{ color: m.count > 4 ? '#ef4444' : m.count > 2 ? '#f59e0b' : '#22c55e' }}>{m.count}</div></div>))}</div>
                    <div className={s.panel}><div className={s.panelTitle}>⚡ {lang === 'ar' ? 'آخر النشاطات' : 'Activity'}</div>{store.activities.map(a => (<div key={a.id} className={`${s.actItem} ${a.type === 'warning' ? s.actW : a.type === 'success' ? s.actS : ''}`}><span>{a.icon}</span><span className={s.actText}>{lang === 'ar' ? a.text : a.textEn}</span><span className={s.actTime}>{a.time}</span></div>))}</div>
                </div>

                {/* ASSETS INDEX */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>📁 {lang === 'ar' ? 'فهرس الملفات' : 'Assets Index'}</div><div className={s.secCount}>{filteredAssets.length}</div><div className={s.secLine} /></div>
                <input className={s.assetSearch} placeholder={lang === 'ar' ? 'ابحث...' : 'Search...'} value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
                <div className={s.assetGrid}>{filteredAssets.map(a => { const cl = store.getClient(a.clientId); return (<div key={a.id} className={s.assetCard}><div className={s.assetIcon}>{(ASSET_LABELS[a.category] || '📎').split(' ')[0]}</div><div className={s.assetInfo}><div className={s.assetName}>{a.name}</div><div className={s.assetDesc}>{cl?.avatar} {cl?.name} • {a.description}</div></div>{a.approved && <span>✅</span>}<Link href={`/creative/client/${a.clientId}`} className={s.assetLink}>→</Link></div>); })}</div>
            </main>
        </div>
    );
}
