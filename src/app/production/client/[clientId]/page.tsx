'use client';
import { useState, useSyncExternalStore, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import s from './page.module.css';
import { getProductionStore, PROD_STAGES, PROD_STAGE_META, JOB_CAT_AR, JOB_CAT_EN, JOB_CAT_ICON, PROD_TEAM, type ProdStage } from '@/lib/productionStore';
import { getCreativeStore } from '@/lib/creativeStore';
import { useSettings } from '@/lib/useSettings';

export default function ClientProductionWorkspace() {
    const params = useParams();
    const clientId = params.clientId as string;
    const store = getProductionStore();
    const cStore = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    useSyncExternalStore(cb => cStore.subscribe(cb), () => cStore.getVersion(), () => 0);

    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const [tab, setTab] = useState('overview');
    const [toast, setToast] = useState('');

    useEffect(() => { const t = store.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [ver, store]);

    const ar = lang === 'ar';
    const client = cStore.getClient(clientId);
    const clientName = client?.name || clientId;
    const campaigns = store.getClientCampaigns(clientId);
    const jobs = store.getClientJobs(clientId);
    const calendar = store.getClientCalendar(clientId);
    const activities = store.getClientActivities(clientId);
    const media = store.getClientMedia(clientId);
    const catL = ar ? JOB_CAT_AR : JOB_CAT_EN;

    const now = new Date(); const cY = now.getFullYear(); const cM = now.getMonth();
    const dim = new Date(cY, cM + 1, 0).getDate(); const fdw = new Date(cY, cM, 1).getDay();
    const dn = ar ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const evDay = (day: number) => { const ds = `${cY}-${String(cM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return calendar.filter(e => e.date === ds); };

    const tabs = [
        { id: 'overview', label: ar ? '📊 نظرة عامة' : '📊 Overview' },
        { id: 'campaigns', label: ar ? '🎬 الحملات' : '🎬 Campaigns' },
        { id: 'jobs', label: ar ? '📌 المهام' : '📌 Jobs' },
        { id: 'storyboards', label: ar ? '📋 ستوري بورد' : '📋 Storyboards' },
        { id: 'calendar', label: ar ? '📅 التقويم' : '📅 Calendar' },
        { id: 'media', label: ar ? '📁 المكتبة' : '📁 Media' },
        { id: 'activity', label: ar ? '📢 النشاط' : '📢 Activity' },
        { id: 'exports', label: ar ? '📦 التصدير' : '📦 Exports' },
    ];

    return (
        <div className={s.workspace} dir="rtl">
            <header className={s.header}>
                <div className={s.headerRight}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.boardDot} />
                    <h1 className={s.clientName}>{clientName} — {ar ? 'مساحة الإنتاج' : 'Production'}</h1>
                </div>
                <div className={s.headerLeft}>
                    <Link href="/production" className={s.backBtn}>← {ar ? 'العودة' : 'Back'}</Link>
                    <button className={s.iconBtn} onClick={toggleTheme}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg></button>
                    <button className={s.iconBtn} onClick={toggleLang}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></button>
                    <div className={s.headerDivider} />
                    <div className={s.navSwitcher}>
                        <Link href="/" className={s.navInactive}>📋 {ar ? 'التسويق' : 'Marketing'}</Link>
                        <Link href={`/creative/client/${clientId}`} className={s.navInactive}>🎨 {ar ? 'الإبداعي' : 'Creative'}</Link>
                        <span className={s.navActive}>🎬 {ar ? 'الإنتاج' : 'Production'}</span>
                    </div>
                </div>
            </header>

            <main className={s.content}>
                <div className={s.tabs}>
                    {tabs.map(t => <button key={t.id} className={tab === t.id ? s.tabActive : s.tab} onClick={() => setTab(t.id)}>{t.label}</button>)}
                </div>

                {/* ═══ OVERVIEW TAB ═══ */}
                {tab === 'overview' && <>
                    <div className={s.linkedContext}>
                        <span className={s.linkedLabel}>{ar ? 'التنقل:' : 'Navigate:'}</span>
                        <Link href="/production" className={s.linkedLink}>🎬 {ar ? 'مقر الإنتاج' : 'Production HQ'}</Link>
                        {campaigns.map(c => <Link key={c.campaignId} href={`/production/campaign/${c.campaignId}`} className={s.linkedLink}>📦 {c.name}</Link>)}
                    </div>
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'ملخص الإنتاج' : 'Production Summary'}</span><div className={s.sectionLine} /></div>
                    <div className={s.grid}>
                        <div className={s.card}><div className={s.cardTitle}>{campaigns.length}</div><div className={s.cardMeta}>{ar ? 'حملة' : 'Campaigns'}</div></div>
                        <div className={s.card}><div className={s.cardTitle}>{jobs.length}</div><div className={s.cardMeta}>{ar ? 'مهمة إنتاج' : 'Production Jobs'}</div></div>
                        <div className={s.card}><div className={s.cardTitle}>{jobs.filter(j => j.stage === 'delivered').length}/{jobs.length}</div><div className={s.cardMeta}>{ar ? 'مكتمل' : 'Completed'}</div></div>
                        <div className={s.card}><div className={s.cardTitle}>{jobs.filter(j => j.blocked).length}</div><div className={s.cardMeta}>{ar ? 'محظور' : 'Blocked'}</div></div>
                    </div>
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'آخر المهام' : 'Recent Jobs'}</span><div className={s.sectionLine} /></div>
                    <div className={s.list}>
                        {jobs.slice(0, 5).map(j => (
                            <div key={j.productionJobId} className={s.card}>
                                <div className={s.cardTitle}>{JOB_CAT_ICON[j.category]} {j.title}</div>
                                <span className={s.badge} style={{ borderColor: PROD_STAGE_META[j.stage].color, color: PROD_STAGE_META[j.stage].color }}>{ar ? PROD_STAGE_META[j.stage].ar : PROD_STAGE_META[j.stage].en}</span>
                                <div className={s.approvalRow}>
                                    <span className={`${s.approvalBadge} ${j.cdPrelimApproval ? s.approvalOk : s.approvalPending}`}>{j.cdPrelimApproval ? '✅' : '⏳'} CD</span>
                                    <span className={`${s.approvalBadge} ${j.amFinalApproval ? s.approvalOk : s.approvalPending}`}>{j.amFinalApproval ? '✅' : '⏳'} AM</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>}

                {/* ═══ CAMPAIGNS TAB ═══ */}
                {tab === 'campaigns' && <>
                    <div className={s.grid}>
                        {campaigns.length === 0 && <div className={s.emptyState}>{ar ? 'لا توجد حملات بعد' : 'No campaigns yet'}</div>}
                        {campaigns.map(c => {
                            const cJobs = store.getCampaignJobs(c.campaignId);
                            return (
                                <div key={c.campaignId} className={s.card}>
                                    <div className={s.cardTitle}>📦 {c.name}</div>
                                    <div className={s.cardMeta}>{c.objective}</div>
                                    <div style={{ marginTop: 6 }}>
                                        <span className={s.badge}>📦 {c.deliverablesList.length} {ar ? 'مخرج' : 'deliverables'}</span>
                                        <span className={s.badge}>🎬 {cJobs.length} {ar ? 'مهمة' : 'jobs'}</span>
                                    </div>
                                    <div className={s.approvalRow}>
                                        <span className={`${s.approvalBadge} ${c.cdApproval ? s.approvalOk : s.approvalPending}`}>{c.cdApproval ? '✅' : '⏳'} CD</span>
                                        <span className={`${s.approvalBadge} ${c.amApproval ? s.approvalOk : s.approvalPending}`}>{c.amApproval ? '✅' : '⏳'} AM</span>
                                    </div>
                                    <div className={s.progress}><div className={s.progressFill} style={{ width: `${c.progress}%` }} /></div>
                                    {c.milestones.map((m, i) => <div key={i} className={s.badge} style={{ marginTop: 4 }}>{m.done ? '✅' : '⏳'} {m.label} — {m.date}</div>)}
                                </div>
                            );
                        })}
                    </div>
                </>}

                {/* ═══ JOBS TAB ═══ */}
                {tab === 'jobs' && <>
                    <div className={s.list}>
                        {jobs.map(j => (
                            <div key={j.productionJobId} className={s.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className={s.cardTitle}>{JOB_CAT_ICON[j.category]} {j.title}</div>
                                    <span className={s.badge} style={{ borderColor: PROD_STAGE_META[j.stage].color, color: PROD_STAGE_META[j.stage].color }}>{ar ? PROD_STAGE_META[j.stage].ar : PROD_STAGE_META[j.stage].en}</span>
                                </div>
                                <div className={s.cardMeta}>{catL[j.category]} • {j.platform} • {j.owner} • {j.deadline}</div>
                                <div className={s.approvalRow}>
                                    <span className={`${s.approvalBadge} ${j.cdPrelimApproval ? s.approvalOk : s.approvalPending}`}>{j.cdPrelimApproval ? '✅' : '⏳'} {ar ? 'المدير الإبداعي' : 'CD'}</span>
                                    <span className={`${s.approvalBadge} ${j.amFinalApproval ? s.approvalOk : s.approvalPending}`}>{j.amFinalApproval ? '✅' : '⏳'} {ar ? 'مدير الحسابات' : 'AM'}</span>
                                    {j.blocked && <span className={`${s.badge} ${s.badgeRed}`}>⛔ {j.blockReason}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                    {PROD_STAGES.slice(0, 6).map(st => (
                                        <button key={st} className={s.actionBtn} style={j.stage === st ? { background: PROD_STAGE_META[st].color, color: 'white', borderColor: 'transparent' } : undefined} onClick={() => store.moveJobToStage(j.productionJobId, st, lang)}>
                                            {ar ? PROD_STAGE_META[st].ar : PROD_STAGE_META[st].en}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>}

                {/* ═══ STORYBOARDS TAB ═══ */}
                {tab === 'storyboards' && <>
                    {store.storyboards.filter(sb => {
                        if (sb.parentType === 'job') return jobs.some(j => j.productionJobId === sb.parentId);
                        return campaigns.some(c => c.campaignId === sb.parentId);
                    }).map(sb => (
                        <div key={sb.storyboardId} style={{ marginBottom: 16 }}>
                            <div className={s.sectionHeader}><span className={s.sectionTitle}>📋 {sb.title} {sb.generatedByAI && <span style={{ fontSize: 12, color: '#8b5cf6' }}>🤖</span>}</span><span className={s.sectionCount}>V{sb.version} • {sb.scenes.length} {ar ? 'مشهد' : 'scenes'}</span></div>
                            <div className={s.list}>
                                {sb.scenes.map(sc => (
                                    <div key={sc.sceneId} className={s.sbScene}>
                                        <div className={s.sbSceneNum}>{ar ? 'مشهد' : 'Scene'} {sc.order} — {sc.durationSec}s</div>
                                        <div className={s.sbSceneObj}>{sc.objective}</div>
                                        <div className={s.sbSceneNotes}>🎥 {sc.visualNotes} | 📷 {sc.cameraNotes} | {sc.shotType}</div>
                                        {sc.audioNotes && <div className={s.sbSceneNotes}>🔊 {sc.audioNotes}</div>}
                                        {sc.locationNotes && <div className={s.sbSceneNotes}>📍 {sc.locationNotes}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {store.storyboards.filter(sb => sb.parentType === 'job' ? jobs.some(j => j.productionJobId === sb.parentId) : campaigns.some(c => c.campaignId === sb.parentId)).length === 0 && <div className={s.emptyState}>{ar ? 'لا يوجد ستوري بورد بعد' : 'No storyboards yet'}</div>}
                </>}

                {/* ═══ CALENDAR TAB ═══ */}
                {tab === 'calendar' && <>
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>{now.toLocaleDateString(ar ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}</span><div className={s.sectionLine} /></div>
                    <div className={s.calGrid}>
                        {dn.map(d => <div key={d} className={s.calHeader}>{d}</div>)}
                        {Array.from({ length: fdw }).map((_, i) => <div key={`e${i}`} className={s.calEmpty} />)}
                        {Array.from({ length: dim }).map((_, i) => {
                            const day = i + 1; const evts = evDay(day);
                            return (<div key={day} className={s.calDay}><div className={s.calDayNum}>{day}</div>{evts.map(ev => <div key={ev.id} className={s.calEvent} style={{ background: ev.color }}>{ev.title}</div>)}</div>);
                        })}
                    </div>
                </>}

                {/* ═══ MEDIA TAB ═══ */}
                {tab === 'media' && <>
                    <div className={s.list}>
                        {media.length === 0 && <div className={s.emptyState}>{ar ? 'لا توجد ملفات بعد' : 'No media files yet'}</div>}
                        {media.map(f => (
                            <div key={f.fileId} className={s.mediaItem}>
                                <span style={{ fontSize: 18 }}>📁</span>
                                <span className={s.mediaName}>{f.name}</span>
                                <span className={s.badge}>{f.type}</span>
                                <span className={s.mediaSize}>{f.size}</span>
                                <span className={s.badge}>V{f.version}</span>
                                <span className={s.cardMeta}>{f.uploadedBy}</span>
                            </div>
                        ))}
                    </div>
                </>}

                {/* ═══ ACTIVITY TAB ═══ */}
                {tab === 'activity' && <>
                    <div className={s.list}>
                        {activities.length === 0 && <div className={s.emptyState}>{ar ? 'لا يوجد نشاط' : 'No activity'}</div>}
                        {activities.map(a => (
                            <div key={a.id} className={s.activityItem}>
                                <span style={{ fontSize: 18 }}>{a.icon}</span>
                                <span className={s.activityText}>{ar ? a.text : a.textEn}</span>
                                <span className={s.activityTime}>{a.time}</span>
                            </div>
                        ))}
                    </div>
                </>}

                {/* ═══ EXPORTS TAB ═══ */}
                {tab === 'exports' && <>
                    <div className={s.grid}>
                        <div className={s.card} onClick={() => { const report = store.exportMonthlyReport(lang); const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `production_report_${clientName}.json`; a.click(); }}>
                            <div className={s.cardTitle}>📊 {ar ? 'تقرير شهري' : 'Monthly Report'}</div>
                            <div className={s.cardMeta}>{ar ? 'تصدير تقرير الإنتاج الشهري' : 'Export monthly production report'}</div>
                        </div>
                        {campaigns.map(c => (
                            <div key={c.campaignId} className={s.card} onClick={() => { const pkg = store.exportCampaignPackage(c.campaignId); if (pkg) { const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${c.name}_package.json`; a.click(); } }}>
                                <div className={s.cardTitle}>📦 {c.name}</div>
                                <div className={s.cardMeta}>{ar ? 'تصدير حزمة الحملة' : 'Export campaign package'}</div>
                            </div>
                        ))}
                        {jobs.map(j => (
                            <div key={j.productionJobId} className={s.card} onClick={() => { const pkg = store.exportJobPackage(j.productionJobId); if (pkg) { const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${j.title}_package.json`; a.click(); } }}>
                                <div className={s.cardTitle}>{JOB_CAT_ICON[j.category]} {j.title}</div>
                                <div className={s.cardMeta}>{ar ? 'تصدير حزمة المهمة' : 'Export job package'}</div>
                            </div>
                        ))}
                    </div>
                </>}
            </main>

            {toast && <div className={s.toast}>{toast}</div>}
        </div>
    );
}
