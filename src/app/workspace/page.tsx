'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import s from './page.module.css';
import { TEAM, DEPT_LABELS, ROLE_LABELS, getVisibleDepartments, type TeamMember, type Department } from '@/lib/teamStore';
import { useSettings } from '@/lib/useSettings';
import { getCreativeStore, STAGE_META, PIPELINE_STAGES, CATEGORY_ICONS, type CreativeRequest } from '@/lib/creativeStore';
import { getProductionStore } from '@/lib/productionStore';
import { getPublishingStore } from '@/lib/publishingStore';
import { getChatStore, type ChatMessage as CM, type ChatRoom } from '@/lib/chatStore';

export default function Workspace() {
    const cs = getCreativeStore(); const ps = getProductionStore(); const pub = getPublishingStore(); const chat = getChatStore();
    const csV = useSyncExternalStore(cb => cs.subscribe(cb), () => cs.getVersion(), () => 0);
    const psV = useSyncExternalStore(cb => ps.subscribe(cb), () => ps.getVersion(), () => 0);
    const pubV = useSyncExternalStore(cb => pub.subscribe(cb), () => pub.getVersion(), () => 0);
    const chatV = useSyncExternalStore(cb => chat.subscribe(cb), () => chat.getVersion(), () => 0);

    const { theme, lang, user, userId, toggleTheme, toggleLang, switchUser } = useSettings();
    const [chatRoom, setChatRoom] = useState('room_company');
    const [chatIn, setChatIn] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [toast, setToast] = useState('');
    const [chatMode, setChatMode] = useState<'closed' | 'full' | 'mini'>('closed');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notifSettings, setNotifSettings] = useState({ newTasks: true, approvals: true, mentions: true, deadlines: true, chat: true, dailySummary: false, weeklyReport: true });
    const [displaySettings, setDisplaySettings] = useState({ compactCards: false, showAvatars: true, showDeadlineBadges: true, animationsEnabled: true });
    const [workSettings, setWorkSettings] = useState({ autoAcceptTasks: false, defaultPriority: 'medium' as string, workingHoursStart: '09:00', workingHoursEnd: '17:00' });

    const ar = lang === 'ar';
    const userRoles = user.roles;
    const visibleDepts = getVisibleDepartments(user.id);
    const isCEO = userRoles.includes('ceo');
    const isOps = userRoles.includes('operations_manager');
    const isAM = userRoles.includes('account_manager');
    const isCD = userRoles.includes('creative_director');
    const isDesigner = userRoles.includes('designer');
    const isMktMgr = userRoles.includes('marketing_manager');
    const isVid = userRoles.includes('videographer_editor');
    const isAIDev = userRoles.includes('ai_developer');
    const isPubMgr = userRoles.includes('publishing_manager');
    const [calSelectedDay, setCalSelectedDay] = useState<string>('');

    useEffect(() => { const t = cs.getToast(); if (t.msg) { setToast(t.msg); setTimeout(() => setToast(''), 3000); } }, [csV]);

    // ── Gather Data ──
    const allReqs = cs.requests;
    const activeReqs = allReqs.filter(r => cs.isActive(r));
    const myReqs = activeReqs.filter(r => r.executorId === user.id || r.conceptWriterId === user.id || r.videoOwnerId === user.id || r.assignedTo.includes(user.name));
    const myOverdue = myReqs.filter(r => r.dueDate && new Date(r.dueDate) < new Date());
    const myBlocked = myReqs.filter(r => r.blocked);
    const allJobs = ps.jobs || [];
    const myJobs = allJobs.filter((j: any) => j.owner === user.name || j.assignedTeam?.includes(user.name) || j.assignedTeam?.includes(user.id));
    const allPosts = pub.posts || [];
    const clients = cs.clients;
    const pendingApprovals: { id: string; title: string; type: string; client: string; action: string }[] = [];

    if (isCD || isCEO) { allReqs.filter(r => r.status === 'concept_approval' && !r.cdPrelimApproval).forEach(r => pendingApprovals.push({ id: r.requestId, title: r.title, type: 'creative', client: cs.getClient(r.clientId)?.name || '', action: ar ? 'موافقة أولية CD' : 'CD Prelim' })); }
    if (isAM || isCEO) { allReqs.filter(r => r.status === 'concept_approval' && !r.amFinalIdeaApproval).forEach(r => pendingApprovals.push({ id: r.requestId, title: r.title, type: 'creative', client: cs.getClient(r.clientId)?.name || '', action: ar ? 'موافقة نهائية AM' : 'AM Final' })); }
    if (isCD || isCEO) { allReqs.filter(r => r.status === 'review_revisions').forEach(r => pendingApprovals.push({ id: r.requestId, title: r.title, type: 'creative', client: cs.getClient(r.clientId)?.name || '', action: ar ? 'مراجعة CD' : 'CD Review' })); }

    // Chat
    const myRooms = chat.getRoomsForMember(user.id);
    const activeRoom = chat.getRoom(chatRoom) || myRooms[0];
    const roomMsgs = activeRoom ? chat.getRoomMessages(activeRoom.roomId) : [];
    const unread = chat.getUnreadCount(user.id);
    const notifs = chat.getNotifications(user.id).slice(0, 10);
    const sendChat = () => { if (!chatIn.trim() || !activeRoom) return; chat.sendMessage(activeRoom.roomId, chatIn, user.id); setChatIn(''); };

    // ── AI Assistant ──
    const handleAI = () => {
        if (!aiInput.trim()) return;
        const q = aiInput.toLowerCase();
        const replies = ar ? {
            tasks: `📋 لديك ${myReqs.length} مهمة نشطة و ${myOverdue.length} متأخرة. ${pendingApprovals.length > 0 ? `⚠️ ${pendingApprovals.length} موافقة معلقة تحتاج اهتمامك.` : '✅ لا توجد موافقات معلقة.'}`,
            report: `📊 ملخص اليوم:\n• عملاء: ${clients.length}\n• طلبات نشطة: ${activeReqs.length}\n• مهام إنتاج: ${allJobs.length}\n• منشورات: ${allPosts.length}\n• محظور: ${activeReqs.filter(r => r.blocked).length}`,
            suggest: `💡 اقتراحات:\n1. راجع ${pendingApprovals.length} موافقة معلقة\n2. تابع ${myOverdue.length} مهمة متأخرة\n3. تحقق من حالة ${activeReqs.filter(r => r.blocked).length} طلب محظور`,
            default: `🤖 مرحباً ${user.name}! لديك ${myReqs.length} مهمة نشطة. هل تحتاج مساعدة في شيء محدد؟ جرب: "مهامي" أو "تقرير" أو "اقتراحات"`
        } : {
            tasks: `📋 You have ${myReqs.length} active tasks and ${myOverdue.length} overdue. ${pendingApprovals.length > 0 ? `⚠️ ${pendingApprovals.length} pending approvals need attention.` : '✅ No pending approvals.'}`,
            report: `📊 Today's summary:\n• Clients: ${clients.length}\n• Active requests: ${activeReqs.length}\n• Production jobs: ${allJobs.length}\n• Posts: ${allPosts.length}\n• Blocked: ${activeReqs.filter(r => r.blocked).length}`,
            suggest: `💡 Suggestions:\n1. Review ${pendingApprovals.length} pending approvals\n2. Follow up on ${myOverdue.length} overdue tasks\n3. Check ${activeReqs.filter(r => r.blocked).length} blocked requests`,
            default: `🤖 Hello ${user.name}! You have ${myReqs.length} active tasks. Need help? Try: "my tasks", "report", or "suggestions"`
        };
        const resp = q.includes('مهام') || q.includes('task') ? replies.tasks : q.includes('تقرير') || q.includes('report') ? replies.report : q.includes('اقتراح') || q.includes('suggest') ? replies.suggest : replies.default;
        setAiResponse(resp);
        setAiInput('');
    };

    // ── Greeting ──
    const hour = new Date().getHours();
    const greet = hour < 12 ? (ar ? 'صباح الخير' : 'Good Morning') : hour < 18 ? (ar ? 'مساء الخير' : 'Good Afternoon') : (ar ? 'مساء الخير' : 'Good Evening');

    // ═══════════ WIDGETS ═══════════

    // ── AI Hero ──
    const renderAIHero = () => (
        <div className={s.aiHero}>
            <div className={s.aiHeroHeader}>
                <span className={s.aiSparkle}>✨</span>
                <span className={s.aiTitle}>{ar ? 'مساعد Remark الذكي' : 'Remark AI Assistant'}</span>
            </div>
            <div className={s.aiInputWrap}>
                <input className={s.aiInput} placeholder={ar ? 'اسأل مساعد Remark أي شيء...' : 'Ask Remark AI anything...'} value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAI()} />
                <button className={s.aiSend} onClick={handleAI}>➤</button>
            </div>
            <div className={s.aiChips}>
                <button className={s.aiChip} onClick={() => { setAiInput(ar ? 'مهامي' : 'my tasks'); setTimeout(handleAI, 50); }}>📋 {ar ? 'مهامي' : 'My Tasks'}</button>
                <button className={s.aiChip} onClick={() => { setAiInput(ar ? 'تقرير' : 'report'); setTimeout(handleAI, 50); }}>📊 {ar ? 'تقرير اليوم' : 'Daily Report'}</button>
                <button className={s.aiChip} onClick={() => { setAiInput(ar ? 'اقتراحات' : 'suggestions'); setTimeout(handleAI, 50); }}>💡 {ar ? 'اقتراحات' : 'Suggestions'}</button>
                {pendingApprovals.length > 0 && <button className={s.aiChip} onClick={() => setAiResponse(ar ? `⏳ لديك ${pendingApprovals.length} موافقة معلقة: ${pendingApprovals.map(a => a.title).join('، ')}` : `⏳ You have ${pendingApprovals.length} pending approvals: ${pendingApprovals.map(a => a.title).join(', ')}`)}>⏳ {ar ? 'موافقات' : 'Approvals'} ({pendingApprovals.length})</button>}
            </div>
            {aiResponse && <div className={s.aiResponse} style={{ whiteSpace: 'pre-line' }}>{aiResponse}</div>}
        </div>
    );

    // ── KPI Card ──
    const KPI = ({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) => (
        <div className={s.kpiCard} style={{ ['--kpi-color' as any]: color }}>
            <div className={s.kpiIcon}>{icon}</div>
            <div className={s.kpiValue} style={{ color }}>{value}</div>
            <div className={s.kpiLabel}>{label}</div>
            <style jsx>{`.kpiCard::after { background: ${color}; }`}</style>
        </div>
    );

    // ── Section Wrapper ──
    const Section = ({ icon, title, count, children }: { icon: string; title: string; count?: number; children: React.ReactNode }) => (
        <div className={s.section}>
            <div className={s.secHeader}>
                <span className={s.secIcon}>{icon}</span>
                <span className={s.secTitle}>{title}</span>
                {count !== undefined && <span className={s.secCount}>{count}</span>}
                <div className={s.secLine} />
            </div>
            {children}
        </div>
    );

    // ── Task List ──
    const renderTasks = (tasks: any[], max = 6) => (
        <div className={s.taskList}>
            {tasks.length === 0 && <div className={s.empty}>✅ {ar ? 'لا توجد مهام' : 'No tasks'}</div>}
            {tasks.slice(0, max).map((t: any, i: number) => {
                const isReq = !!t.requestId;
                return (
                    <div key={t.requestId || t.productionJobId || i} className={s.taskItem}>
                        <div className={s.taskIcon}>{isReq ? CATEGORY_ICONS[t.category] || '📋' : '🎬'}</div>
                        <div className={s.taskInfo}>
                            <div className={s.taskTitle}>{t.title}</div>
                            <div className={s.taskMeta}>{isReq ? `${cs.getClient(t.clientId)?.name || ''} • ${STAGE_META[t.status as keyof typeof STAGE_META]?.[ar ? 'ar' : 'en'] || t.status}` : `${t.category || ''}`}</div>
                        </div>
                        {(t.dueDate || t.deadline) && <div className={s.taskBadge} style={{ color: new Date(t.dueDate || t.deadline) < new Date() ? '#ef4444' : '#6b7280', borderColor: new Date(t.dueDate || t.deadline) < new Date() ? 'rgba(239,68,68,.2)' : 'rgba(0,0,0,.08)' }}>📅 {t.dueDate || t.deadline}</div>}
                        {t.blocked && <div className={s.taskBadge} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,.2)' }}>⛔</div>}
                    </div>
                );
            })}
        </div>
    );

    // ── Approvals ──
    const renderApprovals = () => {
        if (pendingApprovals.length === 0) return null;
        return (
            <Section icon="⏳" title={ar ? 'موافقات معلقة' : 'Pending Approvals'} count={pendingApprovals.length}>
                {pendingApprovals.map(a => (
                    <div key={`${a.id}_${a.action}`} className={s.approvalItem}>
                        <div className={s.approvalInfo}>
                            <div className={s.approvalTitle}>{a.title}</div>
                            <div className={s.approvalMeta}>{a.client} • {a.action}</div>
                        </div>
                        <Link href={`/creative/client/${allReqs.find(r => r.requestId === a.id)?.clientId || ''}`} className={s.approvalBtn}>→ {ar ? 'مراجعة' : 'Review'}</Link>
                    </div>
                ))}
            </Section>
        );
    };

    // ── Boards ──
    const renderBoards = () => {
        const boards: { icon: string; name: string; desc: string; href: string; count: number; color: string }[] = [];
        if (visibleDepts.includes('marketing') || isCEO) boards.push({ icon: '📊', name: ar ? 'التسويق' : 'Marketing', desc: ar ? 'العملاء والحملات' : 'Clients & Campaigns', href: '/', count: clients.length, color: '#06b6d4' });
        if (visibleDepts.includes('creative') || isCEO || isAM) boards.push({ icon: '🎨', name: ar ? 'الإبداعي' : 'Creative', desc: ar ? 'المفاهيم والتصاميم' : 'Concepts & Designs', href: '/creative', count: activeReqs.length, color: '#8b5cf6' });
        if (visibleDepts.includes('production') || isCEO || isOps) boards.push({ icon: '🎬', name: ar ? 'الإنتاج' : 'Production', desc: ar ? 'التصوير والمونتاج' : 'Filming & Editing', href: '/production', count: allJobs.length, color: '#ec4899' });
        if (visibleDepts.includes('publishing') || isCEO || isPubMgr) boards.push({ icon: '📢', name: ar ? 'النشر' : 'Publishing', desc: ar ? 'الجدولة والنشر' : 'Scheduling', href: '/publishing', count: allPosts.length, color: '#f97316' });
        boards.push({ icon: '💬', name: ar ? 'المحادثات' : 'Chat', desc: ar ? 'التواصل' : 'Communication', href: '/chat', count: unread, color: '#6366f1' });
        boards.push({ icon: '⚙️', name: ar ? 'الإعدادات' : 'Settings', desc: ar ? 'الفريق والأدوار' : 'Team & Roles', href: '/settings', count: 0, color: '#6b7280' });
        return (
            <Section icon="🏢" title={ar ? 'الأقسام' : 'Boards'}>
                <div className={s.boardsGrid}>
                    {boards.map(b => (
                        <Link key={b.href} href={b.href} className={s.boardCard}>
                            <div className={s.boardIcon}>{b.icon}</div>
                            <div className={s.boardName}>{b.name}</div>
                            <div className={s.boardDesc}>{b.desc}</div>
                            {b.count > 0 && <div className={s.boardCount} style={{ color: b.color }}>{b.count}</div>}
                        </Link>
                    ))}
                </div>
            </Section>
        );
    };

    // ── Chat ──
    const renderChat = () => (
        <div className={s.chatPanel}>
            <div className={s.chatHeader}>💬 {ar ? 'المحادثات' : 'Chat'} {unread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 8, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{unread}</span>}</div>
            <div className={s.chatRooms}>{myRooms.map(r => (<button key={r.roomId} className={`${s.roomBtn} ${chatRoom === r.roomId ? s.roomActive : ''}`} onClick={() => setChatRoom(r.roomId)}>{r.icon} {ar ? r.name : r.nameEn}</button>))}</div>
            <div className={s.chatMsgs}>
                {roomMsgs.slice(-12).map(m => (
                    <div key={m.messageId} className={s.chatMsg}>
                        <div className={s.chatAv}>{m.senderAvatar}</div>
                        <div className={`${s.chatBody} ${m.type === 'ai' ? s.chatAi : m.type === 'system' ? s.chatSys : ''}`}>
                            <div className={s.chatSender}>{m.senderName} <span className={s.chatTime}>{new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div className={s.chatText}>{m.text}</div>
                            {m.aiAction && m.aiAction.status === 'proposed' && (
                                <div className={s.aiAction}>
                                    <div className={s.aiActionDesc}>🤖 {m.aiAction.description}</div>
                                    <div className={s.aiActionBtns}>
                                        <button className={`${s.aiActionBtn} ${s.aiActionApprove}`} onClick={() => { chat.approveAIAction(m.aiAction!.actionId, user.id); chat.executeAIAction(m.aiAction!.actionId); }}>✅ {ar ? 'موافق' : 'Approve'}</button>
                                        <button className={`${s.aiActionBtn} ${s.aiActionReject}`} onClick={() => chat.rejectAIAction(m.aiAction!.actionId, user.id)}>❌ {ar ? 'رفض' : 'Reject'}</button>
                                    </div>
                                </div>
                            )}
                            {m.cardRefs.map((cr, ci) => (<div key={ci} className={s.cardPreview}><div className={s.cardPreviewTitle}>{cr.title}</div><div className={s.cardPreviewMeta}><span>{cr.clientName}</span><span>{cr.status}</span></div></div>))}
                        </div>
                    </div>
                ))}
                {roomMsgs.length === 0 && <div className={s.empty}>💬 {ar ? 'ابدأ المحادثة' : 'Start chatting'}</div>}
            </div>
            <div className={s.chatInputArea}>
                <input className={s.chatInput} placeholder={ar ? 'اكتب رسالة...' : 'Type a message...'} value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                <button className={s.chatSend} onClick={sendChat}>➤</button>
            </div>
        </div>
    );

    // ── Notifications ──
    const renderNotifs = () => {
        if (notifs.length === 0) return null;
        return (
            <Section icon="🔔" title={ar ? 'الإشعارات' : 'Notifications'} count={unread}>
                <div className={s.notifList}>
                    {notifs.map(n => (
                        <div key={n.id} className={`${s.notifItem} ${!n.read ? s.notifUnread : ''}`} onClick={() => chat.markRead(n.id)}>
                            <div className={s.notifIcon}>{n.type === 'mention' ? '💬' : n.type === 'approval' ? '✅' : n.type === 'ai_action' ? '🤖' : '🔔'}</div>
                            <div className={s.notifText}>{ar ? n.text : n.textEn}</div>
                            <div className={s.notifTime}>{new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    ))}
                </div>
            </Section>
        );
    };

    // ── Client Portfolio (for Account Managers) ──
    const renderClientPortfolio = () => {
        const myClients = isAM ? clients : clients;
        return (
            <Section icon="👤" title={ar ? 'محفظة العملاء' : 'Client Portfolio'} count={myClients.length}>
                <div className={s.clientGrid}>
                    {myClients.map(c => {
                        const cReqs = activeReqs.filter(r => r.clientId === c.clientId);
                        const cJobs = allJobs.filter((j: any) => j.clientId === c.clientId);
                        return (
                            <Link key={c.clientId} href={`/creative/client/${c.clientId}`} className={s.clientCard}>
                                <div className={s.clientHead}>
                                    <div className={s.clientAv} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>{c.avatar}</div>
                                    <div><div className={s.clientName}>{c.name}</div><div className={s.clientSub}>{c.sector} • {c.planType}</div></div>
                                </div>
                                <div className={s.clientStats}>
                                    <div className={s.clientStat}><div className={s.clientStatVal}>{cReqs.length}</div><div className={s.clientStatLabel}>{ar ? 'نشطة' : 'Active'}</div></div>
                                    <div className={s.clientStat}><div className={s.clientStatVal}>{cReqs.filter(r => r.blocked).length}</div><div className={s.clientStatLabel}>{ar ? 'محظور' : 'Blocked'}</div></div>
                                    <div className={s.clientStat}><div className={s.clientStatVal}>{cJobs.length}</div><div className={s.clientStatLabel}>{ar ? 'إنتاج' : 'Prod'}</div></div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </Section>
        );
    };

    // ── Team Workload (CEO/Ops) ──
    const renderTeamWorkload = () => (
        <Section icon="👥" title={ar ? 'حمل عمل الفريق' : 'Team Workload'} count={TEAM.length}>
            {TEAM.map(m => {
                const mActive = activeReqs.filter(r => r.executorId === m.id || r.conceptWriterId === m.id || r.videoOwnerId === m.id);
                const load = Math.min(mActive.length * 20, 100);
                const color = load > 60 ? '#ef4444' : load > 30 ? '#f59e0b' : '#22c55e';
                return (
                    <div key={m.id} className={s.workloadItem}>
                        <div className={s.workloadAvatar} style={{ background: `${m.color}20` }}>{m.avatar}</div>
                        <div className={s.workloadInfo}>
                            <div className={s.workloadName}>{m.name}</div>
                            <div className={s.workloadRole}>{m.position}</div>
                            <div className={s.workloadBar}><div className={s.workloadFill} style={{ width: `${load}%`, background: color }} /></div>
                        </div>
                        <div className={s.workloadCount} style={{ color }}>{mActive.length}</div>
                    </div>
                );
            })}
        </Section>
    );

    // ── Video Schedule (Videographers) ──
    const renderVideoSchedule = () => {
        const cal = cs.getVideographerCalendar(user.id);
        const allItems = [...cal.tentative.map(t => ({ ...t, type: 'tentative' })), ...cal.confirmed.map(t => ({ ...t, type: 'confirmed' }))];
        return (
            <Section icon="📅" title={ar ? 'جدول التصوير' : 'Shoot Schedule'} count={allItems.length}>
                {allItems.length === 0 && <div className={s.empty}>📅 {ar ? 'لا يوجد تصوير مجدول' : 'No shoots scheduled'}</div>}
                {allItems.map((item, i) => (
                    <div key={item.requestId || i} className={s.scheduleItem} style={{ borderLeftColor: item.type === 'confirmed' ? '#22c55e' : '#f59e0b' }}>
                        <div className={s.scheduleTime}>📅</div>
                        <div className={s.scheduleInfo}>
                            <div className={s.scheduleTitle}>{item.title}</div>
                            <div className={s.scheduleMeta}>{cs.getClient(item.clientId)?.name || ''} • {item.dueDate || ''}</div>
                        </div>
                        <div className={s.scheduleStatus} style={{ color: item.type === 'confirmed' ? '#22c55e' : '#f59e0b', background: item.type === 'confirmed' ? 'rgba(34,197,94,.08)' : 'rgba(245,158,11,.08)' }}>{item.type === 'confirmed' ? (ar ? '✅ مؤكد' : '✅ Confirmed') : (ar ? '⏳ مبدئي' : '⏳ Tentative')}</div>
                    </div>
                ))}
            </Section>
        );
    };

    // ── Video Assignments (Ops) ──
    const renderVideoAssignments = () => {
        const videoTasks = activeReqs.filter(r => r.isVideoTask);
        const unassigned = videoTasks.filter(r => !r.videoOwnerId);
        return (
            <Section icon="🎬" title={ar ? 'تعيينات الفيديو' : 'Video Assignments'} count={unassigned.length}>
                {videoTasks.length === 0 && <div className={s.empty}>✅ {ar ? 'لا توجد مهام فيديو' : 'No video tasks'}</div>}
                {videoTasks.map(r => (
                    <div key={r.requestId} className={s.taskItem}>
                        <div className={s.taskIcon}>🎬</div>
                        <div className={s.taskInfo}>
                            <div className={s.taskTitle}>{r.title}</div>
                            <div className={s.taskMeta}>{cs.getClient(r.clientId)?.name || ''} • {STAGE_META[r.status]?.[ar ? 'ar' : 'en']} {r.videoOwnerId ? `• 📹 ${TEAM.find(m => m.id === r.videoOwnerId)?.name || ''}` : ''}</div>
                        </div>
                        {!r.videoOwnerId && <div className={s.taskBadge} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,.2)' }}>⏳ {ar ? 'غير معين' : 'Unassigned'}</div>}
                    </div>
                ))}
            </Section>
        );
    };

    // ── Department Performance Reports (CEO) ──
    const renderDeptReports = () => {
        return Object.entries(DEPT_LABELS).map(([dept, info]) => {
            const dMembers = TEAM.filter(m => m.department === dept);
            const dReqs = activeReqs.filter(r => {
                const executor = TEAM.find(m => m.id === r.executorId);
                return executor?.department === dept;
            });
            const dOverdue = dReqs.filter(r => r.dueDate && new Date(r.dueDate) < new Date());
            const dBlocked = dReqs.filter(r => r.blocked);
            const dCompleted = allReqs.filter(r => {
                const executor = TEAM.find(m => m.id === r.executorId);
                return executor?.department === dept && (r.status as string) === 'delivered';
            });
            const dInReview = dReqs.filter(r => r.status === 'review_revisions' || r.status === 'concept_approval');
            const hasIssues = dOverdue.length > 0 || dBlocked.length > 0;
            const healthColor = hasIssues ? '#ef4444' : dReqs.length > 0 ? '#f59e0b' : '#22c55e';
            const healthLabel = hasIssues ? (ar ? 'يحتاج متابعة' : 'Needs Attention') : dReqs.length > 0 ? (ar ? 'يعمل' : 'Active') : (ar ? 'ممتاز' : 'Excellent');

            return (
                <div key={dept} className={s.deptReport} style={{ ['--dept-color' as any]: info.color }}>
                    <div className={s.deptReportHeader}>
                        <div className={s.deptReportIcon}>{info.icon}</div>
                        <div className={s.deptReportTitle}>{ar ? info.ar : info.en}</div>
                        <div className={s.deptReportHealth} style={{ color: healthColor, background: `${healthColor}12` }}>{healthLabel}</div>
                    </div>
                    <div className={s.deptReportStats}>
                        <div className={s.deptStat}>
                            <div className={s.deptStatVal} style={{ color: '#3b82f6' }}>{dReqs.length}</div>
                            <div className={s.deptStatLabel}>{ar ? 'نشطة' : 'Active'}</div>
                        </div>
                        <div className={s.deptStat}>
                            <div className={s.deptStatVal} style={{ color: '#22c55e' }}>{dCompleted.length}</div>
                            <div className={s.deptStatLabel}>{ar ? 'مكتملة' : 'Done'}</div>
                        </div>
                        <div className={s.deptStat}>
                            <div className={s.deptStatVal} style={{ color: '#f59e0b' }}>{dInReview.length}</div>
                            <div className={s.deptStatLabel}>{ar ? 'مراجعة' : 'Review'}</div>
                        </div>
                        <div className={s.deptStat}>
                            <div className={s.deptStatVal} style={{ color: dOverdue.length > 0 ? '#ef4444' : '#94a3b8' }}>{dOverdue.length}</div>
                            <div className={s.deptStatLabel}>{ar ? 'متأخرة' : 'Late'}</div>
                        </div>
                        <div className={s.deptStat}>
                            <div className={s.deptStatVal} style={{ color: dBlocked.length > 0 ? '#ef4444' : '#94a3b8' }}>{dBlocked.length}</div>
                            <div className={s.deptStatLabel}>{ar ? 'محظورة' : 'Blocked'}</div>
                        </div>
                    </div>
                    <div className={s.deptReportTeam}>
                        {dMembers.map(m => {
                            const mTasks = dReqs.filter(r => r.executorId === m.id || r.conceptWriterId === m.id || r.videoOwnerId === m.id);
                            return <span key={m.id} className={s.deptMember} title={`${m.name}: ${mTasks.length} ${ar ? 'مهمة' : 'tasks'}`}>{m.avatar}</span>;
                        })}
                        <span className={s.deptMemberCount}>{dMembers.length} {ar ? 'أعضاء' : 'members'}</span>
                    </div>
                </div>
            );
        });
    };

    // ── Review Queue (Creative Director) ──
    const renderReviewQueue = () => {
        const inReview = allReqs.filter(r => r.status === 'review_revisions' || (r.status === 'concept_approval' && !r.cdPrelimApproval));
        return (
            <Section icon="🔍" title={ar ? 'طابور المراجعة' : 'Review Queue'} count={inReview.length}>
                {inReview.length === 0 && <div className={s.empty}>✅ {ar ? 'لا توجد مراجعات' : 'No reviews pending'}</div>}
                {inReview.map(r => (
                    <Link key={r.requestId} href={`/creative/client/${r.clientId}`} style={{ textDecoration: 'none' }}>
                        <div className={s.approvalItem}>
                            <div className={s.approvalInfo}>
                                <div className={s.approvalTitle}>{CATEGORY_ICONS[r.category] || '📋'} {r.title}</div>
                                <div className={s.approvalMeta}>{cs.getClient(r.clientId)?.name || ''} • {r.executorId ? TEAM.find(m => m.id === r.executorId)?.name : ''} • {STAGE_META[r.status]?.[ar ? 'ar' : 'en']}</div>
                            </div>
                            <span className={s.approvalBtn}>→ {ar ? 'مراجعة' : 'Review'}</span>
                        </div>
                    </Link>
                ))}
            </Section>
        );
    };

    // ── Creative Team Status (Creative Director) ──
    const renderCreativeTeam = () => {
        const creativeMembers = TEAM.filter(m => m.department === 'creative' || m.roles.includes('designer'));
        return (
            <Section icon="🎨" title={ar ? 'فريق الإبداعي' : 'Creative Team'}>
                {creativeMembers.map(m => {
                    const mTasks = activeReqs.filter(r => r.executorId === m.id || r.conceptWriterId === m.id);
                    const load = Math.min(mTasks.length * 25, 100);
                    return (
                        <div key={m.id} className={s.workloadItem}>
                            <div className={s.workloadAvatar} style={{ background: `${m.color}20` }}>{m.avatar}</div>
                            <div className={s.workloadInfo}>
                                <div className={s.workloadName}>{m.name}</div>
                                <div className={s.workloadRole}>{mTasks.length} {ar ? 'مهمة نشطة' : 'active tasks'}</div>
                                <div className={s.workloadBar}><div className={s.workloadFill} style={{ width: `${load}%`, background: load > 60 ? '#ef4444' : load > 30 ? '#f59e0b' : '#22c55e' }} /></div>
                            </div>
                            <div className={s.workloadCount} style={{ color: load > 60 ? '#ef4444' : '#22c55e' }}>{mTasks.length}</div>
                        </div>
                    );
                })}
            </Section>
        );
    };

    // ── System Status (AI Dev) ──
    const renderSystemStatus = () => (
        <Section icon="🤖" title={ar ? 'حالة النظام' : 'System Status'}>
            <div className={s.kpiRow}>
                <div className={s.kpiCard}><div className={s.kpiIcon}>⚡</div><div className={s.kpiValue} style={{ color: '#14b8a6' }}>{chat.getPendingAIActions().length}</div><div className={s.kpiLabel}>{ar ? 'إجراءات AI معلقة' : 'Pending AI Actions'}</div></div>
                <div className={s.kpiCard}><div className={s.kpiIcon}>💬</div><div className={s.kpiValue} style={{ color: '#6366f1' }}>{chat.rooms.length}</div><div className={s.kpiLabel}>{ar ? 'غرف محادثة' : 'Chat Rooms'}</div></div>
                <div className={s.kpiCard}><div className={s.kpiIcon}>🔔</div><div className={s.kpiValue} style={{ color: '#f59e0b' }}>{chat.notifications.length}</div><div className={s.kpiLabel}>{ar ? 'إشعارات' : 'Notifications'}</div></div>
                <div className={s.kpiCard}><div className={s.kpiIcon}>👥</div><div className={s.kpiValue} style={{ color: '#22c55e' }}>{TEAM.length}</div><div className={s.kpiLabel}>{ar ? 'أعضاء الفريق' : 'Team Members'}</div></div>
            </div>
        </Section>
    );

    // ── Client Reports (CEO / Ops) ──
    const renderClientReports = () => {
        if (clients.length === 0) return null;
        return (
            <Section icon="📊" title={ar ? 'تقارير العملاء' : 'Client Reports'} count={clients.length}>
                <div className={s.clientReportsGrid}>
                    {clients.map(c => {
                        const cReqs = activeReqs.filter(r => r.clientId === c.clientId);
                        const cAll = allReqs.filter(r => r.clientId === c.clientId);
                        const cJobs = allJobs.filter((j: any) => j.clientId === c.clientId);
                        const cOverdue = cReqs.filter(r => r.dueDate && new Date(r.dueDate) < new Date());
                        const cBlocked = cReqs.filter(r => r.blocked);
                        const cCompleted = cAll.filter(r => (r.status as string) === 'delivered' || (r.status as string) === 'approved_ready');
                        const cPosts = allPosts.filter((p: any) => p.clientId === c.clientId);
                        const hasIssues = cOverdue.length > 0 || cBlocked.length > 0;
                        const healthColor = hasIssues ? '#ef4444' : cReqs.length > 0 ? '#3b82f6' : '#22c55e';
                        const healthIcon = hasIssues ? '⚠️' : cReqs.length > 0 ? '🔄' : '✅';
                        const healthLabel = hasIssues ? (ar ? 'يحتاج متابعة' : 'Needs Attention') : cReqs.length > 0 ? (ar ? 'قيد العمل' : 'In Progress') : (ar ? 'مستقر' : 'Stable');

                        // Stage breakdown
                        const stageBreakdown: { stage: string; count: number; color: string }[] = [];
                        const stages = ['brief_ready', 'concept_writing', 'concept_approval', 'creative_execution', 'review_revisions', 'approved_ready'] as const;
                        stages.forEach(st => {
                            const cnt = cReqs.filter(r => r.status === st).length;
                            if (cnt > 0) stageBreakdown.push({ stage: STAGE_META[st]?.[ar ? 'ar' : 'en'] || st, count: cnt, color: STAGE_META[st]?.color || '#6b7280' });
                        });

                        return (
                            <Link key={c.clientId} href={`/creative/client/${c.clientId}`} className={s.clientReport} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className={s.clientReportHeader}>
                                    <div className={s.clientReportAvatar} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>{c.avatar}</div>
                                    <div className={s.clientReportInfo}>
                                        <div className={s.clientReportName}>{c.name}</div>
                                        <div className={s.clientReportSub}>{c.sector} • {c.planType}</div>
                                    </div>
                                    <div className={s.clientReportHealth} style={{ color: healthColor, background: `${healthColor}12` }}>{healthIcon} {healthLabel}</div>
                                </div>
                                <div className={s.clientReportMetrics}>
                                    <div className={s.crMetric}>
                                        <div className={s.crMetricVal} style={{ color: '#3b82f6' }}>{cReqs.length}</div>
                                        <div className={s.crMetricLabel}>{ar ? 'نشطة' : 'Active'}</div>
                                    </div>
                                    <div className={s.crMetric}>
                                        <div className={s.crMetricVal} style={{ color: '#22c55e' }}>{cCompleted.length}</div>
                                        <div className={s.crMetricLabel}>{ar ? 'مكتملة' : 'Done'}</div>
                                    </div>
                                    <div className={s.crMetric}>
                                        <div className={s.crMetricVal} style={{ color: cOverdue.length > 0 ? '#ef4444' : '#94a3b8' }}>{cOverdue.length}</div>
                                        <div className={s.crMetricLabel}>{ar ? 'متأخرة' : 'Late'}</div>
                                    </div>
                                    <div className={s.crMetric}>
                                        <div className={s.crMetricVal} style={{ color: cBlocked.length > 0 ? '#ef4444' : '#94a3b8' }}>{cBlocked.length}</div>
                                        <div className={s.crMetricLabel}>{ar ? 'محظورة' : 'Blocked'}</div>
                                    </div>
                                    <div className={s.crMetric}>
                                        <div className={s.crMetricVal} style={{ color: '#ec4899' }}>{cJobs.length}</div>
                                        <div className={s.crMetricLabel}>{ar ? 'إنتاج' : 'Prod'}</div>
                                    </div>
                                    <div className={s.crMetric}>
                                        <div className={s.crMetricVal} style={{ color: '#f97316' }}>{cPosts.length}</div>
                                        <div className={s.crMetricLabel}>{ar ? 'منشورات' : 'Posts'}</div>
                                    </div>
                                </div>
                                {stageBreakdown.length > 0 && (
                                    <div className={s.clientReportStages}>
                                        {stageBreakdown.map((sb, i) => (
                                            <span key={i} className={s.crStagePill} style={{ color: sb.color, background: `${sb.color}12`, borderColor: `${sb.color}25` }}>{sb.stage} ({sb.count})</span>
                                        ))}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </Section>
        );
    };

    // ── Personal Calendar ──
    const renderPersonalCalendar = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = now.getDate();
        const monthNames = ar
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ar ? ['أحد', 'إث', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        // Build event map: dateStr -> event types
        const eventMap = new Map<string, { creative: number; production: number; publish: number; overdue: number }>();
        const addEvent = (dateStr: string, type: 'creative' | 'production' | 'publish' | 'overdue') => {
            if (!dateStr) return;
            const d = dateStr.slice(0, 10);
            if (!d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) return;
            const entry = eventMap.get(d) || { creative: 0, production: 0, publish: 0, overdue: 0 };
            entry[type]++;
            eventMap.set(d, entry);
        };

        // Collect events for this user
        myReqs.forEach(r => {
            if (r.dueDate) addEvent(r.dueDate, 'creative');
            if (r.publishDate) addEvent(r.publishDate, 'publish');
            if (r.dueDate && new Date(r.dueDate) < now) addEvent(r.dueDate, 'overdue');
        });
        myJobs.forEach((j: any) => {
            if (j.deadline) addEvent(j.deadline, 'production');
        });
        allPosts.filter((p: any) => p.owner === user.name || p.assignedTeam?.includes(user.name)).forEach((p: any) => {
            if (p.scheduledDate) addEvent(p.scheduledDate, 'publish');
        });

        const cells: React.ReactNode[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className={s.calCell} />);
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const ev = eventMap.get(dateStr);
            const isToday = d === today;
            const isSelected = calSelectedDay === dateStr;
            cells.push(
                <div key={d} className={`${s.calCell} ${isToday ? s.calToday : ''} ${isSelected ? s.calSelected : ''}`} onClick={() => setCalSelectedDay(dateStr === calSelectedDay ? '' : dateStr)}>
                    <span className={s.calDayNum}>{d}</span>
                    {ev && (
                        <div className={s.calDots}>
                            {ev.overdue > 0 && <span className={s.calDot} style={{ background: '#ef4444' }} />}
                            {ev.creative > 0 && <span className={s.calDot} style={{ background: '#6366f1' }} />}
                            {ev.production > 0 && <span className={s.calDot} style={{ background: '#ec4899' }} />}
                            {ev.publish > 0 && <span className={s.calDot} style={{ background: '#f97316' }} />}
                        </div>
                    )}
                </div>
            );
        }

        // Events for selected day
        const selectedEvents: { title: string; type: string; color: string; time?: string }[] = [];
        if (calSelectedDay) {
            myReqs.filter(r => r.dueDate?.startsWith(calSelectedDay)).forEach(r => selectedEvents.push({ title: r.title, type: ar ? 'إبداعي' : 'Creative', color: '#6366f1' }));
            myReqs.filter(r => r.publishDate?.startsWith(calSelectedDay)).forEach(r => selectedEvents.push({ title: r.title, type: ar ? 'نشر' : 'Publish', color: '#f97316' }));
            myJobs.filter((j: any) => j.deadline?.startsWith(calSelectedDay)).forEach((j: any) => selectedEvents.push({ title: j.title, type: ar ? 'إنتاج' : 'Production', color: '#ec4899' }));
            allPosts.filter((p: any) => p.scheduledDate?.startsWith(calSelectedDay) && (p.owner === user.name || p.assignedTeam?.includes(user.name))).forEach((p: any) => selectedEvents.push({ title: p.title, type: ar ? 'منشور' : 'Post', color: '#f97316' }));
        }

        return (
            <Section icon="📅" title={ar ? 'التقويم الشخصي' : 'My Calendar'}>
                <div className={s.calHeader}><span className={s.calMonthName}>{monthNames[month]} {year}</span></div>
                <div className={s.calDayNames}>{dayNames.map((n, i) => <span key={i} className={s.calDayLabel}>{n}</span>)}</div>
                <div className={s.calGrid}>{cells}</div>
                <div className={s.calLegend}>
                    <span><span className={s.calDot} style={{ background: '#6366f1' }} />{ar ? 'إبداعي' : 'Creative'}</span>
                    <span><span className={s.calDot} style={{ background: '#ec4899' }} />{ar ? 'إنتاج' : 'Production'}</span>
                    <span><span className={s.calDot} style={{ background: '#f97316' }} />{ar ? 'نشر' : 'Publish'}</span>
                    <span><span className={s.calDot} style={{ background: '#ef4444' }} />{ar ? 'متأخر' : 'Overdue'}</span>
                </div>
                {calSelectedDay && selectedEvents.length > 0 && (
                    <div className={s.calEvents}>
                        <div className={s.calEventsTitle}>{calSelectedDay.split('-').reverse().join('/')}</div>
                        {selectedEvents.map((ev, i) => (
                            <div key={i} className={s.calEvent}>
                                <span className={s.calEventDot} style={{ background: ev.color }} />
                                <span className={s.calEventTitle}>{ev.title}</span>
                                <span className={s.calEventType} style={{ color: ev.color }}>{ev.type}</span>
                            </div>
                        ))}
                    </div>
                )}
                {calSelectedDay && selectedEvents.length === 0 && (
                    <div className={s.calEvents}><div className={s.empty}>📅 {ar ? 'لا أحداث' : 'No events'}</div></div>
                )}
            </Section>
        );
    };

    // ── Performance Gauge (Speedometer) ──
    const renderPerformanceGauge = () => {
        // Calculate monthly score: on-time completion rate, blocked tasks penalty
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const myAllTasks = allReqs.filter(r => r.executorId === user.id || r.conceptWriterId === user.id || r.videoOwnerId === user.id || r.assignedTo.includes(user.name));
        const monthTasks = myAllTasks.filter(r => r.createdAt >= monthStart || r.updatedAt >= monthStart);
        const completed = monthTasks.filter(r => (r.status as string) === 'delivered' || (r.status as string) === 'approved_ready');
        const overdue = monthTasks.filter(r => r.dueDate && new Date(r.dueDate) < now && (r.status as string) !== 'delivered' && (r.status as string) !== 'approved_ready');
        const blocked = monthTasks.filter(r => r.blocked);
        const total = Math.max(monthTasks.length, 1);
        const completionRate = completed.length / total;
        const overdueRate = overdue.length / total;
        const blockedRate = blocked.length / total;
        const score = Math.round(Math.max(0, Math.min(100, (completionRate * 80 + (1 - overdueRate) * 15 + (1 - blockedRate) * 5) * (monthTasks.length > 0 ? 1 : 0.5))));

        // SVG gauge
        const cx = 100, cy = 95, r = 70;
        const startAngle = Math.PI; // 180°
        const endAngle = 0; // 0°
        const needle = startAngle - (score / 100) * Math.PI;
        const needleX = cx + r * 0.75 * Math.cos(needle);
        const needleY = cy - r * 0.75 * Math.sin(needle);
        const gaugeColor = score >= 67 ? '#22c55e' : score >= 34 ? '#f59e0b' : '#ef4444';
        const label = score >= 67 ? (ar ? 'ممتاز' : 'Excellent') : score >= 34 ? (ar ? 'جيد' : 'Good') : (ar ? 'يحتاج تحسين' : 'Needs Work');

        // Create arc paths for 3 zones
        const arcPath = (start: number, end: number) => {
            const x1 = cx + r * Math.cos(start), y1 = cy - r * Math.sin(start);
            const x2 = cx + r * Math.cos(end), y2 = cy - r * Math.sin(end);
            const large = end - start <= Math.PI ? 0 : 1;
            return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
        };

        return (
            <Section icon="⚡" title={ar ? 'مؤشر الأداء الشهري' : 'Monthly Performance'}>
                <div className={s.gaugeWrap}>
                    <svg viewBox="0 0 200 110" className={s.gaugeSvg}>
                        {/* Background zones */}
                        <path d={arcPath(Math.PI, Math.PI * 2 / 3)} stroke="#ef444440" strokeWidth="14" fill="none" strokeLinecap="round" />
                        <path d={arcPath(Math.PI * 2 / 3, Math.PI * 1 / 3)} stroke="#f59e0b40" strokeWidth="14" fill="none" strokeLinecap="round" />
                        <path d={arcPath(Math.PI * 1 / 3, 0)} stroke="#22c55e40" strokeWidth="14" fill="none" strokeLinecap="round" />
                        {/* Active arc */}
                        <path d={arcPath(Math.PI, needle)} stroke={gaugeColor} strokeWidth="14" fill="none" strokeLinecap="round" />
                        {/* Needle */}
                        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={gaugeColor} strokeWidth="3" strokeLinecap="round" />
                        <circle cx={cx} cy={cy} r="6" fill={gaugeColor} />
                        <circle cx={cx} cy={cy} r="3" fill="var(--card-bg, #fff)" />
                    </svg>
                    <div className={s.gaugeScore} style={{ color: gaugeColor }}>{score}</div>
                    <div className={s.gaugeLabel} style={{ color: gaugeColor }}>{label}</div>
                    <div className={s.gaugeStats}>
                        <span>✅ {completed.length} {ar ? 'مكتملة' : 'done'}</span>
                        <span>📋 {monthTasks.length} {ar ? 'إجمالي' : 'total'}</span>
                        <span style={{ color: overdue.length > 0 ? '#ef4444' : '#94a3b8' }}>⏰ {overdue.length} {ar ? 'متأخرة' : 'late'}</span>
                    </div>
                </div>
            </Section>
        );
    };

    // ── Publishing Manager Dashboard ──
    const renderPubMgrDashboard = () => {
        const pending = allPosts.filter((p: any) => p.stage !== 'published' && p.stage !== 'performance_review');
        const published = allPosts.filter((p: any) => p.stage === 'published' || p.stage === 'performance_review');
        const readyToPublish = allPosts.filter((p: any) => p.stage === 'ready_to_publish');
        const scheduling = allPosts.filter((p: any) => p.stage === 'scheduling');
        const overduePosts = pending.filter((p: any) => p.scheduledDate && new Date(p.scheduledDate) < new Date());
        const blockedPosts = allPosts.filter((p: any) => p.blocked);

        // Upcoming queue sorted by scheduled date
        const queue = [...pending].sort((a: any, b: any) => {
            if (!a.scheduledDate) return 1;
            if (!b.scheduledDate) return -1;
            return a.scheduledDate.localeCompare(b.scheduledDate);
        });

        return (
            <>
                <div className={s.kpiRow}>
                    <KPI icon="📢" value={allPosts.length} label={ar ? 'إجمالي المنشورات' : 'Total Posts'} color="#6366f1" />
                    <KPI icon="✅" value={published.length} label={ar ? 'تم النشر' : 'Published'} color="#22c55e" />
                    <KPI icon="🚀" value={readyToPublish.length} label={ar ? 'جاهزة للنشر' : 'Ready to Publish'} color="#3b82f6" />
                    <KPI icon="📅" value={scheduling.length} label={ar ? 'قيد الجدولة' : 'Scheduling'} color="#f59e0b" />
                    <KPI icon="⏰" value={overduePosts.length} label={ar ? 'متأخرة' : 'Overdue'} color={overduePosts.length > 0 ? '#ef4444' : '#22c55e'} />
                    <KPI icon="⛔" value={blockedPosts.length} label={ar ? 'محظورة' : 'Blocked'} color={blockedPosts.length > 0 ? '#ef4444' : '#22c55e'} />
                </div>

                <Section icon="📋" title={ar ? 'قائمة النشر القادمة' : 'Publishing Queue'} count={queue.length}>
                    {queue.slice(0, 12).map((p: any) => {
                        const client = cs.getClient(p.clientId);
                        const isOverdue = p.scheduledDate && new Date(p.scheduledDate) < new Date();
                        return (
                            <div key={p.postId} className={s.taskItem}>
                                <div className={s.taskPri} style={{ background: isOverdue ? '#ef4444' : p.stage === 'ready_to_publish' ? '#22c55e' : '#f59e0b' }} />
                                <div className={s.taskInfo}>
                                    <div className={s.taskTitle}>{p.title}</div>
                                    <div className={s.taskMeta}>
                                        <span>{client?.name || '—'}</span>
                                        <span>📱 {p.platform}</span>
                                        {p.scheduledDate && <span>📅 {p.scheduledDate}</span>}
                                        {p.scheduledTime && <span>🕐 {p.scheduledTime}</span>}
                                    </div>
                                </div>
                                <div className={s.taskBadge} style={{ background: isOverdue ? '#ef444420' : '#3b82f620', color: isOverdue ? '#ef4444' : '#3b82f6' }}>
                                    {isOverdue ? (ar ? '⏰ متأخر' : '⏰ Late') : p.stage === 'ready_to_publish' ? (ar ? '🚀 جاهز' : '🚀 Ready') : (ar ? '📋 قيد العمل' : '📋 In Progress')}
                                </div>
                            </div>
                        );
                    })}
                    {queue.length === 0 && <div className={s.empty}>📢 {ar ? 'لا منشورات معلقة' : 'No pending posts'}</div>}
                </Section>

                <div className={s.twoCol}>
                    {renderPersonalCalendar()}
                    <div>
                        {renderPerformanceGauge()}
                        {renderNotifs()}
                    </div>
                </div>
                {renderBoards()}
            </>
        );
    };

    // ═══════════════════════════════════════
    // ROLE-SPECIFIC DASHBOARD RENDERERS
    // ═══════════════════════════════════════

    const renderCEODashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="👥" value={clients.length} label={ar ? 'عملاء' : 'Clients'} color="#3b82f6" />
                <KPI icon="📋" value={activeReqs.length} label={ar ? 'طلبات نشطة' : 'Active Requests'} color="#8b5cf6" />
                <KPI icon="🎬" value={allJobs.length} label={ar ? 'مهام إنتاج' : 'Production'} color="#ec4899" />
                <KPI icon="📢" value={allPosts.length} label={ar ? 'منشورات' : 'Posts'} color="#f97316" />
                <KPI icon="⏳" value={pendingApprovals.length} label={ar ? 'موافقات' : 'Approvals'} color={pendingApprovals.length > 0 ? '#f59e0b' : '#22c55e'} />
                <KPI icon="⛔" value={activeReqs.filter(r => r.blocked).length} label={ar ? 'محظور' : 'Blocked'} color={activeReqs.some(r => r.blocked) ? '#ef4444' : '#22c55e'} />
            </div>
            {renderApprovals()}
            {renderBoards()}
            {renderClientReports()}
            <div className={s.deptReportsGrid}>
                {renderDeptReports()}
            </div>
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderPerformanceGauge()}
            </div>
            <div className={s.twoCol}>
                {renderTeamWorkload()}
                {renderNotifs()}
            </div>
        </>
    );

    const renderOpsDashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="🎬" value={allJobs.length} label={ar ? 'مهام إنتاج' : 'Production Jobs'} color="#ec4899" />
                <KPI icon="⏳" value={activeReqs.filter(r => r.isVideoTask && !r.videoOwnerId).length} label={ar ? 'غير معينة' : 'Unassigned'} color="#f59e0b" />
                <KPI icon="📅" value={myReqs.length} label={ar ? 'مهام نشطة' : 'Active Tasks'} color="#3b82f6" />
                <KPI icon="⛔" value={activeReqs.filter(r => r.blocked).length} label={ar ? 'محظور' : 'Blocked'} color={activeReqs.some(r => r.blocked) ? '#ef4444' : '#22c55e'} />
                <KPI icon="✅" value={pendingApprovals.length} label={ar ? 'موافقات' : 'Approvals'} color={pendingApprovals.length > 0 ? '#f59e0b' : '#22c55e'} />
            </div>
            {renderApprovals()}
            {renderClientReports()}
            <div className={s.twoCol}>
                {renderVideoAssignments()}
                <div>
                    <Section icon="📋" title={ar ? 'مهامي' : 'My Tasks'} count={myReqs.length}>{renderTasks(myReqs)}</Section>
                </div>
            </div>
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderPerformanceGauge()}
            </div>
            {renderBoards()}
        </>
    );

    const renderAMDashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="👤" value={clients.length} label={ar ? 'عملائي' : 'My Clients'} color="#3b82f6" />
                <KPI icon="⏳" value={pendingApprovals.length} label={ar ? 'موافقات معلقة' : 'Pending Approvals'} color={pendingApprovals.length > 0 ? '#f59e0b' : '#22c55e'} />
                <KPI icon="📋" value={myReqs.length} label={ar ? 'بريفات نشطة' : 'Active Briefs'} color="#8b5cf6" />
                <KPI icon="🔴" value={myOverdue.length} label={ar ? 'متأخرة' : 'Overdue'} color={myOverdue.length > 0 ? '#ef4444' : '#22c55e'} />
            </div>
            {renderApprovals()}
            {renderClientPortfolio()}
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                <div>
                    {renderPerformanceGauge()}
                    <Section icon="📋" title={ar ? 'مهامي النشطة' : 'My Active Tasks'} count={myReqs.length}>{renderTasks(myReqs)}</Section>
                </div>
            </div>
            {renderBoards()}
        </>
    );

    const renderCDDashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="🔍" value={allReqs.filter(r => r.status === 'review_revisions' || (r.status === 'concept_approval' && !r.cdPrelimApproval)).length} label={ar ? 'بانتظار المراجعة' : 'Pending Review'} color="#f59e0b" />
                <KPI icon="📋" value={activeReqs.length} label={ar ? 'طلبات نشطة' : 'Active Requests'} color="#8b5cf6" />
                <KPI icon="🎨" value={TEAM.filter(m => m.department === 'creative').length} label={ar ? 'فريق الإبداعي' : 'Creative Team'} color="#6366f1" />
                <KPI icon="⛔" value={activeReqs.filter(r => r.blocked).length} label={ar ? 'محظور' : 'Blocked'} color={activeReqs.some(r => r.blocked) ? '#ef4444' : '#22c55e'} />
            </div>
            {renderReviewQueue()}
            <div className={s.twoCol}>
                {renderCreativeTeam()}
                {renderPerformanceGauge()}
            </div>
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderNotifs()}
            </div>
            {renderBoards()}
        </>
    );

    const renderDesignerDashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="🎨" value={myReqs.length} label={ar ? 'مهام نشطة' : 'Active Tasks'} color="#6366f1" />
                <KPI icon="📅" value={myReqs.filter(r => r.dueDate === new Date().toISOString().split('T')[0]).length} label={ar ? 'مستحقة اليوم' : 'Due Today'} color="#f59e0b" />
                <KPI icon="🔍" value={myReqs.filter(r => r.status === 'review_revisions').length} label={ar ? 'قيد المراجعة' : 'In Review'} color="#3b82f6" />
                <KPI icon="🔴" value={myOverdue.length} label={ar ? 'متأخرة' : 'Overdue'} color={myOverdue.length > 0 ? '#ef4444' : '#22c55e'} />
            </div>
            <div className={s.twoCol}>
                {renderPerformanceGauge()}
                <Section icon="⭐" title={ar ? 'مهام اليوم ذات الأولوية' : 'Today\'s Priority Tasks'} count={myReqs.length}>
                    {renderTasks(myReqs, 10)}
                </Section>
            </div>
            {myOverdue.length > 0 && <Section icon="🔴" title={ar ? 'مهام متأخرة' : 'Overdue Tasks'} count={myOverdue.length}>{renderTasks(myOverdue)}</Section>}
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderNotifs()}
            </div>
            {renderBoards()}
        </>
    );

    const renderMktDashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="📊" value={clients.length} label={ar ? 'عملاء نشطين' : 'Active Clients'} color="#06b6d4" />
                <KPI icon="📋" value={myReqs.length} label={ar ? 'مهامي' : 'My Tasks'} color="#3b82f6" />
                <KPI icon="📢" value={allPosts.length} label={ar ? 'منشورات' : 'Posts'} color="#f97316" />
                <KPI icon="🔴" value={myOverdue.length} label={ar ? 'متأخرة' : 'Overdue'} color={myOverdue.length > 0 ? '#ef4444' : '#22c55e'} />
            </div>
            <div className={s.twoCol}>
                {renderPerformanceGauge()}
                <Section icon="📋" title={ar ? 'مهام التسويق' : 'Marketing Tasks'} count={myReqs.length}>
                    {renderTasks(myReqs, 10)}
                </Section>
            </div>
            {renderClientPortfolio()}
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderNotifs()}
            </div>
            {renderBoards()}
        </>
    );

    const renderVidDashboard = () => (
        <>
            <div className={s.kpiRow}>
                <KPI icon="📸" value={myReqs.filter(r => r.isVideoTask).length} label={ar ? 'مهامي الفيديو' : 'My Video Tasks'} color="#ec4899" />
                <KPI icon="📅" value={myReqs.filter(r => r.dueDate === new Date().toISOString().split('T')[0]).length} label={ar ? 'تصوير اليوم' : 'Shoots Today'} color="#f59e0b" />
                <KPI icon="✂️" value={myReqs.filter(r => (r.status as string) === 'execution').length} label={ar ? 'قيد التنفيذ' : 'In Progress'} color="#3b82f6" />
                <KPI icon="🔴" value={myOverdue.length} label={ar ? 'متأخرة' : 'Overdue'} color={myOverdue.length > 0 ? '#ef4444' : '#22c55e'} />
            </div>
            <div className={s.twoCol}>
                {renderPerformanceGauge()}
                {renderVideoSchedule()}
            </div>
            <Section icon="📋" title={ar ? 'مهامي النشطة' : 'My Active Tasks'} count={myReqs.length}>
                {renderTasks(myReqs, 10)}
            </Section>
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderNotifs()}
            </div>
            {renderBoards()}
        </>
    );

    const renderAIDevDashboard = () => (
        <>
            {renderSystemStatus()}
            <div className={s.twoCol}>
                {renderPerformanceGauge()}
                <Section icon="📋" title={ar ? 'مهامي' : 'My Tasks'} count={myReqs.length}>
                    {renderTasks(myReqs, 10)}
                </Section>
            </div>
            <div className={s.twoCol}>
                {renderPersonalCalendar()}
                {renderNotifs()}
            </div>
            {renderBoards()}
        </>
    );

    // ── Choose dashboard by role ──
    const renderDashboard = () => {
        if (isCEO) return renderCEODashboard();
        if (isOps) return renderOpsDashboard();
        if (isPubMgr) return renderPubMgrDashboard();
        if (isCD) return renderCDDashboard();
        if (isAM) return renderAMDashboard();
        if (isDesigner) return renderDesignerDashboard();
        if (isMktMgr) return renderMktDashboard();
        if (isVid) return renderVidDashboard();
        if (isAIDev) return renderAIDevDashboard();
        // Fallback
        return renderAMDashboard();
    };

    // ── Personal Settings Panel ──
    const renderPersonalSettings = () => {
        if (!settingsOpen) return null;
        const canManageTeam = isCEO || isOps;
        const canManageClients = isCEO || isOps || isAM;
        const canManageApprovals = isCEO || isOps || isCD;

        const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
            <div className={s.settingRow}>
                <span className={s.settingLabel}>{label}</span>
                <button className={`${s.toggle} ${checked ? s.toggleOn : ''}`} onClick={() => onChange(!checked)}>
                    <span className={s.toggleDot} />
                </button>
            </div>
        );

        return (
            <div className={s.settingsOverlay} onClick={() => setSettingsOpen(false)}>
                <div className={s.settingsPanel} dir={ar ? 'rtl' : 'ltr'} onClick={e => e.stopPropagation()}>
                    <div className={s.settingsPanelHeader}>
                        <div className={s.settingsPanelUser}>
                            <div className={s.settingsAvatar} style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}88)` }}>{user.avatar}</div>
                            <div>
                                <div className={s.settingsUserName}>{user.name}</div>
                                <div className={s.settingsUserRole}>{user.position}</div>
                            </div>
                        </div>
                        <button className={s.settingsClose} onClick={() => setSettingsOpen(false)}>✕</button>
                    </div>

                    <div className={s.settingsBody}>
                        {/* ── Display Preferences ── */}
                        <div className={s.settingsSection}>
                            <div className={s.settingsSectionTitle}>🎨 {ar ? 'تفضيلات العرض' : 'Display Preferences'}</div>
                            <div className={s.settingRow}>
                                <span className={s.settingLabel}>{ar ? 'المظهر' : 'Theme'}</span>
                                <div className={s.settingBtnGroup}>
                                    <button className={`${s.settingBtn} ${theme === 'dark' ? s.settingBtnActive : ''}`} onClick={() => { if (theme !== 'dark') toggleTheme(); }}>🌙 {ar ? 'داكن' : 'Dark'}</button>
                                    <button className={`${s.settingBtn} ${theme === 'light' ? s.settingBtnActive : ''}`} onClick={() => { if (theme !== 'light') toggleTheme(); }}>☀️ {ar ? 'فاتح' : 'Light'}</button>
                                </div>
                            </div>
                            <div className={s.settingRow}>
                                <span className={s.settingLabel}>{ar ? 'اللغة' : 'Language'}</span>
                                <div className={s.settingBtnGroup}>
                                    <button className={`${s.settingBtn} ${lang === 'ar' ? s.settingBtnActive : ''}`} onClick={() => { if (lang !== 'ar') toggleLang(); }}>🇸🇦 العربية</button>
                                    <button className={`${s.settingBtn} ${lang === 'en' ? s.settingBtnActive : ''}`} onClick={() => { if (lang !== 'en') toggleLang(); }}>🇬🇧 English</button>
                                </div>
                            </div>
                            <Toggle checked={displaySettings.showAvatars} onChange={v => setDisplaySettings(p => ({ ...p, showAvatars: v }))} label={ar ? 'إظهار الصور الرمزية' : 'Show Avatars'} />
                            <Toggle checked={displaySettings.showDeadlineBadges} onChange={v => setDisplaySettings(p => ({ ...p, showDeadlineBadges: v }))} label={ar ? 'إظهار شارات المواعيد' : 'Show Deadline Badges'} />
                            <Toggle checked={displaySettings.compactCards} onChange={v => setDisplaySettings(p => ({ ...p, compactCards: v }))} label={ar ? 'بطاقات مضغوطة' : 'Compact Cards'} />
                            <Toggle checked={displaySettings.animationsEnabled} onChange={v => setDisplaySettings(p => ({ ...p, animationsEnabled: v }))} label={ar ? 'تفعيل الحركات' : 'Enable Animations'} />
                        </div>

                        {/* ── Notification Preferences ── */}
                        <div className={s.settingsSection}>
                            <div className={s.settingsSectionTitle}>🔔 {ar ? 'الإشعارات' : 'Notifications'}</div>
                            <Toggle checked={notifSettings.newTasks} onChange={v => setNotifSettings(p => ({ ...p, newTasks: v }))} label={ar ? 'مهام جديدة' : 'New Tasks'} />
                            <Toggle checked={notifSettings.approvals} onChange={v => setNotifSettings(p => ({ ...p, approvals: v }))} label={ar ? 'طلبات الموافقة' : 'Approval Requests'} />
                            <Toggle checked={notifSettings.mentions} onChange={v => setNotifSettings(p => ({ ...p, mentions: v }))} label={ar ? 'الإشارات' : 'Mentions'} />
                            <Toggle checked={notifSettings.deadlines} onChange={v => setNotifSettings(p => ({ ...p, deadlines: v }))} label={ar ? 'تنبيهات المواعيد' : 'Deadline Alerts'} />
                            <Toggle checked={notifSettings.chat} onChange={v => setNotifSettings(p => ({ ...p, chat: v }))} label={ar ? 'رسائل المحادثة' : 'Chat Messages'} />
                            <Toggle checked={notifSettings.dailySummary} onChange={v => setNotifSettings(p => ({ ...p, dailySummary: v }))} label={ar ? 'ملخص يومي' : 'Daily Summary'} />
                            <Toggle checked={notifSettings.weeklyReport} onChange={v => setNotifSettings(p => ({ ...p, weeklyReport: v }))} label={ar ? 'تقرير أسبوعي' : 'Weekly Report'} />
                        </div>

                        {/* ── Work Preferences ── */}
                        <div className={s.settingsSection}>
                            <div className={s.settingsSectionTitle}>⚙️ {ar ? 'تفضيلات العمل' : 'Work Preferences'}</div>
                            <div className={s.settingRow}>
                                <span className={s.settingLabel}>{ar ? 'ساعات العمل' : 'Working Hours'}</span>
                                <div className={s.settingBtnGroup}>
                                    <input type="time" className={s.settingInput} value={workSettings.workingHoursStart} onChange={e => setWorkSettings(p => ({ ...p, workingHoursStart: e.target.value }))} />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>→</span>
                                    <input type="time" className={s.settingInput} value={workSettings.workingHoursEnd} onChange={e => setWorkSettings(p => ({ ...p, workingHoursEnd: e.target.value }))} />
                                </div>
                            </div>
                            <div className={s.settingRow}>
                                <span className={s.settingLabel}>{ar ? 'الأولوية الافتراضية' : 'Default Priority'}</span>
                                <select className={s.settingSelect} value={workSettings.defaultPriority} onChange={e => setWorkSettings(p => ({ ...p, defaultPriority: e.target.value }))}>
                                    <option value="low">{ar ? 'منخفضة' : 'Low'}</option>
                                    <option value="medium">{ar ? 'متوسطة' : 'Medium'}</option>
                                    <option value="high">{ar ? 'عالية' : 'High'}</option>
                                    <option value="urgent">{ar ? 'عاجلة' : 'Urgent'}</option>
                                </select>
                            </div>
                            <Toggle checked={workSettings.autoAcceptTasks} onChange={v => setWorkSettings(p => ({ ...p, autoAcceptTasks: v }))} label={ar ? 'قبول المهام تلقائياً' : 'Auto-accept Tasks'} />
                        </div>

                        {/* ── Admin: Team Management (CEO/Ops only) ── */}
                        {canManageTeam && (
                            <div className={s.settingsSection}>
                                <div className={s.settingsSectionTitle}>👥 {ar ? 'إدارة الفريق' : 'Team Management'}
                                    <span className={s.settingsBadge}>{ar ? 'مشرف' : 'Admin'}</span>
                                </div>
                                <Link href="/settings/users" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>👥</span> {ar ? 'إدارة المستخدمين' : 'Manage Users'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                                <Link href="/settings/roles" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>🔐</span> {ar ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                                <Link href="/settings/departments" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>🏗️</span> {ar ? 'إدارة الأقسام' : 'Manage Departments'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                                <Link href="/settings/positions" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>💼</span> {ar ? 'المناصب' : 'Positions'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                            </div>
                        )}

                        {/* ── Admin: Approvals (CEO/Ops/CD) ── */}
                        {canManageApprovals && (
                            <div className={s.settingsSection}>
                                <div className={s.settingsSectionTitle}>✅ {ar ? 'الموافقات' : 'Approvals'}
                                    <span className={s.settingsBadge}>{ar ? 'مشرف' : 'Admin'}</span>
                                </div>
                                <Link href="/settings/approvals" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>✅</span> {ar ? 'مصفوفة الموافقات' : 'Approval Matrix'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                            </div>
                        )}

                        {/* ── Admin: Organization (CEO only) ── */}
                        {isCEO && (
                            <div className={s.settingsSection}>
                                <div className={s.settingsSectionTitle}>🏢 {ar ? 'المنظمة' : 'Organization'}
                                    <span className={s.settingsBadge}>{ar ? 'مدير تنفيذي' : 'CEO'}</span>
                                </div>
                                <Link href="/settings/organization" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>🏢</span> {ar ? 'إعدادات المنظمة' : 'Organization Settings'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                                <Link href="/settings/integrations" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>🔗</span> {ar ? 'التكاملات' : 'Integrations'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                                <Link href="/settings/security" className={s.settingsLink} onClick={() => setSettingsOpen(false)}>
                                    <span>🛡️</span> {ar ? 'الأمان والسجل' : 'Security & Logs'}
                                    <span className={s.settingsLinkArrow}>←</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════ RENDER ═══════════

    return (
        <div className={s.workspace} dir={ar ? 'rtl' : 'ltr'}>
            {toast && <div className={s.toast}>{toast}</div>}
            <header className={s.header}>
                <div className={s.headerR}>
                    <div className={s.logo}><div className={s.logoIcon}>R</div><span className={s.logoText}>Remark</span></div>
                    <div className={s.userCard}>
                        <div className={s.userAvatar} style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}88)` }}>{user.avatar}</div>
                        <div>
                            <div className={s.userName}>{greet}، {user.name}</div>
                            <div className={s.userRole}>{user.position} • {DEPT_LABELS[user.department]?.[ar ? 'ar' : 'en']}</div>
                        </div>
                    </div>
                </div>
                <div className={s.headerL}>
                    <select className={s.userSel} value={userId} onChange={e => switchUser(e.target.value)}>
                        {TEAM.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name} — {m.position}</option>)}
                    </select>
                    <button className={s.iconBtn} onClick={toggleTheme} title={ar ? 'تبديل المظهر' : 'Toggle Theme'}>🌙</button>
                    <button className={s.iconBtn} onClick={toggleLang} title={ar ? 'تبديل اللغة' : 'Toggle Language'}>🌐</button>
                    <button className={s.iconBtn} onClick={() => setSettingsOpen(true)} title={ar ? 'الإعدادات' : 'Settings'}>⚙️</button>
                </div>
            </header>

            <main className={s.content}>
                {renderAIHero()}
                {renderDashboard()}
            </main>

            {/* ── Personal Settings Panel ── */}
            {renderPersonalSettings()}

            {/* ── Floating Chat FAB ── */}
            <button className={s.chatFab} onClick={() => setChatMode(chatMode === 'closed' ? 'full' : 'closed')} title={ar ? 'المحادثات' : 'Chat'}>
                {chatMode === 'closed' ? '💬' : '✕'}
                {unread > 0 && chatMode === 'closed' && <span className={s.chatFabBadge}>{unread}</span>}
            </button>

            {/* ── Chat Sidebar (full) ── */}
            {chatMode === 'full' && (
                <div className={s.chatSidebar}>
                    <div className={s.chatSidebarHeader}>
                        <span className={s.chatSidebarTitle}>💬 {ar ? 'المحادثات' : 'Chat'} {unread > 0 && <span className={s.chatUnreadBadge}>{unread}</span>}</span>
                        <div className={s.chatSidebarActions}>
                            <button className={s.chatSidebarBtn} onClick={() => setChatMode('mini')} title={ar ? 'تصغير' : 'Minimize'}>▾</button>
                            <button className={s.chatSidebarBtn} onClick={() => setChatMode('closed')} title={ar ? 'إغلاق' : 'Close'}>✕</button>
                        </div>
                    </div>
                    <div className={s.chatSidebarRooms}>
                        {myRooms.map(r => (<button key={r.roomId} className={`${s.roomBtn} ${chatRoom === r.roomId ? s.roomActive : ''}`} onClick={() => setChatRoom(r.roomId)}>{r.icon} {ar ? r.name : r.nameEn}</button>))}
                    </div>
                    <div className={s.chatSidebarMsgs}>
                        {roomMsgs.slice(-30).map(m => (
                            <div key={m.messageId} className={s.chatMsg}>
                                <div className={s.chatAv}>{m.senderAvatar}</div>
                                <div className={`${s.chatBody} ${m.type === 'ai' ? s.chatAi : m.type === 'system' ? s.chatSys : ''}`}>
                                    <div className={s.chatSender}>{m.senderName} <span className={s.chatTime}>{new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                    <div className={s.chatText}>{m.text}</div>
                                    {m.aiAction && m.aiAction.status === 'proposed' && (
                                        <div className={s.aiAction}>
                                            <div className={s.aiActionDesc}>🤖 {m.aiAction.description}</div>
                                            <div className={s.aiActionBtns}>
                                                <button className={`${s.aiActionBtn} ${s.aiActionApprove}`} onClick={() => { chat.approveAIAction(m.aiAction!.actionId, user.id); chat.executeAIAction(m.aiAction!.actionId); }}>✅ {ar ? 'موافق' : 'Approve'}</button>
                                                <button className={`${s.aiActionBtn} ${s.aiActionReject}`} onClick={() => chat.rejectAIAction(m.aiAction!.actionId, user.id)}>❌ {ar ? 'رفض' : 'Reject'}</button>
                                            </div>
                                        </div>
                                    )}
                                    {m.cardRefs.map((cr, ci) => (<div key={ci} className={s.cardPreview}><div className={s.cardPreviewTitle}>{cr.title}</div><div className={s.cardPreviewMeta}><span>{cr.clientName}</span><span>{cr.status}</span></div></div>))}
                                </div>
                            </div>
                        ))}
                        {roomMsgs.length === 0 && <div className={s.empty}>💬 {ar ? 'ابدأ المحادثة' : 'Start chatting'}</div>}
                    </div>
                    <div className={s.chatSidebarInput}>
                        <input className={s.chatInput} placeholder={ar ? 'اكتب رسالة...' : 'Type a message...'} value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                        <button className={s.chatSend} onClick={sendChat}>➤</button>
                    </div>
                </div>
            )}

            {/* ── Chat Minimized Bar ── */}
            {chatMode === 'mini' && (
                <div className={s.chatMiniBar} onClick={() => setChatMode('full')}>
                    <span>💬 {ar ? 'المحادثات' : 'Chat'} {unread > 0 && <span className={s.chatUnreadBadge}>{unread}</span>}</span>
                    <div className={s.chatMiniActions}>
                        <button className={s.chatSidebarBtn} onClick={(e) => { e.stopPropagation(); setChatMode('full'); }} title={ar ? 'فتح' : 'Expand'}>▴</button>
                        <button className={s.chatSidebarBtn} onClick={(e) => { e.stopPropagation(); setChatMode('closed'); }} title={ar ? 'إغلاق' : 'Close'}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
}
