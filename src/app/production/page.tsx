'use client';
import { useState, useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { getProductionStore, PROD_STAGES, PROD_STAGE_META, JOB_CAT_AR, JOB_CAT_EN, JOB_CAT_ICON, PROD_TEAM, type ProdStage, type Campaign, type ProductionJob } from '@/lib/productionStore';
import { getCreativeStore } from '@/lib/creativeStore';
import { useSettings } from '@/lib/useSettings';

export default function ProductionHQ() {
    const store = getProductionStore();
    const cStore = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    useSyncExternalStore(cb => cStore.subscribe(cb), () => cStore.getVersion(), () => 0);

    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const [toast, setToast] = useState('');
    const [showNewJob, setShowNewJob] = useState(false);
    const [selectedJob, setSelectedJob] = useState<string | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const [showStoryboard, setShowStoryboard] = useState<string | null>(null);

    const [newJob, setNewJob] = useState({ title: '', clientId: 'client_warda', campaignId: '', category: 'reel_filming' as any, platform: 'Instagram', owner: 'عمر', deadline: '', linkedCreativeRequestId: '' });
    const [uploadName, setUploadName] = useState('');
    const [versionLabel, setVersionLabel] = useState('');

    useEffect(() => { const t = store.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [ver, store]);

    const clients = cStore.clients;
    const kpis = store.getKPIs();
    const ar = lang === 'ar';
    const catL = ar ? JOB_CAT_AR : JOB_CAT_EN;

    // Calendar helpers
    const now = new Date(); const cY = now.getFullYear(); const cM = now.getMonth();
    const dim = new Date(cY, cM + 1, 0).getDate(); const fdw = new Date(cY, cM, 1).getDay();
    const dn = ar ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const evDay = (day: number) => { const ds = `${cY}-${String(cM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return store.calendarEvents.filter(e => e.date === ds); };

    // Workload
    const workload = PROD_TEAM.map(m => { const items = store.jobs.filter(j => j.stage !== 'delivered' && (j.assignedTeam.includes(m.name) || j.assignedTeam.includes(m.nameEn))); return { ...m, count: items.length }; });
    const maxLoad = Math.max(...workload.map(w => w.count), 1);

    // Client name helper
    const cn = (id: string) => clients.find(c => c.clientId === id)?.name || id;

    const sJob = selectedJob ? store.getJob(selectedJob) : null;
    const sCamp = selectedCampaign ? store.getCampaign(selectedCampaign) : null;
    const sSb = showStoryboard ? store.getStoryboard(showStoryboard) : null;



    // Create job handler
    const handleCreateJob = () => {
        store.createJob({ title: newJob.title, clientId: newJob.clientId, campaignId: newJob.campaignId || undefined, linkedMarketingTaskId: '', linkedCreativeRequestId: newJob.linkedCreativeRequestId, category: newJob.category, platform: newJob.platform, deliverableType: '', objective: '', approvedConceptSummary: '', shotList: [], location: '', talent: [], equipmentNotes: '', deadline: newJob.deadline, owner: newJob.owner, assignedTeam: [newJob.owner], stage: 'awaiting_concept', cdPrelimApproval: false, amFinalApproval: false, blocked: false, blockReason: '', finalDeliverable: undefined, exportPackage: undefined, storyboardId: undefined }, lang);
        setShowNewJob(false);
        setNewJob({ title: '', clientId: 'client_warda', campaignId: '', category: 'reel_filming', platform: 'Instagram', owner: 'عمر', deadline: '', linkedCreativeRequestId: '' });
    };

    return (
        <div className={s.board} dir="rtl">
            {/* ── Header ── */}
            <header className={s.header}>
                <div className={s.headerRight}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.boardTitle}><div className={s.boardDot} /><h1 className={s.boardName}>{ar ? 'الإنتاج' : 'Production'}</h1></div>
                </div>
                <div className={s.headerLeft}>
                    <button className={s.iconBtn} onClick={toggleTheme}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg></button>
                    <button className={s.iconBtn} onClick={toggleLang}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></button>
                    <div className={s.userAvatar}>م.خ</div>
                    <div className={s.headerDivider} />
                    <div className={s.navSwitcher}>
                        <Link href="/" className={s.navInactive}>📋 {ar ? 'التسويق' : 'Marketing'}</Link>
                        <Link href="/creative" className={s.navInactive}>🎨 {ar ? 'الإبداعي' : 'Creative'}</Link>
                        <span className={s.navActive}>🎬 {ar ? 'الإنتاج' : 'Production'}</span>
                        <Link href="/publishing" className={s.navInactive}>📢 {ar ? 'النشر' : 'Publishing'}</Link>
                    </div>
                </div>
            </header>

            <main className={s.content}>
                {/* ── KPIs ── */}
                <div className={s.kpiGrid}>
                    {[
                        { v: kpis.activeJobs, l: ar ? 'مهام نشطة' : 'Active Jobs' },
                        { v: kpis.scheduledShoots, l: ar ? 'تصوير مجدول' : 'Scheduled' },
                        { v: kpis.editing, l: ar ? 'مونتاج' : 'Editing' },
                        { v: kpis.blocked, l: ar ? 'محظور' : 'Blocked' },
                        { v: kpis.awaitingApprovals, l: ar ? 'بانتظار موافقة' : 'Awaiting Approval' },
                        { v: kpis.readyForDelivery, l: ar ? 'جاهز للتسليم' : 'Ready' },
                        { v: kpis.overdue, l: ar ? 'متأخر' : 'Overdue' },
                        { v: `${kpis.onTimeRate}%`, l: ar ? 'معدل التسليم' : 'On-time Rate' },
                    ].map((k, i) => (
                        <div key={i} className={s.kpiCard}><div className={s.kpiValue}>{k.v}</div><div className={s.kpiLabel}>{k.l}</div></div>
                    ))}
                </div>

                {/* ── Campaigns ── */}
                <div className={s.sectionHeader}>
                    <span className={s.sectionTitle}>🎬 {ar ? 'الحملات' : 'Campaigns'}</span>
                    <div className={s.sectionLine} />
                    <span className={s.sectionCount}>{store.campaigns.length} {ar ? 'حملة' : 'campaigns'}</span>
                </div>
                <div className={s.campaignGrid}>
                    {store.campaigns.map(c => {
                        const cJobs = store.getCampaignJobs(c.campaignId);
                        const doneJobs = cJobs.filter(j => j.stage === 'delivered').length;
                        return (
                            <div key={c.campaignId} className={s.campaignCard} onClick={() => setSelectedCampaign(c.campaignId)}>
                                <div className={s.campHeader}>
                                    <div><div className={s.campName}>{c.name}</div><div className={s.campClient}>{cn(c.clientId)}</div></div>
                                    <span className={`${s.campBadge} ${c.status === 'complete' ? s.campBadgeGreen : c.status === 'in_production' ? s.campBadgeYellow : s.campBadgePurple}`}>{ar ? (c.status === 'planning' ? 'تخطيط' : c.status === 'in_production' ? 'إنتاج' : c.status === 'review' ? 'مراجعة' : 'مكتمل') : c.status}</span>
                                </div>
                                <div className={s.campBadges}>
                                    <span className={s.campBadge}>📦 {c.deliverablesList.length} {ar ? 'مخرج' : 'deliverables'}</span>
                                    <span className={s.campBadge}>🎬 {cJobs.length} {ar ? 'مهمة' : 'jobs'}</span>
                                    <span className={s.campBadge}>✅ {doneJobs}/{cJobs.length}</span>
                                    {c.storyboardId && <span className={`${s.campBadge} ${s.campBadgePurple}`}>📋 {ar ? 'ستوري بورد' : 'Storyboard'}</span>}
                                </div>
                                <div className={s.approvalRow}>
                                    <span className={`${s.approvalBadge} ${c.cdApproval ? s.approvalOk : s.approvalPending}`}>{c.cdApproval ? '✅' : '⏳'} {ar ? 'المدير الإبداعي' : 'CD'}</span>
                                    <span className={`${s.approvalBadge} ${c.amApproval ? s.approvalOk : s.approvalPending}`}>{c.amApproval ? '✅' : '⏳'} {ar ? 'مدير الحسابات' : 'AM'}</span>
                                </div>
                                <div className={s.campProgress}><div className={s.campProgressFill} style={{ width: `${c.progress}%` }} /></div>
                            </div>
                        );
                    })}
                </div>

                {/* ── New Job Button ── */}
                <div className={s.sectionHeader}>
                    <span className={s.sectionTitle}>📌 {ar ? 'مهام الإنتاج' : 'Production Jobs'}</span>
                    <div className={s.sectionLine} />
                    <span className={s.sectionCount}>{store.jobs.length} {ar ? 'مهمة' : 'jobs'}</span>
                    <button className={s.btnPrimary} onClick={() => setShowNewJob(true)}>+ {ar ? 'مهمة جديدة' : 'New Job'}</button>
                </div>

                {/* ── Pipeline ── */}
                <div className={s.pipelineCols}>
                    {PROD_STAGES.map(stage => {
                        const sm = PROD_STAGE_META[stage];
                        const stageJobs = store.jobs.filter(j => j.stage === stage);
                        return (
                            <div key={stage} className={s.pipelineCol}>
                                <div className={s.pipelineColHeader}>
                                    <div className={s.pipelineColDot} style={{ background: sm.color }} />
                                    <span>{ar ? sm.ar : sm.en}</span>
                                    <span className={s.pipelineColCount}>{stageJobs.length}</span>
                                </div>
                                {stageJobs.map(j => (
                                    <div key={j.productionJobId} className={s.pipelineJobCard} onClick={() => setSelectedJob(j.productionJobId)} style={j.blocked ? { borderColor: 'rgba(220,38,38,.4)' } : undefined}>
                                        <div className={s.pipelineJobTitle}>{JOB_CAT_ICON[j.category]} {j.title}</div>
                                        <div className={s.pipelineJobMeta}>{cn(j.clientId)} • {ar ? catL[j.category] : catL[j.category]}</div>
                                        {j.blocked && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>⛔ {j.blockReason}</div>}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* ── Calendar ── */}
                <div className={s.sectionHeader}>
                    <span className={s.sectionTitle}>📅 {ar ? 'تقويم الإنتاج' : 'Production Calendar'}</span>
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
                                {evts.map(ev => <div key={ev.id} className={s.calEvent} style={{ background: ev.color }}>{ev.title}</div>)}
                            </div>
                        );
                    })}
                </div>

                {/* ── Team Workload ── */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>👥 {ar ? 'حمل الفريق' : 'Team Workload'}</span><div className={s.sectionLine} /></div>
                <div className={s.teamGrid}>
                    {workload.map(m => (
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

                {/* ── Activity Feed ── */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>📢 {ar ? 'آخر الأحداث' : 'Activity Feed'}</span><div className={s.sectionLine} /></div>
                <div className={s.activityList}>
                    {store.activities.slice(0, 10).map(a => (
                        <div key={a.id} className={s.activityItem}>
                            <span className={s.activityIcon}>{a.icon}</span>
                            <span className={s.activityText}>{ar ? a.text : a.textEn}</span>
                            <span className={s.activityTime}>{a.time}</span>
                        </div>
                    ))}
                </div>

                {/* ── Alerts ── */}
                {store.jobs.filter(j => j.blocked).length > 0 && <>
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>🚨 {ar ? 'تنبيهات' : 'Alerts'}</span><div className={s.sectionLine} /></div>
                    {store.jobs.filter(j => j.blocked).map(j => (
                        <div key={j.productionJobId} className={s.alertCard}>
                            <span className={s.alertIcon}>⛔</span>
                            <span style={{ flex: 1 }}>{j.title} — {j.blockReason}</span>
                            <button className={s.actionBtn} onClick={() => { store.unblock(j.productionJobId, lang); }}>✅ {ar ? 'رفع الحظر' : 'Unblock'}</button>
                        </div>
                    ))}
                </>}
            </main>

            {/* ═══ JOB DETAIL DRAWER ═══ */}
            {sJob && (
                <div className={s.modalOverlay} onClick={() => setSelectedJob(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <button className={s.drawerClose} onClick={() => setSelectedJob(null)}>✕</button>
                        <div className={s.drawerTitle}>{JOB_CAT_ICON[sJob.category]} {sJob.title}</div>
                        <div className={s.campBadges}>
                            <span className={s.campBadge} style={{ borderColor: PROD_STAGE_META[sJob.stage].color, color: PROD_STAGE_META[sJob.stage].color }}>{ar ? PROD_STAGE_META[sJob.stage].ar : PROD_STAGE_META[sJob.stage].en}</span>
                            <span className={s.campBadge}>{cn(sJob.clientId)}</span>
                            {sJob.campaignId && <span className={`${s.campBadge} ${s.campBadgePurple}`}>📦 {store.getCampaign(sJob.campaignId)?.name}</span>}
                            {sJob.blocked && <span className={`${s.campBadge} ${s.campBadgeRed}`}>⛔ {ar ? 'محظور' : 'Blocked'}</span>}
                        </div>

                        {/* Approval Prerequisites */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'شروط الموافقة المسبقة' : 'Approval Prerequisites'}</div>
                            <div className={s.approvalRow}>
                                <span className={`${s.approvalBadge} ${sJob.cdPrelimApproval ? s.approvalOk : s.approvalPending}`}>{sJob.cdPrelimApproval ? '✅' : '⏳'} {ar ? 'الموافقة المبدئية — المدير الإبداعي' : 'Preliminary — Creative Director'}</span>
                                <span className={`${s.approvalBadge} ${sJob.amFinalApproval ? s.approvalOk : s.approvalPending}`}>{sJob.amFinalApproval ? '✅' : '⏳'} {ar ? 'الموافقة النهائية — مدير الحسابات' : 'Final — Account Manager'}</span>
                            </div>
                            {(!sJob.cdPrelimApproval || !sJob.amFinalApproval) && <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>⛔ {ar ? 'لا يمكن المتابعة حتى اكتمال الموافقات المسبقة' : 'Cannot proceed until prerequisite approvals are complete'}</div>}
                        </div>

                        {/* Info */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'التفاصيل' : 'Details'}</div>
                            <div style={{ fontSize: 13 }}>
                                <div><strong>{ar ? 'النوع:' : 'Category:'}</strong> {catL[sJob.category]}</div>
                                <div><strong>{ar ? 'المنصة:' : 'Platform:'}</strong> {sJob.platform}</div>
                                <div><strong>{ar ? 'الموعد:' : 'Deadline:'}</strong> {sJob.deadline}</div>
                                <div><strong>{ar ? 'المسؤول:' : 'Owner:'}</strong> {sJob.owner}</div>
                                <div><strong>{ar ? 'الفريق:' : 'Team:'}</strong> {sJob.assignedTeam.join(', ')}</div>
                                {sJob.location && <div><strong>{ar ? 'الموقع:' : 'Location:'}</strong> {sJob.location}</div>}
                                {sJob.approvedConceptSummary && <div><strong>{ar ? 'الفكرة المعتمدة:' : 'Concept:'}</strong> {sJob.approvedConceptSummary}</div>}
                            </div>
                        </div>

                        {/* Stage Actions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'تغيير المرحلة' : 'Change Stage'}</div>
                            <div className={s.actionRow}>
                                {PROD_STAGES.map(st => (
                                    <button key={st} className={`${s.actionBtn} ${sJob.stage === st ? s.btnPrimary : ''} ${(!sJob.cdPrelimApproval && st !== 'awaiting_concept') ? s.disabledBtn : ''}`} onClick={() => store.moveJobToStage(sJob.productionJobId, st, lang)} style={sJob.stage === st ? { background: PROD_STAGE_META[st].color, color: 'white', borderColor: 'transparent' } : undefined}>
                                        {ar ? PROD_STAGE_META[st].ar : PROD_STAGE_META[st].en}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Storyboard */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'ستوري بورد' : 'Storyboard'}</div>
                            {sJob.storyboardId ? (
                                <button className={s.actionBtn} onClick={() => setShowStoryboard(sJob.storyboardId!)}>📋 {ar ? 'عرض الستوري بورد' : 'View Storyboard'}</button>
                            ) : (
                                <button className={s.actionBtn} onClick={() => { const sb = store.generateAIStoryboard('job', sJob.productionJobId, sJob.title, lang); setShowStoryboard(sb.storyboardId); }}>🤖 {ar ? 'إنشاء ستوري بورد بالذكاء الاصطناعي' : 'Generate AI Storyboard'}</button>
                            )}
                        </div>

                        {/* Media */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'الملفات' : 'Media Files'}</div>
                            <div className={s.mediaList}>
                                {store.getJobMedia(sJob.productionJobId).map(f => (
                                    <div key={f.fileId} className={s.mediaItem}>
                                        <span className={s.mediaIcon}>📁</span>
                                        <span className={s.mediaName}>{f.name}</span>
                                        <span className={s.mediaSize}>{f.size}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <input className={s.modalInput} style={{ flex: 1 }} placeholder={ar ? 'اسم الملف...' : 'File name...'} value={uploadName} onChange={e => setUploadName(e.target.value)} />
                                <button className={s.actionBtn} onClick={() => { if (uploadName.trim()) { store.uploadMedia(sJob.productionJobId, uploadName, 'footage', sJob.owner, lang); setUploadName(''); } }}>📤 {ar ? 'رفع' : 'Upload'}</button>
                            </div>
                        </div>

                        {/* Versions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'النسخ' : 'Versions'}</div>
                            <div className={s.versionList}>
                                {sJob.editVersions.map(v => (
                                    <div key={v.v} className={s.versionItem}>
                                        <span className={s.versionLabel}>V{v.v} — {v.label}</span>
                                        <span className={s.versionDate}>{v.date} • {v.notes}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <input className={s.modalInput} style={{ flex: 1 }} placeholder={ar ? 'اسم النسخة...' : 'Version label...'} value={versionLabel} onChange={e => setVersionLabel(e.target.value)} />
                                <button className={s.actionBtn} onClick={() => { if (versionLabel.trim()) { store.addVersion(sJob.productionJobId, versionLabel, '', lang); setVersionLabel(''); } }}>🔄 {ar ? 'إضافة' : 'Add'}</button>
                            </div>
                        </div>

                        {/* Export & Navigation */}
                        <div className={s.drawerSection}>
                            <div className={s.actionRow}>
                                <button className={s.actionBtn} onClick={() => { const pkg = store.exportJobPackage(sJob.productionJobId); if (pkg) { const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${sJob.title}_package.json`; a.click(); } }}>📦 {ar ? 'تصدير حزمة المهمة' : 'Export Job Package'}</button>
                                <Link href={`/production/client/${sJob.clientId}`} className={s.actionBtn}>👤 {ar ? 'مساحة العميل' : 'Client Workspace'}</Link>
                                {sJob.campaignId && <Link href={`/production/campaign/${sJob.campaignId}`} className={s.actionBtn}>📦 {ar ? 'مساحة الحملة' : 'Campaign Workspace'}</Link>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CAMPAIGN DETAIL ═══ */}
            {sCamp && !sJob && (
                <div className={s.modalOverlay} onClick={() => setSelectedCampaign(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <button className={s.drawerClose} onClick={() => setSelectedCampaign(null)}>✕</button>
                        <div className={s.drawerTitle}>📦 {sCamp.name}</div>
                        <div className={s.campBadges}>
                            <span className={s.campBadge}>{cn(sCamp.clientId)}</span>
                            <span className={s.campBadge}>🎯 {sCamp.objective}</span>
                        </div>
                        <div className={s.approvalRow}>
                            <span className={`${s.approvalBadge} ${sCamp.cdApproval ? s.approvalOk : s.approvalPending}`}>{sCamp.cdApproval ? '✅' : '⏳'} {ar ? 'المدير الإبداعي' : 'CD'}</span>
                            <span className={`${s.approvalBadge} ${sCamp.amApproval ? s.approvalOk : s.approvalPending}`}>{sCamp.amApproval ? '✅' : '⏳'} {ar ? 'مدير الحسابات' : 'AM'}</span>
                        </div>
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'المخرجات' : 'Deliverables'}</div>
                            {sCamp.deliverablesList.map((d, i) => <div key={i} className={s.campBadge} style={{ display: 'inline-block', marginLeft: 4, marginTop: 4 }}>📌 {d}</div>)}
                        </div>
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'مهام الإنتاج' : 'Production Jobs'}</div>
                            {store.getCampaignJobs(sCamp.campaignId).map(j => (
                                <div key={j.productionJobId} className={s.pipelineJobCard} onClick={() => { setSelectedJob(j.productionJobId); }}>
                                    <div className={s.pipelineJobTitle}>{JOB_CAT_ICON[j.category]} {j.title}</div>
                                    <div className={s.pipelineJobMeta} style={{ color: PROD_STAGE_META[j.stage].color }}>{ar ? PROD_STAGE_META[j.stage].ar : PROD_STAGE_META[j.stage].en}</div>
                                </div>
                            ))}
                        </div>
                        {/* Storyboard */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'ستوري بورد الحملة' : 'Campaign Storyboard'}</div>
                            {sCamp.storyboardId ? (
                                <button className={s.actionBtn} onClick={() => setShowStoryboard(sCamp.storyboardId!)}>📋 {ar ? 'عرض' : 'View'}</button>
                            ) : (
                                <button className={s.actionBtn} onClick={() => { const sb = store.generateAIStoryboard('campaign', sCamp.campaignId, sCamp.name, lang); setShowStoryboard(sb.storyboardId); }}>🤖 {ar ? 'إنشاء ستوري بورد AI' : 'Generate AI Storyboard'}</button>
                            )}
                        </div>
                        <div className={s.drawerSection}>
                            <div className={s.actionRow}>
                                <button className={s.actionBtn} onClick={() => { const pkg = store.exportCampaignPackage(sCamp.campaignId); if (pkg) { const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${sCamp.name}_package.json`; a.click(); } }}>📦 {ar ? 'تصدير حزمة الحملة' : 'Export Campaign'}</button>
                                <Link href={`/production/client/${sCamp.clientId}`} className={s.actionBtn}>👤 {ar ? 'مساحة العميل' : 'Client Workspace'}</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ STORYBOARD VIEWER ═══ */}
            {sSb && (
                <div className={s.modalOverlay} onClick={() => setShowStoryboard(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
                        <button className={s.drawerClose} onClick={() => setShowStoryboard(null)}>✕</button>
                        <div className={s.drawerTitle}>📋 {sSb.title} {sSb.generatedByAI && <span style={{ fontSize: 12, color: '#8b5cf6' }}>🤖 AI</span>}</div>
                        <div className={s.campBadges}>
                            <span className={s.campBadge}>V{sSb.version}</span>
                            <span className={s.campBadge}>{sSb.scenes.length} {ar ? 'مشهد' : 'scenes'}</span>
                        </div>
                        <div className={s.sbScenes}>
                            {sSb.scenes.map(sc => (
                                <div key={sc.sceneId} className={s.sbScene}>
                                    <div className={s.sbSceneNum}>{ar ? 'مشهد' : 'Scene'} {sc.order} — {sc.durationSec}s</div>
                                    <div className={s.sbSceneObj}>{sc.objective}</div>
                                    <div className={s.sbSceneNotes}>🎥 {sc.visualNotes}</div>
                                    <div className={s.sbSceneNotes}>📷 {sc.cameraNotes} • {sc.shotType}</div>
                                    {sc.audioNotes && <div className={s.sbSceneNotes}>🔊 {sc.audioNotes}</div>}
                                    {sc.textNotes && <div className={s.sbSceneNotes}>📝 {sc.textNotes}</div>}
                                    {sc.requiredPeople.length > 0 && <div className={s.sbSceneNotes}>👥 {sc.requiredPeople.join(', ')}</div>}
                                    {sc.locationNotes && <div className={s.sbSceneNotes}>📍 {sc.locationNotes}</div>}
                                </div>
                            ))}
                        </div>
                        {sSb.comments.length > 0 && <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'تعليقات' : 'Comments'}</div>
                            {sSb.comments.map(c => <div key={c.id} className={s.activityItem}><span>{c.sender}:</span> <span style={{ flex: 1 }}>{c.text}</span> <span className={s.activityTime}>{c.time}</span></div>)}
                        </div>}
                    </div>
                </div>
            )}


            {/* ═══ NEW JOB MODAL ═══ */}
            {showNewJob && (
                <div className={s.modalOverlay} onClick={() => setShowNewJob(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <div className={s.modalTitle}>📌 {ar ? 'مهمة إنتاج جديدة' : 'New Production Job'}</div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'العنوان' : 'Title'}</label><input className={s.modalInput} value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'العميل' : 'Client'}</label>
                            <select className={s.modalSelect} value={newJob.clientId} onChange={e => setNewJob({ ...newJob, clientId: e.target.value })}>
                                {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'الحملة (اختياري)' : 'Campaign (optional)'}</label>
                            <select className={s.modalSelect} value={newJob.campaignId} onChange={e => setNewJob({ ...newJob, campaignId: e.target.value })}>
                                <option value="">{ar ? 'بدون حملة' : 'No campaign'}</option>
                                {store.campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'النوع' : 'Category'}</label>
                            <select className={s.modalSelect} value={newJob.category} onChange={e => setNewJob({ ...newJob, category: e.target.value as any })}>
                                {Object.entries(catL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'المنصة' : 'Platform'}</label><input className={s.modalInput} value={newJob.platform} onChange={e => setNewJob({ ...newJob, platform: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'الموعد النهائي' : 'Deadline'}</label><input className={s.modalInput} type="date" value={newJob.deadline} onChange={e => setNewJob({ ...newJob, deadline: e.target.value })} /></div>
                        <div className={s.modalField}><label className={s.modalLabel}>{ar ? 'المسؤول' : 'Owner'}</label>
                            <select className={s.modalSelect} value={newJob.owner} onChange={e => setNewJob({ ...newJob, owner: e.target.value })}>
                                {PROD_TEAM.map(m => <option key={m.id} value={m.name}>{m.name} — {m.role}</option>)}
                            </select>
                        </div>
                        <div className={s.modalActions}>
                            <button className={s.btnPrimary} onClick={handleCreateJob} disabled={!newJob.title.trim()}>✅ {ar ? 'إنشاء' : 'Create'}</button>
                            <button className={s.btnSecondary} onClick={() => setShowNewJob(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Export */}
            <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 40 }}>
                <button className={s.btnPrimary} onClick={() => { const report = store.exportMonthlyReport(lang); const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `production_monthly_report_${report.date}.json`; a.click(); }}>📊 {ar ? 'تصدير تقرير الإنتاج الشهري' : 'Export Monthly Production Report'}</button>
            </div>

            {toast && <div className={s.toast}>{toast}</div>}
        </div>
    );
}
