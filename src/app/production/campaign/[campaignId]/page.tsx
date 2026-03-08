'use client';
import { useState, useSyncExternalStore, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import s from '../../page.module.css';
import { getProductionStore, PROD_STAGES, PROD_STAGE_META, JOB_CAT_AR, JOB_CAT_EN, JOB_CAT_ICON, PROD_TEAM } from '@/lib/productionStore';
import { getCreativeStore } from '@/lib/creativeStore';

export default function CampaignWorkspace() {
    const params = useParams();
    const campaignId = params.campaignId as string;
    const store = getProductionStore();
    const cStore = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    useSyncExternalStore(cb => cStore.subscribe(cb), () => cStore.getVersion(), () => 0);

    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const [toast, setToast] = useState('');
    const [showStoryboard, setShowStoryboard] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<string | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [versionLabel, setVersionLabel] = useState('');

    useEffect(() => { theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }, [theme]);
    useEffect(() => { const t = store.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [ver, store]);

    const ar = lang === 'ar';
    const camp = store.getCampaign(campaignId);
    const cn = (id: string) => cStore.getClient(id)?.name || id;
    const catL = ar ? JOB_CAT_AR : JOB_CAT_EN;

    if (!camp) return <div className={s.board} dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📦</div><h2>{ar ? 'الحملة غير موجودة' : 'Campaign not found'}</h2><Link href="/production" className={s.btnPrimary} style={{ marginTop: 16, display: 'inline-block' }}>← {ar ? 'العودة' : 'Back'}</Link></div></div>;

    const jobs = store.getCampaignJobs(campaignId);
    const doneJobs = jobs.filter(j => j.stage === 'delivered').length;
    const sb = camp.storyboardId ? store.getStoryboard(camp.storyboardId) : null;
    const sJob = selectedJob ? store.getJob(selectedJob) : null;
    const sSb = showStoryboard ? store.getStoryboard(showStoryboard) : null;

    return (
        <div className={s.board} dir="rtl">
            {/* Header */}
            <header className={s.header}>
                <div className={s.headerRight}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.boardTitle}><div className={s.boardDot} /><h1 className={s.boardName}>{camp.name}</h1></div>
                </div>
                <div className={s.headerLeft}>
                    <Link href="/production" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg-glass-50)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>← {ar ? 'مقر الإنتاج' : 'Production HQ'}</Link>
                    <Link href={`/production/client/${camp.clientId}`} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg-glass-50)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>👤 {cn(camp.clientId)}</Link>
                    <button className={s.iconBtn} onClick={() => setTheme(p => p === 'light' ? 'dark' : 'light')}>🌙</button>
                    <button className={s.iconBtn} onClick={() => setLang(p => p === 'ar' ? 'en' : 'ar')}>🌐</button>
                    <div className={s.userAvatar}>م.خ</div>
                </div>
            </header>

            <main className={s.content}>
                {/* Campaign Overview */}
                <div className={s.kpiGrid}>
                    <div className={s.kpiCard}><div className={s.kpiValue}>{jobs.length}</div><div className={s.kpiLabel}>{ar ? 'مهام الإنتاج' : 'Production Jobs'}</div></div>
                    <div className={s.kpiCard}><div className={s.kpiValue}>{doneJobs}/{jobs.length}</div><div className={s.kpiLabel}>{ar ? 'مكتمل' : 'Completed'}</div></div>
                    <div className={s.kpiCard}><div className={s.kpiValue}>{camp.deliverablesList.length}</div><div className={s.kpiLabel}>{ar ? 'مخرجات' : 'Deliverables'}</div></div>
                    <div className={s.kpiCard}><div className={s.kpiValue}>{camp.progress}%</div><div className={s.kpiLabel}>{ar ? 'التقدم' : 'Progress'}</div></div>
                </div>

                {/* Approval Prerequisites */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'شروط الموافقة المسبقة' : 'Approval Prerequisites'}</span><div className={s.sectionLine} /></div>
                <div className={s.approvalRow}>
                    <span className={`${s.approvalBadge} ${camp.cdApproval ? s.approvalOk : s.approvalPending}`}>{camp.cdApproval ? '✅' : '⏳'} {ar ? 'الموافقة المبدئية — المدير الإبداعي' : 'Preliminary — Creative Director'}</span>
                    <span className={`${s.approvalBadge} ${camp.amApproval ? s.approvalOk : s.approvalPending}`}>{camp.amApproval ? '✅' : '⏳'} {ar ? 'الموافقة النهائية — مدير الحسابات' : 'Final — Account Manager'}</span>
                </div>
                {(!camp.cdApproval || !camp.amApproval) && <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>⛔ {ar ? 'لا يمكن بدء الإنتاج الكامل حتى اكتمال الموافقات المسبقة' : 'Full production cannot start until approvals are complete'}</div>}

                {/* Campaign Info */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'تفاصيل الحملة' : 'Campaign Details'}</span><div className={s.sectionLine} /></div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 13 }}>
                    <div><strong>{ar ? 'العميل:' : 'Client:'}</strong> {cn(camp.clientId)}</div>
                    <div><strong>{ar ? 'الهدف:' : 'Objective:'}</strong> {camp.objective}</div>
                    <div><strong>{ar ? 'المنصات:' : 'Platforms:'}</strong> {camp.platforms.join(', ')}</div>
                    <div><strong>{ar ? 'المسؤول:' : 'Owner:'}</strong> {camp.owner}</div>
                    <div><strong>{ar ? 'الحالة:' : 'Status:'}</strong> {ar ? (camp.status === 'planning' ? 'تخطيط' : camp.status === 'in_production' ? 'إنتاج' : camp.status === 'review' ? 'مراجعة' : 'مكتمل') : camp.status}</div>
                    <div className={s.campProgress} style={{ marginTop: 8 }}><div className={s.campProgressFill} style={{ width: `${camp.progress}%` }} /></div>
                </div>

                {/* Deliverables */}
                {camp.deliverablesList.length > 0 && <>
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'المخرجات' : 'Deliverables'}</span><div className={s.sectionLine} /><span className={s.sectionCount}>{camp.deliverablesList.length}</span></div>
                    <div className={s.campBadges}>
                        {camp.deliverablesList.map((d, i) => <span key={i} className={s.campBadge}>📌 {d}</span>)}
                    </div>
                </>}

                {/* Milestones */}
                {camp.milestones.length > 0 && <>
                    <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'المحطات' : 'Milestones'}</span><div className={s.sectionLine} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {camp.milestones.map((m, i) => (
                            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                <span>{m.done ? '✅' : '⏳'}</span>
                                <span style={{ flex: 1, fontWeight: 600 }}>{m.label}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{m.date}</span>
                            </div>
                        ))}
                    </div>
                </>}

                {/* Campaign Storyboard */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>📋 {ar ? 'ستوري بورد الحملة' : 'Campaign Storyboard'}</span><div className={s.sectionLine} /></div>
                {sb ? (
                    <div>
                        <div className={s.campBadges}><span className={s.campBadge}>V{sb.version}</span><span className={s.campBadge}>{sb.scenes.length} {ar ? 'مشهد' : 'scenes'}</span>{sb.generatedByAI && <span className={`${s.campBadge} ${s.campBadgePurple}`}>🤖 AI</span>}</div>
                        <div className={s.sbScenes} style={{ marginTop: 8 }}>
                            {sb.scenes.map(sc => (
                                <div key={sc.sceneId} className={s.sbScene}>
                                    <div className={s.sbSceneNum}>{ar ? 'مشهد' : 'Scene'} {sc.order} — {sc.durationSec}s</div>
                                    <div className={s.sbSceneObj}>{sc.objective}</div>
                                    <div className={s.sbSceneNotes}>🎥 {sc.visualNotes}</div>
                                    <div className={s.sbSceneNotes}>📷 {sc.cameraNotes} • {sc.shotType}</div>
                                    {sc.audioNotes && <div className={s.sbSceneNotes}>🔊 {sc.audioNotes}</div>}
                                    {sc.locationNotes && <div className={s.sbSceneNotes}>📍 {sc.locationNotes}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <button className={s.actionBtn} onClick={() => { const newSb = store.generateAIStoryboard('campaign', campaignId, camp.name, lang); setShowStoryboard(newSb.storyboardId); }}>🤖 {ar ? 'إنشاء ستوري بورد بالذكاء الاصطناعي' : 'Generate AI Storyboard'}</button>
                )}

                {/* Production Jobs */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'مهام الإنتاج' : 'Production Jobs'}</span><div className={s.sectionLine} /><span className={s.sectionCount}>{jobs.length}</span></div>
                {jobs.map(j => (
                    <div key={j.productionJobId} className={s.pipelineJobCard} onClick={() => setSelectedJob(j.productionJobId)} style={{ marginBottom: 8 }}>
                        <div className={s.pipelineJobTitle}>{JOB_CAT_ICON[j.category]} {j.title}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                            <span className={s.campBadge} style={{ borderColor: PROD_STAGE_META[j.stage].color, color: PROD_STAGE_META[j.stage].color }}>{ar ? PROD_STAGE_META[j.stage].ar : PROD_STAGE_META[j.stage].en}</span>
                            <span className={`${s.approvalBadge} ${j.cdPrelimApproval ? s.approvalOk : s.approvalPending}`} style={{ fontSize: 10 }}>{j.cdPrelimApproval ? '✅' : '⏳'} CD</span>
                            <span className={`${s.approvalBadge} ${j.amFinalApproval ? s.approvalOk : s.approvalPending}`} style={{ fontSize: 10 }}>{j.amFinalApproval ? '✅' : '⏳'} AM</span>
                            {j.blocked && <span style={{ fontSize: 10, color: '#dc2626' }}>⛔ {j.blockReason}</span>}
                        </div>
                        <div className={s.pipelineJobMeta}>{catL[j.category]} • {j.platform} • {j.owner} • {j.deadline}</div>
                    </div>
                ))}
                {jobs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{ar ? 'لا توجد مهام إنتاج بعد' : 'No production jobs yet'}</div>}

                {/* Media Progress */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'ملفات الحملة' : 'Campaign Media'}</span><div className={s.sectionLine} /></div>
                <div className={s.mediaList}>
                    {store.mediaFiles.filter(f => f.campaignId === campaignId).map(f => (
                        <div key={f.fileId} className={s.mediaItem}>
                            <span className={s.mediaIcon}>📁</span>
                            <span className={s.mediaName}>{f.name}</span>
                            <span className={s.mediaSize}>{f.size}</span>
                            <span className={s.campBadge}>V{f.version}</span>
                        </div>
                    ))}
                    {store.mediaFiles.filter(f => f.campaignId === campaignId).length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>{ar ? 'لا توجد ملفات بعد' : 'No media files yet'}</div>}
                </div>

                {/* Export */}
                <div className={s.sectionHeader}><span className={s.sectionTitle}>{ar ? 'التصدير' : 'Export'}</span><div className={s.sectionLine} /></div>
                <div className={s.actionRow}>
                    <button className={s.btnPrimary} onClick={() => { const pkg = store.exportCampaignPackage(campaignId); if (pkg) { const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${camp.name}_package.json`; a.click(); } }}>📦 {ar ? 'تصدير حزمة الحملة' : 'Export Campaign Package'}</button>
                </div>
            </main>

            {/* Job Detail Drawer */}
            {sJob && (
                <div className={s.modalOverlay} onClick={() => setSelectedJob(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <button className={s.drawerClose} onClick={() => setSelectedJob(null)}>✕</button>
                        <div className={s.drawerTitle}>{JOB_CAT_ICON[sJob.category]} {sJob.title}</div>
                        <div className={s.campBadges}>
                            <span className={s.campBadge} style={{ borderColor: PROD_STAGE_META[sJob.stage].color, color: PROD_STAGE_META[sJob.stage].color }}>{ar ? PROD_STAGE_META[sJob.stage].ar : PROD_STAGE_META[sJob.stage].en}</span>
                        </div>
                        {/* Approval Prerequisites — display only */}
                        <div className={s.approvalRow} style={{ marginTop: 8 }}>
                            <span className={`${s.approvalBadge} ${sJob.cdPrelimApproval ? s.approvalOk : s.approvalPending}`}>{sJob.cdPrelimApproval ? '✅' : '⏳'} {ar ? 'المدير الإبداعي' : 'Creative Director'}</span>
                            <span className={`${s.approvalBadge} ${sJob.amFinalApproval ? s.approvalOk : s.approvalPending}`}>{sJob.amFinalApproval ? '✅' : '⏳'} {ar ? 'مدير الحسابات' : 'Account Manager'}</span>
                        </div>
                        {(!sJob.cdPrelimApproval || !sJob.amFinalApproval) && <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>⛔ {ar ? 'بانتظار الموافقات المسبقة' : 'Prerequisite approvals pending'}</div>}
                        {/* Details */}
                        <div style={{ fontSize: 13, marginTop: 12 }}>
                            <div><strong>{ar ? 'النوع:' : 'Type:'}</strong> {catL[sJob.category]}</div>
                            <div><strong>{ar ? 'المنصة:' : 'Platform:'}</strong> {sJob.platform}</div>
                            <div><strong>{ar ? 'الموعد:' : 'Deadline:'}</strong> {sJob.deadline}</div>
                            <div><strong>{ar ? 'المسؤول:' : 'Owner:'}</strong> {sJob.owner}</div>
                            <div><strong>{ar ? 'الفريق:' : 'Team:'}</strong> {sJob.assignedTeam.join(', ')}</div>
                            {sJob.approvedConceptSummary && <div><strong>{ar ? 'الفكرة المعتمدة:' : 'Concept:'}</strong> {sJob.approvedConceptSummary}</div>}
                        </div>
                        {/* Stage Actions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'تغيير المرحلة' : 'Change Stage'}</div>
                            <div className={s.actionRow}>
                                {PROD_STAGES.map(st => (
                                    <button key={st} className={`${s.actionBtn} ${(!sJob.cdPrelimApproval && st !== 'awaiting_concept') ? s.disabledBtn : ''}`} onClick={() => store.moveJobToStage(sJob.productionJobId, st, lang)} style={sJob.stage === st ? { background: PROD_STAGE_META[st].color, color: 'white', borderColor: 'transparent' } : undefined}>
                                        {ar ? PROD_STAGE_META[st].ar : PROD_STAGE_META[st].en}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Storyboard */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'ستوري بورد' : 'Storyboard'}</div>
                            {sJob.storyboardId ? (
                                <button className={s.actionBtn} onClick={() => setShowStoryboard(sJob.storyboardId!)}>📋 {ar ? 'عرض' : 'View'}</button>
                            ) : (
                                <button className={s.actionBtn} onClick={() => { const newSb = store.generateAIStoryboard('job', sJob.productionJobId, sJob.title, lang); setShowStoryboard(newSb.storyboardId); }}>🤖 {ar ? 'إنشاء ستوري بورد AI' : 'Generate AI Storyboard'}</button>
                            )}
                        </div>
                        {/* Media */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'الملفات' : 'Media'}</div>
                            {store.getJobMedia(sJob.productionJobId).map(f => (
                                <div key={f.fileId} className={s.mediaItem}><span className={s.mediaIcon}>📁</span><span className={s.mediaName}>{f.name}</span><span className={s.mediaSize}>{f.size}</span></div>
                            ))}
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <input className={s.modalInput} style={{ flex: 1 }} placeholder={ar ? 'اسم الملف...' : 'File name...'} value={uploadName} onChange={e => setUploadName(e.target.value)} />
                                <button className={s.actionBtn} onClick={() => { if (uploadName.trim()) { store.uploadMedia(sJob.productionJobId, uploadName, 'footage', sJob.owner, lang); setUploadName(''); } }}>📤 {ar ? 'رفع' : 'Upload'}</button>
                            </div>
                        </div>
                        {/* Versions */}
                        <div className={s.drawerSection}>
                            <div className={s.drawerLabel}>{ar ? 'النسخ' : 'Versions'}</div>
                            {sJob.editVersions.map(v => (<div key={v.v} className={s.versionItem}><span className={s.versionLabel}>V{v.v} — {v.label}</span><span className={s.versionDate}>{v.date}</span></div>))}
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <input className={s.modalInput} style={{ flex: 1 }} placeholder={ar ? 'اسم النسخة...' : 'Version label...'} value={versionLabel} onChange={e => setVersionLabel(e.target.value)} />
                                <button className={s.actionBtn} onClick={() => { if (versionLabel.trim()) { store.addVersion(sJob.productionJobId, versionLabel, '', lang); setVersionLabel(''); } }}>🔄 {ar ? 'إضافة' : 'Add'}</button>
                            </div>
                        </div>
                        {/* Export */}
                        <div className={s.actionRow} style={{ marginTop: 12 }}>
                            <button className={s.actionBtn} onClick={() => { const pkg = store.exportJobPackage(sJob.productionJobId); if (pkg) { const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${sJob.title}_package.json`; a.click(); } }}>📦 {ar ? 'تصدير' : 'Export'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Storyboard Viewer */}
            {sSb && (
                <div className={s.modalOverlay} onClick={() => setShowStoryboard(null)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
                        <button className={s.drawerClose} onClick={() => setShowStoryboard(null)}>✕</button>
                        <div className={s.drawerTitle}>📋 {sSb.title} {sSb.generatedByAI && <span style={{ fontSize: 12, color: '#8b5cf6' }}>🤖 AI</span>}</div>
                        <div className={s.campBadges}><span className={s.campBadge}>V{sSb.version}</span><span className={s.campBadge}>{sSb.scenes.length} {ar ? 'مشهد' : 'scenes'}</span></div>
                        <div className={s.sbScenes}>
                            {sSb.scenes.map(sc => (
                                <div key={sc.sceneId} className={s.sbScene}>
                                    <div className={s.sbSceneNum}>{ar ? 'مشهد' : 'Scene'} {sc.order} — {sc.durationSec}s</div>
                                    <div className={s.sbSceneObj}>{sc.objective}</div>
                                    <div className={s.sbSceneNotes}>🎥 {sc.visualNotes}</div>
                                    <div className={s.sbSceneNotes}>📷 {sc.cameraNotes} • {sc.shotType}</div>
                                    {sc.audioNotes && <div className={s.sbSceneNotes}>🔊 {sc.audioNotes}</div>}
                                    {sc.locationNotes && <div className={s.sbSceneNotes}>📍 {sc.locationNotes}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className={s.toast}>{toast}</div>}
        </div>
    );
}
