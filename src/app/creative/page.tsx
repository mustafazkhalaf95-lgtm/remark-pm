'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { getCreativeStore, STAGE_META, PIPELINE_STAGES, CATEGORY_ICONS, CATEGORY_LABELS_AR, CATEGORY_LABELS_EN, TEAM_MEMBERS, type PipelineStage, isVideoCategory } from '@/lib/creativeStore';
import { useSettings } from '@/lib/useSettings';

const ASSET_LABELS: Record<string, string> = { logo: '🏷️ شعار', identity: '📐 هوية', product_image: '📷 صور', video: '🎬 فيديو', approved_design: '✅ تصاميم', visual_ref: '🖼️ مراجع' };
const SRC_LABELS: Record<string, [string, string]> = { ai: ['🤖 AI', '🤖 AI'], creative_director: ['🎨 CD', '🎨 CD'], account_manager: ['👔 AM', '👔 AM'], operations_manager: ['⚙️ Ops', '⚙️ Ops'], manual: ['✋ يدوي', '✋ Manual'] };

export default function CreativeHQ() {
    const store = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const [fClient, setFClient] = useState('all');
    const [fType, setFType] = useState('all');
    const [fPrio, setFPrio] = useState('all');
    const [toast, setToast] = useState('');

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
    const kR = active.filter(r => r.status === 'concept_approval' || r.status === 'review_revisions').length;
    const kB = active.filter(r => r.blocked).length;
    const kH = filtered.filter(r => r.status === 'approved_ready').length;
    const kOv = active.filter(r => r.dueDate && new Date(r.dueDate) < new Date()).length;
    const kVid = active.filter(r => r.isVideoTask).length;

    // Workload
    const workload = TEAM_MEMBERS.map(m => { const items = active.filter(r => r.executorId === m.id || r.conceptWriterId === m.id || r.videoOwnerId === m.id); return { ...m, count: items.length }; });

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
                    <button className={s.iconBtn} onClick={toggleTheme}>🌙</button>
                    <button className={s.iconBtn} onClick={toggleLang}>🌐</button>
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
                    {[
                        [lang === 'ar' ? 'نشطة' : 'Active', kA, '#3b82f6'],
                        [lang === 'ar' ? 'بانتظار القرار' : 'Decisions', kR, '#ec4899'],
                        [lang === 'ar' ? 'فيديو' : 'Video', kVid, '#f59e0b'],
                        [lang === 'ar' ? 'محظورة' : 'Blocked', kB, kB > 0 ? '#ef4444' : '#6b7280'],
                        [lang === 'ar' ? 'جاهزة' : 'Ready', kH, '#22c55e'],
                        [lang === 'ar' ? 'متأخرة' : 'Overdue', kOv, kOv > 0 ? '#ef4444' : '#6b7280'],
                    ].map(([l, v, c], i) => (
                        <div key={i} className={s.kpiCard} style={{ borderRight: `4px solid ${c}` }}><div className={s.kpiLabel}>{l as string}</div><div className={s.kpiValue} style={{ color: c as string }}>{v as number}</div></div>
                    ))}
                </div>

                {/* CLIENT CARDS */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>👥 {lang === 'ar' ? 'العملاء' : 'Clients'}</div><div className={s.secCount}>{store.clients.length}</div><div className={s.secLine} /></div>
                <div className={s.clientGrid}>{store.clients.map(cl => {
                    const cReqs = store.getClientRequests(cl.clientId); const cActive = cReqs.filter(r => store.isActive(r)); const profile = store.getProfile(cl.clientId);
                    return (<div key={cl.clientId} className={s.clientCard}>
                        <div className={s.clientCardHead}><div className={s.clientAv} style={{ background: profile ? `linear-gradient(135deg,${profile.primaryColor},${profile.secondaryColor})` : undefined }}>{cl.avatar}</div><div className={s.clientInfo}><div className={s.clientName}>{cl.name}</div><div className={s.clientSec}>{cl.sector} • {cl.planType}</div></div></div>
                        <div className={s.clientMetrics}>
                            <div className={s.metricItem}><span className={s.metricVal}>{cActive.length}</span><span className={s.metricLbl}>{lang === 'ar' ? 'نشطة' : 'Active'}</span></div>
                            <div className={s.metricItem}><span className={s.metricVal}>{cReqs.filter(r => r.status === 'approved_ready').length}</span><span className={s.metricLbl}>{lang === 'ar' ? 'جاهزة' : 'Ready'}</span></div>
                            <div className={s.metricItem}><span className={s.metricVal}>{cReqs.filter(r => r.isVideoTask).length}</span><span className={s.metricLbl}>{lang === 'ar' ? 'فيديو' : 'Video'}</span></div>
                        </div>
                        <Link href={`/creative/client/${cl.clientId}`} className={s.clientLink}>{lang === 'ar' ? 'فتح المساحة ←' : 'Open Workspace →'}</Link>
                    </div>);
                })}</div>

                {/* 6-COLUMN PIPELINE */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🔄 {lang === 'ar' ? 'خط الإنتاج' : 'Pipeline'}</div><div className={s.secCount}>{filtered.length}</div><div className={s.secLine} /></div>
                <div className={s.pipeScroll}><div className={s.pipeline}>{PIPELINE_STAGES.map(stage => {
                    const sm = STAGE_META[stage]; const items = filtered.filter(r => r.status === stage);
                    return (<div key={stage} className={s.pipeCol}>
                        <div className={s.pipeColHead}>
                            <div className={s.pipeColDot} style={{ background: sm.color }} />
                            <div className={s.pipeColName}>{lang === 'ar' ? sm.ar : sm.en}</div>
                            <div className={s.pipeColCount}>{items.length}</div>
                        </div>
                        <div className={s.pipeColOwner}>👤 {lang === 'ar' ? sm.owner_ar : sm.owner_en}</div>
                        <div className={s.pipeCards}>{items.map(req => {
                            const cl = store.getClient(req.clientId);
                            const assigneeName = req.executorId ? (TEAM_MEMBERS.find(m => m.id === req.executorId)?.name || req.assignedTo) : (req.conceptWriterId ? (TEAM_MEMBERS.find(m => m.id === req.conceptWriterId)?.name || '') : req.assignedTo);
                            const srcKey = req.status === 'concept_writing' ? req.conceptAssignedBy : req.executionAssignedBy;
                            const srcLabel = SRC_LABELS[srcKey]?.[lang === 'ar' ? 0 : 1] || '';
                            return (<div key={req.requestId} className={s.pipeCard}>
                                <div className={s.pipeCardTitle}>{CATEGORY_ICONS[req.category]} {req.title}</div>
                                {cl && <div className={s.cardClient} style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{cl.avatar} {cl.name}</div>}
                                <div className={s.cardBadges}>
                                    <span className={`${s.badge} ${s['p' + req.priority[0].toUpperCase()]}`}>{pL[req.priority]}</span>
                                    {req.isVideoTask && <span className={s.badge} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,.2)', background: 'rgba(245,158,11,.06)' }}>🎬</span>}
                                </div>
                                {assigneeName && <div className={s.cardAssignee}>🎯 {assigneeName} {srcLabel && <span style={{ fontSize: 9, opacity: 0.6 }}>({srcLabel})</span>}</div>}
                                {req.isVideoTask && req.videoOwnerId && <div className={s.cardAssignee} style={{ color: '#f59e0b' }}>📹 {TEAM_MEMBERS.find(m => m.id === req.videoOwnerId)?.name || req.videoOwnerId}</div>}
                                <div className={s.cardDue}>📅 {req.dueDate}</div>
                                <div className={s.cardNext}>▶ {lang === 'ar' ? sm.nextAction_ar : sm.nextAction_en}</div>
                                {/* Approval badges */}
                                {req.cdPrelimApproval && <div className={s.okBadge}>✅ {lang === 'ar' ? 'أولية CD' : 'CD Prelim'}</div>}
                                {req.amFinalIdeaApproval && <div className={s.okBadge}>✅ {lang === 'ar' ? 'نهائية AM' : 'AM Final'}</div>}
                                {req.blocked && <div className={s.blockedBadge}>⛔ {req.blockReason.slice(0, 25)}</div>}
                                {req.calendarStatus !== 'none' && <div className={s.okBadge} style={{ color: req.calendarStatus === 'confirmed' ? '#22c55e' : '#f59e0b', borderColor: req.calendarStatus === 'confirmed' ? 'rgba(34,197,94,.2)' : 'rgba(245,158,11,.2)', background: req.calendarStatus === 'confirmed' ? 'rgba(34,197,94,.06)' : 'rgba(245,158,11,.06)' }}>{req.calendarStatus === 'confirmed' ? '✅' : '⏳'} {lang === 'ar' ? (req.calendarStatus === 'confirmed' ? 'مؤكد' : 'مبدئي') : req.calendarStatus}</div>}
                                {req.sourceBoard === 'marketing' && <div className={s.okBadge} style={{ color: '#14b8a6', borderColor: 'rgba(20,184,166,.2)', background: 'rgba(20,184,166,.06)' }}>📋 {lang === 'ar' ? 'تسويق' : 'Mkt'}</div>}
                            </div>);
                        })}</div>
                    </div>);
                })}</div></div>

                {/* TEAM WORKLOAD */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>👥 {lang === 'ar' ? 'حمل العمل' : 'Workload'}</div><div className={s.secLine} /></div>
                <div className={s.kpiRow}>{workload.map(m => (
                    <div key={m.id} className={s.kpiCard} style={{ borderRight: `4px solid ${m.color}` }}>
                        <div className={s.kpiLabel}>{m.avatar} {m.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                        <div className={s.kpiValue} style={{ color: m.count > 3 ? '#ef4444' : m.color }}>{m.count}</div>
                    </div>
                ))}</div>

                {/* VIDEOGRAPHER CALENDARS */}
                <div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🎬 {lang === 'ar' ? 'تقويم المصورين' : 'Videographer Calendars'}</div><div className={s.secLine} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {TEAM_MEMBERS.filter(m => m.skills.includes('video')).map(m => {
                        const cal = store.getVideographerCalendar(m.id);
                        return (<div key={m.id} className={s.kpiCard} style={{ borderRight: `4px solid ${m.color}`, padding: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{m.avatar} {m.name} <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>({m.roleEn})</span></div>
                            {cal.tentative.length > 0 && <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>⏳ {lang === 'ar' ? 'مبدئي' : 'Tentative'} ({cal.tentative.length})</div>
                                {cal.tentative.map(t => <div key={t.requestId} style={{ fontSize: 11, padding: '2px 0', color: 'var(--text-muted)' }}>• {t.title} — 📅 {t.dueDate} {!t.conceptReady && <span style={{ color: '#f59e0b' }}>(⏳ {lang === 'ar' ? 'بانتظار المفهوم' : 'Pending Concept'})</span>}</div>)}
                            </div>}
                            {cal.confirmed.length > 0 && <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>✅ {lang === 'ar' ? 'مؤكد' : 'Confirmed'} ({cal.confirmed.length})</div>
                                {cal.confirmed.map(t => <div key={t.requestId} style={{ fontSize: 11, padding: '2px 0', color: 'var(--text-muted)' }}>• {t.title} — 📅 {t.dueDate}</div>)}
                            </div>}
                            {cal.tentative.length === 0 && cal.confirmed.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</div>}
                        </div>);
                    })}
                </div>
            </main>
        </div>
    );
}
