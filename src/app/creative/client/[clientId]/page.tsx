'use client';
import { useState, useEffect, useSyncExternalStore, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import s from './page.module.css';
import { getCreativeStore, STAGE_META, PIPELINE_STAGES, CATEGORY_ICONS, CATEGORY_LABELS_AR, CATEGORY_LABELS_EN, TEAM_MEMBERS, type CreativeRequest, type PipelineStage, type InspirationSource, isVideoCategory } from '@/lib/creativeStore';
import { useSettings } from '@/lib/useSettings';

type Tab = 'overview' | 'requests' | 'chat' | 'calendar' | 'brand' | 'ai' | 'inspiration' | 'showcase';

const SOURCE_LABELS: { [k in InspirationSource]: { ar: string; en: string; icon: string; color: string } } = {
    ai_assistant: { ar: 'مساعد AI', en: 'AI Assistant', icon: '🤖', color: '#14b8a6' },
    creative_team: { ar: 'الفريق الإبداعي', en: 'Creative Team', icon: '🎨', color: '#8b5cf6' },
    account_manager: { ar: 'مدير الحساب', en: 'Account Manager', icon: '👔', color: '#f59e0b' },
};
const ASRC: Record<string, [string, string]> = { ai: ['🤖 AI', '🤖 AI'], creative_director: ['🎨 CD', '🎨 CD'], account_manager: ['👔 AM', '👔 AM'], operations_manager: ['⚙️ Ops', '⚙️ Ops'], manual: ['✋ يدوي', '✋ Manual'] };

export default function ClientWorkspace() {
    const rawClientId = (useParams() as { clientId: string }).clientId;
    const clientId = decodeURIComponent(rawClientId);
    const store = getCreativeStore();
    const ver = useSyncExternalStore(cb => store.subscribe(cb), () => store.getVersion(), () => 0);
    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const [tab, setTab] = useState<Tab>('overview');
    const [selReq, setSelReq] = useState<CreativeRequest | null>(null);
    const [chatIn, setChatIn] = useState('');
    const [commentIn, setCommentIn] = useState('');
    const [toast, setToast] = useState('');
    const [inspSrc, setInspSrc] = useState<'all' | InspirationSource>('all');
    const fileRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const assetRef = useRef<HTMLInputElement>(null);

    useEffect(() => { theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }, [theme]);
    useEffect(() => { const t = store.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [ver]);

    const catL = lang === 'ar' ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;
    const pL: Record<string, string> = { urgent: lang === 'ar' ? 'عاجل' : 'Urgent', high: lang === 'ar' ? 'مرتفع' : 'High', medium: lang === 'ar' ? 'متوسط' : 'Medium', low: lang === 'ar' ? 'منخفض' : 'Low' };
    const client = store.getClient(clientId); const profile = store.getProfile(clientId);
    const reqs = store.getClientRequests(clientId); const msgs = store.getClientChat(clientId);
    const assets = store.getClientAssets(clientId); const events = store.getClientCalendar(clientId);
    const insps = store.getClientInspirations(clientId); const showcase = store.getClientShowcase(clientId);
    if (!client) return <div style={{ padding: 80, textAlign: 'center' }}>Client not found</div>;

    const active = reqs.filter(r => store.isActive(r));
    const kA = active.length; const kR = active.filter(r => r.status === 'concept_approval' || r.status === 'review_revisions').length; const kB = active.filter(r => r.blocked).length; const kH = reqs.filter(r => r.status === 'approved_ready').length;

    // Calendar
    const now = new Date(); const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); const fdw = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const dn = lang === 'ar' ? ['أحد', 'إثن', 'ثلا', 'أربع', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayEvts = (d: number) => { const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; return events.filter(e => e.date === ds); };

    const sendChat = () => { if (!chatIn.trim()) return; store.addChatMessage(clientId, { sender: lang === 'ar' ? 'المدير الإبداعي' : 'CD', avatar: '🎨', text: chatIn, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' }); setChatIn(''); setTimeout(() => { store.addChatMessage(clientId, { sender: 'AI العميل', avatar: '🤖', text: lang === 'ar' ? '👍 تم الاطلاع.' : '👍 Noted.', time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'ai_client' }); }, 1200); };
    const sendComment = () => { if (!commentIn.trim() || !selReq) return; store.addRequestComment(selReq.requestId, { sender: lang === 'ar' ? 'المدير الإبداعي' : 'CD', avatar: '🎨', text: commentIn, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' }); setCommentIn(''); };
    const onFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'att' | 'vid' | 'asset') => { const f = e.target.files?.[0]; if (!f) return; if (type === 'att' && selReq) store.uploadAttachment(selReq.requestId, f.name, lang); else if (type === 'vid' && selReq) store.uploadFinalVideo(selReq.requestId, f.name, lang); else if (type === 'asset') store.addBrandAsset(clientId, { category: 'visual_ref', name: f.name, description: lang === 'ar' ? 'مرفوع' : 'Uploaded', fileUrl: f.name }, lang); e.target.value = ''; };

    const filtInsps = insps.filter(i => inspSrc === 'all' || i.source === inspSrc);
    const allTabs: Tab[] = ['overview', 'requests', 'chat', 'calendar', 'brand', 'ai', 'inspiration', 'showcase'];
    const tabLabels: Record<Tab, string> = lang === 'ar' ? { overview: '📊 نظرة عامة', requests: '📋 الطلبات', chat: '💬 المحادثة', calendar: '📅 التقويم', brand: '📁 المكتبة', ai: '🤖 AI العميل', inspiration: '💡 الإلهام', showcase: '🏆 الإنجازات' } : { overview: '📊 Overview', requests: '📋 Requests', chat: '💬 Chat', calendar: '📅 Calendar', brand: '📁 Library', ai: '🤖 AI Client', inspiration: '💡 Inspiration', showcase: '🏆 Showcase' };

    // ═══ PIPELINE (6 columns) ═══
    const renderPipe = () => (<><div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🔄 {lang === 'ar' ? 'خط الإنتاج' : 'Pipeline'}</div><div className={s.secCount}>{reqs.length}</div><div className={s.secLine} /></div>
        <div className={s.pipeScroll}><div className={s.pipeline}>{PIPELINE_STAGES.map(stage => { const sm = STAGE_META[stage]; const items = reqs.filter(r => r.status === stage); return (<div key={stage} className={s.pipeCol}><div className={s.pipeColHead}><div className={s.pipeColDot} style={{ background: sm.color }} /><div className={s.pipeColName}>{lang === 'ar' ? sm.ar : sm.en}</div><div className={s.pipeColCount}>{items.length}</div></div><div className={s.pipeColOwner}>👤 {lang === 'ar' ? sm.owner_ar : sm.owner_en}</div><div className={s.pipeCards}>{items.map(req => (<div key={req.requestId} className={s.pipeCard} onClick={() => setSelReq(req)}><div className={s.pipeCardTitle}>{CATEGORY_ICONS[req.category]} {req.title}</div><div className={s.cardBadges}><span className={`${s.badge} ${s['p' + req.priority[0].toUpperCase()]}`}>{pL[req.priority]}</span>{req.isVideoTask && <span className={s.badge} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,.2)', background: 'rgba(245,158,11,.06)' }}>🎬</span>}</div>{req.assignedTo && <div className={s.cardAssignee}>🎯 {req.assignedTo}</div>}<div className={s.cardDue}>📅 {req.dueDate}</div><div className={s.cardNext}>▶ {lang === 'ar' ? sm.nextAction_ar : sm.nextAction_en}</div>{req.cdPrelimApproval && <div className={s.okBadge}>✅ CD</div>}{req.amFinalIdeaApproval && <div className={s.okBadge}>✅ AM</div>}{req.blocked && <div className={s.blockedBadge}>⛔ {req.blockReason.slice(0, 20)}</div>}{req.sourceBoard === 'marketing' && <div className={s.okBadge} style={{ color: '#14b8a6', borderColor: 'rgba(20,184,166,.2)', background: 'rgba(20,184,166,.06)' }}>📋</div>}</div>))}</div></div>); })}
        </div></div></>);

    // ═══ CHAT ═══
    const renderChat = () => (<div className={s.chatBox}><div className={s.chatMsgs}>{msgs.map(m => (<div key={m.id} className={s.chatMsg}><div className={s.chatAv}>{m.avatar}</div><div className={`${s.chatBody} ${m.type === 'ai_client' ? s.chatAi : m.type === 'ai_coordinator' ? s.chatCoord : m.type === 'system' ? s.chatSys : ''}`}><div className={s.chatSender}>{m.sender} <span className={s.chatTime}>{m.time}</span></div><div className={s.chatText}>{m.text}</div></div></div>))}</div><div className={s.chatInputArea}><input className={s.chatInput} placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Type...'} value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} /><button className={s.chatSend} onClick={sendChat}>➤</button></div></div>);

    // ═══ CALENDAR ═══
    const renderCal = () => (<div className={s.bigCal}><div className={s.calHeader}><div className={s.calMonth}>{now.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}</div></div><div className={s.calGrid}>{dn.map(d => <div key={d} className={s.calDH}>{d}</div>)}{Array.from({ length: fdw }).map((_, i) => <div key={`e${i}`} className={`${s.calDay} ${s.calEmpty}`} />)}{Array.from({ length: dim }).map((_, i) => { const day = i + 1; const today = day === now.getDate(); const evs = dayEvts(day); return (<div key={day} className={`${s.calDay} ${today ? s.calToday : ''}`}><div className={s.calDayNum}>{day}</div><div className={s.calEvts}>{evs.map(ev => <div key={ev.id} className={s.calEv} style={{ background: ev.color }} title={ev.title}>{ev.title.slice(0, 8)}</div>)}</div></div>); })}</div></div>);

    // ═══ ASSETS ═══
    const renderAssets = () => (<><div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>📁 {lang === 'ar' ? 'مكتبة الملفات' : 'Brand Library'}</div><div className={s.secCount}>{assets.length}</div><div className={s.secLine} /></div><button className={s.uploadBtn} onClick={() => assetRef.current?.click()}>+ {lang === 'ar' ? 'رفع ملف' : 'Upload'}</button><input ref={assetRef} type="file" style={{ display: 'none' }} onChange={e => onFile(e, 'asset')} /><div className={s.assetsGrid}>{assets.map(a => (<div key={a.id} className={s.assetCard}><div className={s.assetIcon}>📄</div><div className={s.assetName}>{a.name}</div><div className={s.assetDesc}>{a.description}</div>{a.approved && <span className={s.assetOk}>✅</span>}</div>))}</div>{assets.length === 0 && <div className={s.emptyMsg}>📁 {lang === 'ar' ? 'لا ملفات' : 'No assets'}</div>}</>);

    // ═══ PROFILE ═══
    const renderProfile = () => { if (!profile) return <div className={s.emptyMsg}>🤖 {lang === 'ar' ? 'لم يتم إعداد الملف' : 'Not set up'}</div>; const p = profile; const a = p.aiPersona || {} as any; const fl = (l: string, v: string) => (<div className={s.profField}><div className={s.profLabel}>{l}</div><div className={s.profVal}>{v || '—'}</div></div>); return (<div className={s.profileCard}><div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🎨 {lang === 'ar' ? 'الهوية' : 'Brand'}</div><div className={s.secLine} /></div><div className={s.profGrid}>{fl(lang === 'ar' ? 'الحملة' : 'Campaign', p.campaignDirection)}{fl(lang === 'ar' ? 'الأسلوب' : 'Style', p.visualStyle)}{fl(lang === 'ar' ? 'النبرة' : 'Tone', p.brandTone)}{fl(lang === 'ar' ? 'الجمهور' : 'Audience', p.targetAudience)}</div><div className={s.personaBox}><div className={s.personaTitle}>🤖 AI</div><div className={s.personaGrid}>{[[lang === 'ar' ? 'التواصل' : 'Comm', a.communicationStyle || '—'], [lang === 'ar' ? 'الرسمية' : 'Formality', a.formalityLevel || '—'], [lang === 'ar' ? 'بصري' : 'Visual', a.visualSensitivity || '—'], [lang === 'ar' ? 'سرعة' : 'Speed', a.speedExpectations || '—']].map(([l, v], i) => (<div key={i} className={s.personaItem}><div className={s.personaLabel}>{l}</div><div className={s.personaVal}>{v}</div></div>))}</div><div className={s.personaSummary}>{a.summary || '—'}</div></div></div>); };

    // ═══ INSPIRATION ═══
    const renderInsp = () => (<><div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>💡 {lang === 'ar' ? 'الإلهام' : 'Inspiration'}</div><div className={s.secCount}>{filtInsps.length}</div><div className={s.secLine} /></div>
        <div className={s.inspFilters}>{(['all', 'ai_assistant', 'creative_team', 'account_manager'] as const).map(src => (<button key={src} className={`${s.inspFiltBtn} ${inspSrc === src ? s.inspFiltActive : ''}`} onClick={() => setInspSrc(src)}>{src === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : `${SOURCE_LABELS[src as InspirationSource].icon} ${lang === 'ar' ? SOURCE_LABELS[src as InspirationSource].ar : SOURCE_LABELS[src as InspirationSource].en}`}</button>))}</div>
        <div className={s.inspGrid}>{filtInsps.map(item => { const srcInfo = SOURCE_LABELS[item.source]; return (<div key={item.inspirationId} className={`${s.inspCard} ${item.pinned ? s.inspPinned : ''}`}><div className={s.inspThumb}>{item.thumbnail}</div><div className={s.inspContent}><div className={s.inspHead}><div className={s.inspTitle}>{item.title}</div><div className={s.inspBadges}><span className={s.inspRegion} style={{ color: item.regionType === 'global' ? '#6366f1' : '#f59e0b', borderColor: item.regionType === 'global' ? 'rgba(99,102,241,.2)' : 'rgba(245,158,11,.2)', background: item.regionType === 'global' ? 'rgba(99,102,241,.08)' : 'rgba(245,158,11,.08)' }}>{item.regionType === 'global' ? '🌍' : '📍'}</span><span className={s.inspSource} style={{ color: srcInfo.color }}>{srcInfo.icon}</span></div></div><div className={s.inspWhy}><strong>{lang === 'ar' ? 'لماذا' : 'Why'}:</strong> {lang === 'ar' ? item.whySelected : item.whySelectedEn}</div><div className={s.inspActions}><button className={s.inspActBtn} onClick={() => store.togglePin(item.inspirationId)}>{item.pinned ? '📌' : '📌'}</button><button className={s.inspActBtn} onClick={() => store.toggleRecommend(item.inspirationId)}>{item.recommended ? '⭐' : '☆'}</button>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className={s.inspActBtn}>🔗</a>}</div></div></div>); })}</div>
        {filtInsps.length === 0 && <div className={s.emptyMsg}>💡 {lang === 'ar' ? 'لا مراجع' : 'No references'}</div>}</>);

    // ═══ SHOWCASE ═══
    const renderShowcase = () => (<>{showcase.length === 0 && <div className={s.emptyMsg}>🏆 {lang === 'ar' ? 'ستظهر هنا' : 'Appear here'}</div>}{showcase.length > 0 && <div className={s.showcaseWrap}><div className={s.showcaseTrack}>{showcase.map((v, i) => (<div key={`${v.showcaseId}_${i}`} className={s.showcaseTile}><div className={s.showcaseScreen}><div className={s.showcasePlay}>▶</div></div><div className={s.showcaseLabel}><span className={s.showcaseTitle}>{v.title}</span><span className={s.showcaseMeta}>{catL[v.category]} • ✅ {v.approvedAt}</span></div></div>))}</div></div>}</>);

    // ═══ RENDER REQUEST MODAL ═══
    const renderModal = () => {
        if (!selReq) return null;
        const r = selReq; const sm = STAGE_META[r.status]; const live = store.requests.find(x => x.requestId === r.requestId) || r;
        const conceptWriter = TEAM_MEMBERS.find(m => m.id === r.conceptWriterId);
        const executor = TEAM_MEMBERS.find(m => m.id === r.executorId);
        const videoOwner = TEAM_MEMBERS.find(m => m.id === r.videoOwnerId);
        const aiRec = store.getAiRecommendation(r.requestId);
        const designers = TEAM_MEMBERS.filter(m => m.skills.includes('design'));
        const videographers = TEAM_MEMBERS.filter(m => m.skills.includes('video'));
        const allAssignable = TEAM_MEMBERS.filter(m => m.id !== 'yousef');

        return (<div className={s.modalOverlay} onClick={() => setSelReq(null)}><div className={s.modalContent} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}><div><div className={s.modalTitle}>{CATEGORY_ICONS[r.category]} {r.title}</div><div className={s.modalSub}>{catL[r.category]} • {r.platform} {r.isVideoTask && '🎬'}</div></div><button className={s.modalClose} onClick={() => setSelReq(null)}>✕</button></div>
            <div className={s.modalBody}>
                {/* Stage bar */}
                <div className={s.stageBar}><div className={s.stageInfo}>
                    <span className={s.stageBadge} style={{ color: sm.color, borderColor: `${sm.color}30`, background: `${sm.color}10` }}>● {lang === 'ar' ? sm.ar : sm.en}</span>
                    <span className={s.stageOwner}>👤 {lang === 'ar' ? sm.owner_ar : sm.owner_en}</span>
                    <span className={s.stageNext}>▶ {lang === 'ar' ? sm.nextAction_ar : sm.nextAction_en}</span>
                </div></div>
                {r.blocked && <div className={s.blockerBanner}>⛔ {r.blockReason}</div>}

                {/* Dual Approval Status */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid', borderColor: r.cdPrelimApproval ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.2)', background: r.cdPrelimApproval ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.04)', color: r.cdPrelimApproval ? '#22c55e' : '#ef4444' }}>{r.cdPrelimApproval ? '✅' : '⏳'} {lang === 'ar' ? 'أولية — المدير الإبداعي' : 'Prelim — CD'}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid', borderColor: r.amFinalIdeaApproval ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.2)', background: r.amFinalIdeaApproval ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.04)', color: r.amFinalIdeaApproval ? '#22c55e' : '#ef4444' }}>{r.amFinalIdeaApproval ? '✅' : '⏳'} {lang === 'ar' ? 'نهائية — مدير الحساب' : 'Final — AM'}</span>
                </div>

                {/* Marketing source */}
                {r.linkedMarketingTaskId && (<div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', background: 'rgba(20,184,166,.05)', border: '1px solid rgba(20,184,166,.15)', borderRadius: 8, marginBottom: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#14b8a6' }}>📋 {lang === 'ar' ? 'من التسويق' : 'From Marketing'}</span><Link href="/" style={{ fontSize: 11, color: '#14b8a6', fontWeight: 600, textDecoration: 'none', marginInlineStart: 'auto' }}>→</Link></div>)}

                {/* ─── ASSIGNMENT INFO SECTION ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'كاتب المفهوم' : 'Concept Writer'}</div><div className={s.modVal}>{conceptWriter ? `${conceptWriter.avatar} ${conceptWriter.name}` : '—'} {r.conceptAssignedBy !== 'manual' && <span style={{ fontSize: 9, opacity: .6 }}>({ASRC[r.conceptAssignedBy]?.[lang === 'ar' ? 0 : 1]})</span>}</div></div>
                    <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'المنفذ' : 'Executor'}</div><div className={s.modVal}>{executor ? `${executor.avatar} ${executor.name}` : '—'} {r.executionAssignedBy !== 'manual' && <span style={{ fontSize: 9, opacity: .6 }}>({ASRC[r.executionAssignedBy]?.[lang === 'ar' ? 0 : 1]})</span>}</div></div>
                    {r.isVideoTask && <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'مالك الفيديو' : 'Video Owner'}</div><div className={s.modVal} style={{ color: '#f59e0b' }}>{videoOwner ? `${videoOwner.avatar} ${videoOwner.name}` : '—'}</div></div>}
                    {r.isVideoTask && <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'حالة التقويم' : 'Calendar'}</div><div className={s.modVal} style={{ color: r.calendarStatus === 'confirmed' ? '#22c55e' : r.calendarStatus === 'tentative' ? '#f59e0b' : 'inherit' }}>{r.calendarStatus === 'confirmed' ? '✅' : r.calendarStatus === 'tentative' ? '⏳' : '—'} {r.calendarStatus !== 'none' ? (lang === 'ar' ? (r.calendarStatus === 'confirmed' ? 'مؤكد' : 'مبدئي') : r.calendarStatus) : ''}</div></div>}
                    {r.isVideoTask && <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'تسليم المفهوم' : 'Concept Delivery'}</div><div className={s.modVal}>{r.conceptDeliveredToVideo ? '✅' : '⏳'}</div></div>}
                </div>

                {/* AI Recommendation */}
                {aiRec && <div style={{ padding: '6px 10px', background: 'rgba(20,184,166,.04)', border: '1px solid rgba(20,184,166,.12)', borderRadius: 8, marginBottom: 8, fontSize: 11 }}><strong>🤖 AI:</strong> {lang === 'ar' ? aiRec.reason_ar : aiRec.reason_en}</div>}

                {/* ─── ACTION BUTTONS ─── */}
                <div className={s.actionBar} style={{ flexWrap: 'wrap' }}>
                    {/* 1. Assign Concept Writer */}
                    {(r.status === 'brief_ready' || (r.status === 'concept_writing' && !r.conceptWriterId)) && (
                        <select className={`${s.actBtn} ${s.actApprove}`} style={{ cursor: 'pointer' }} onChange={e => { if (e.target.value) { store.assignConceptWriter(r.requestId, e.target.value, 'creative_director', lang); setSelReq(null); } }} defaultValue="">
                            <option value="" disabled>✏️ {lang === 'ar' ? 'تعيين كاتب المفهوم' : 'Assign Concept Writer'}</option>
                            {allAssignable.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name} ({m.roleEn})</option>)}
                        </select>
                    )}
                    {/* 2. Reassign Concept Writer */}
                    {r.status === 'concept_writing' && r.conceptWriterId && (
                        <select className={`${s.actBtn} ${s.actChange}`} style={{ cursor: 'pointer' }} onChange={e => { if (e.target.value) { store.assignConceptWriter(r.requestId, e.target.value, 'creative_director', lang); setSelReq(null); } }} defaultValue="">
                            <option value="" disabled>🔄 {lang === 'ar' ? 'إعادة تعيين' : 'Reassign Writer'}</option>
                            {allAssignable.filter(m => m.id !== r.conceptWriterId).map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                        </select>
                    )}
                    {/* 3. Approve Concept Preliminary (CD) */}
                    {r.status === 'concept_approval' && !r.cdPrelimApproval && (
                        <button className={`${s.actBtn} ${s.actApprove}`} onClick={() => { store.approvePreliminary(r.requestId, lang); setSelReq(null); }}>✅ {lang === 'ar' ? 'موافقة أولية CD' : 'CD Prelim Approve'}</button>
                    )}
                    {/* 4. Approve Final Idea (AM) */}
                    {r.status === 'concept_approval' && !r.amFinalIdeaApproval && (
                        <button className={`${s.actBtn} ${s.actApprove}`} onClick={() => { store.approveIdeaFinal(r.requestId, lang); setSelReq(null); }}>✅ {lang === 'ar' ? 'موافقة نهائية AM' : 'AM Final Approve'}</button>
                    )}
                    {/* 5. Request Concept Changes */}
                    {r.status === 'concept_approval' && (
                        <button className={`${s.actBtn} ${s.actChange}`} onClick={() => { const n = prompt(lang === 'ar' ? 'ملاحظات:' : 'Notes:'); if (n !== null) { store.requestConceptChanges(r.requestId, n, lang); setSelReq(null); } }}>🔄 {lang === 'ar' ? 'تعديل المفهوم' : 'Request Changes'}</button>
                    )}
                    {/* 6. Recommend Video Owner (AI) */}
                    {r.isVideoTask && !r.videoOwnerId && aiRec && (
                        <button className={`${s.actBtn} ${s.actNext}`} onClick={() => { store.assignVideoOwner(r.requestId, aiRec.memberId, lang); setSelReq(null); }}>🤖 {lang === 'ar' ? `توصية: ${aiRec.memberName}` : `Recommend: ${aiRec.memberName}`}</button>
                    )}
                    {/* 7. Assign Video Owner (Yousef) */}
                    {r.isVideoTask && (
                        <select className={`${s.actBtn} ${s.actVideo}`} style={{ cursor: 'pointer' }} onChange={e => { if (e.target.value) { store.assignVideoOwner(r.requestId, e.target.value, lang); setSelReq(null); } }} defaultValue="">
                            <option value="" disabled>🎬 {lang === 'ar' ? 'تعيين مالك الفيديو' : 'Assign Video Owner'}</option>
                            {videographers.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                        </select>
                    )}
                    {/* 8. Override AI Assignment */}
                    {r.status === 'creative_execution' && r.executionAssignedBy === 'ai' && (
                        <select className={`${s.actBtn} ${s.actChange}`} style={{ cursor: 'pointer' }} onChange={e => { if (e.target.value) { store.assignExecutor(r.requestId, e.target.value, 'manual', lang); setSelReq(null); } }} defaultValue="">
                            <option value="" disabled>✋ {lang === 'ar' ? 'تغيير التعيين' : 'Override Assignment'}</option>
                            {allAssignable.filter(m => m.id !== r.executorId).map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                        </select>
                    )}
                    {/* 9. Mark Tentative / Confirm Calendar */}
                    {r.isVideoTask && r.calendarStatus === 'none' && <button className={`${s.actBtn} ${s.actNext}`} onClick={() => { store.markTentative(r.requestId, lang); setSelReq(null); }}>⏳ {lang === 'ar' ? 'حجز مبدئي' : 'Mark Tentative'}</button>}
                    {r.isVideoTask && r.calendarStatus === 'tentative' && <button className={`${s.actBtn} ${s.actApprove}`} onClick={() => { store.confirmCalendarSlot(r.requestId, lang); setSelReq(null); }}>✅ {lang === 'ar' ? 'تأكيد الحجز' : 'Confirm Slot'}</button>}
                    {/* 10. Send Concept to Video Owner */}
                    {r.isVideoTask && r.videoOwnerId && !r.conceptDeliveredToVideo && r.status !== 'brief_ready' && r.status !== 'concept_writing' && (
                        <button className={`${s.actBtn} ${s.actNext}`} onClick={() => { store.deliverConceptToVideo(r.requestId, lang); setSelReq(null); }}>📨 {lang === 'ar' ? 'تسليم المفهوم' : 'Deliver Concept'}</button>
                    )}
                    {/* 11. Request Revisions (CD Review) */}
                    {r.status === 'review_revisions' && (<>
                        <button className={`${s.actBtn} ${s.actApprove}`} onClick={() => { store.cdApprove(r.requestId, lang); setSelReq(null); }}>🎉 {lang === 'ar' ? 'اعتماد نهائي' : 'Final Approve'}</button>
                        <button className={`${s.actBtn} ${s.actChange}`} onClick={() => { const n = prompt(lang === 'ar' ? 'ملاحظات:' : 'Notes:'); if (n !== null) { store.cdRequestChanges(r.requestId, n, lang); setSelReq(null); } }}>🔄 {lang === 'ar' ? 'تعديلات' : 'Revisions'}</button>
                    </>)}
                    {/* Next Stage (generic) */}
                    {r.status !== 'approved_ready' && r.status !== 'concept_approval' && r.status !== 'review_revisions' && (
                        <button className={`${s.actBtn} ${s.actNext}`} onClick={() => { const idx = PIPELINE_STAGES.indexOf(r.status); const next = idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : r.status; store.moveToStage(r.requestId, next, lang); setSelReq(null); }}>▶ {lang === 'ar' ? 'التالي' : 'Next'}</button>
                    )}
                    {/* Block/Unblock */}
                    {!r.blocked && r.status !== 'approved_ready' && <button className={`${s.actBtn} ${s.actBlock}`} onClick={() => { const reason = prompt(lang === 'ar' ? 'السبب:' : 'Reason:'); if (reason) { store.markBlocked(r.requestId, reason, lang); setSelReq(null); } }}>⛔</button>}
                    {r.blocked && <button className={`${s.actBtn} ${s.actApprove}`} onClick={() => { store.unblock(r.requestId, lang); setSelReq(null); }}>🔓</button>}
                    {/* Upload */}
                    <button className={`${s.actBtn} ${s.actUpload}`} onClick={() => fileRef.current?.click()}>📎</button>
                    <button className={`${s.actBtn} ${s.actVideo}`} onClick={() => videoRef.current?.click()}>🎬</button>
                </div>

                {/* Fields */}
                <div className={s.modalGrid}>
                    <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'الأولوية' : 'Priority'}</div><div className={s.modVal}><span className={`${s.badge} ${s['p' + r.priority[0].toUpperCase()]}`}>{pL[r.priority]}</span></div></div>
                    <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'التسليم' : 'Due'}</div><div className={s.modVal}>📅 {r.dueDate}</div></div>
                    <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'الجولة' : 'Round'}</div><div className={s.modVal}>{r.reviewRound}</div></div>
                    <div className={s.modField}><div className={s.modLabel}>{lang === 'ar' ? 'مصدر التعيين' : 'Assignment Source'}</div><div className={s.modVal}>{ASRC[r.executionAssignedBy]?.[lang === 'ar' ? 0 : 1] || '—'}</div></div>
                </div>
                {r.objective && <div className={`${s.modField} ${s.modFull}`}><div className={s.modLabel}>{lang === 'ar' ? 'الهدف' : 'Objective'}</div><div className={s.modVal}>{r.objective}</div></div>}
                {r.brief && <div className={`${s.modField} ${s.modFull}`}><div className={s.modLabel}>{lang === 'ar' ? 'البريف' : 'Brief'}</div><div className={s.modVal}>{r.brief}</div></div>}
                {live.attachments.length > 0 && <div className={s.attList}><div className={s.modLabel}>📎 ({live.attachments.length})</div>{live.attachments.map((a, i) => <span key={i} className={s.attChip}>📄 {a}</span>)}</div>}
                {r.aiRecommendation && <div style={{ padding: '6px 10px', background: 'rgba(20,184,166,.04)', border: '1px solid rgba(20,184,166,.12)', borderRadius: 8, marginBottom: 8, fontSize: 11 }}><strong>🤖</strong> {r.aiRecommendation}</div>}
                {r.creativeDirectorNotes && <div className={`${s.modField} ${s.modFull}`} style={{ borderRight: '3px solid #ec4899' }}><div className={s.modLabel}>🎨 {lang === 'ar' ? 'ملاحظات CD' : 'CD Notes'}</div><div className={s.modVal}>{r.creativeDirectorNotes}</div></div>}

                {/* Version history */}
                {live.versionHistory.length > 0 && <div style={{ marginBottom: 8 }}><div className={s.modLabel}>📜 {lang === 'ar' ? 'سجل المراجعات' : 'Revision History'}</div>{live.versionHistory.map((v, i) => <div key={i} style={{ fontSize: 11, padding: '2px 0', color: 'var(--text-muted)' }}>v{v.version} — {v.note} ({v.date})</div>)}</div>}

                {/* Comments */}
                <div className={s.commentThread}><div className={s.commentTitle}>💬 ({live.comments.length})</div>{live.comments.map(c => (<div key={c.id} className={s.commentItem}><div className={s.commentAv}>{c.avatar}</div><div className={s.commentBody}><div className={s.commentSender}>{c.sender} <span className={s.chatTime}>{c.time}</span></div><div className={s.commentText}>{c.text}</div></div></div>))}<div className={s.commentInputRow}><input className={s.commentInput} placeholder={lang === 'ar' ? 'تعليق...' : 'Comment...'} value={commentIn} onChange={e => setCommentIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()} /><button className={s.commentSend} onClick={sendComment}>{lang === 'ar' ? 'إرسال' : 'Send'}</button></div></div>
            </div>
        </div></div>);
    };

    return (
        <div className={s.workspace} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {toast && <div className={s.toast}>{toast}</div>}
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => onFile(e, 'att')} />
            <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => onFile(e, 'vid')} />

            <header className={s.header}><div className={s.headerR}><Link href="/creative" className={s.backBtn}>{lang === 'ar' ? '← المقر الإبداعي' : '← Creative HQ'}</Link><div className={s.clientHead}><div className={s.clientAv} style={{ background: profile ? `linear-gradient(135deg,${profile.primaryColor},${profile.secondaryColor})` : undefined }}>{client.avatar}</div><div><div className={s.clientName}>{client.name}</div><div className={s.clientSub}>{client.sector} • {client.planType}</div></div></div></div><div className={s.headerL}><button className={s.iconBtn} onClick={toggleTheme}>🌙</button><button className={s.iconBtn} onClick={toggleLang}>🌐</button></div></header>

            <div className={s.tabs}>{allTabs.map(t => <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>{tabLabels[t]}</button>)}</div>

            <main className={s.content}>
                {tab === 'overview' && (<><div className={s.kpiRow}>{[[lang === 'ar' ? 'نشطة' : 'Active', kA, '#3b82f6'], [lang === 'ar' ? 'قرارات' : 'Decisions', kR, '#ec4899'], [lang === 'ar' ? 'محظور' : 'Blocked', kB, kB > 0 ? '#ef4444' : '#6b7280'], [lang === 'ar' ? 'جاهز' : 'Ready', kH, '#22c55e']].map(([l, v, c], i) => (<div key={i} className={s.kpiCard} style={{ borderRight: `4px solid ${c}` }}><div className={s.kpiLabel}>{l as string}</div><div className={s.kpiValue} style={{ color: c as string }}>{v as number}</div></div>))}</div>
                    {client.linkedFromMarketing && (() => { const ctx = store.getLinkedMarketingContext(clientId); return (<div className={s.mktContext}><div className={s.secHeader}><div className={s.secLine} /><div className={s.secTitle}>🔗 {lang === 'ar' ? 'سياق التسويق' : 'Marketing'}</div><div className={s.secLine} /></div><div className={s.mktRow}><div className={s.mktBadge} style={{ color: '#14b8a6' }}>🔗 {ctx.taskCount} {lang === 'ar' ? 'مهمة' : 'tasks'}</div><Link href="/" className={s.mktLink}>📋 →</Link></div></div>); })()}
                    {renderPipe()}<div className={s.twoCol}>{renderChat()}{renderCal()}</div></>)}
                {tab === 'requests' && renderPipe()}
                {tab === 'chat' && renderChat()}
                {tab === 'calendar' && renderCal()}
                {tab === 'brand' && renderAssets()}
                {tab === 'ai' && renderProfile()}
                {tab === 'inspiration' && renderInsp()}
                {tab === 'showcase' && renderShowcase()}
            </main>

            {renderModal()}
        </div>
    );
}
