'use client';
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { TEAM, type TeamMember } from '@/lib/teamStore';
import { useSettings } from '@/lib/useSettings';
import { getChatStore, type ChatRoom, type ChatMessage } from '@/lib/chatStore';
import { getCreativeStore } from '@/lib/creativeStore';

export default function ChatPage() {
    const chat = getChatStore();
    const cs = getCreativeStore();
    const chatV = useSyncExternalStore(cb => chat.subscribe(cb), () => chat.getVersion(), () => 0);
    const { theme, lang, user, toggleTheme, toggleLang } = useSettings();
    const [activeRoom, setActiveRoom] = useState('room_company');
    const [input, setInput] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const msgsRef = useRef<HTMLDivElement>(null);

    useEffect(() => { msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight); }, [chatV, activeRoom]);

    const rooms = chat.getRoomsForMember(user.id);
    const room = chat.getRoom(activeRoom);
    const msgs = chat.getRoomMessages(activeRoom);
    const unreadTotal = chat.getUnreadCount(user.id);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; setInput(val);
        const last = val.split(' ').pop() || '';
        if (last.startsWith('@') && last.length > 1) { setShowMentions(true); setMentionFilter(last.slice(1)); }
        else setShowMentions(false);
    };

    const insertMention = (m: TeamMember) => {
        const words = input.split(' '); words.pop();
        setInput(words.join(' ') + (words.length ? ' ' : '') + `@${m.name} `);
        setShowMentions(false);
    };

    const send = () => {
        if (!input.trim()) return;
        chat.sendMessage(activeRoom, input, user.id);
        // AI auto-response in production room
        if (activeRoom === 'room_production' && room?.aiEnabled) {
            setTimeout(() => {
                const txt = input.toLowerCase();
                if (txt.includes('تعيين') || txt.includes('assign')) {
                    chat.sendAIMessage(activeRoom, lang === 'ar' ? '🤖 هل تريدني أن أقوم بتعيين هذه المهمة؟ سأحتاج موافقتك أولاً.' : '🤖 Should I assign this task? I need your permission first.', {
                        description: lang === 'ar' ? 'تعيين المهمة المذكورة' : 'Assign the mentioned task',
                        descriptionEn: 'Assign the mentioned task',
                        targetType: 'assignment', targetId: '', proposedChange: input, proposedBy: 'ai',
                    });
                } else if (txt.includes('نقل') || txt.includes('move') || txt.includes('حرك')) {
                    chat.sendAIMessage(activeRoom, lang === 'ar' ? '🤖 هل تريدني أن أنقل هذه البطاقة للمرحلة التالية؟' : '🤖 Should I move this card to the next stage?', {
                        description: lang === 'ar' ? 'نقل البطاقة للمرحلة التالية' : 'Move card to next stage',
                        descriptionEn: 'Move card to next stage',
                        targetType: 'status', targetId: '', proposedChange: 'next_stage', proposedBy: 'ai',
                    });
                } else {
                    chat.sendAIMessage(activeRoom, lang === 'ar' ? '👍 تم الاطلاع. إذا احتجت مساعدة في تغيير أي بطاقة أو تعيين مهمة، أخبرني.' : '👍 Noted. If you need help changing any card or assigning a task, let me know.');
                }
            }, 1500);
        }
        setInput('');
    };

    const filteredMentions = TEAM.filter(m => m.name.includes(mentionFilter) || m.nameEn.toLowerCase().includes(mentionFilter.toLowerCase()));

    const renderMessage = (m: ChatMessage) => {
        // Render mentions as highlighted
        let text = m.text;
        for (const mid of m.mentions) {
            const mem = TEAM.find(t => t.id === mid);
            if (mem) { text = text.replace(`@${mem.name}`, `【${mem.avatar} ${mem.name}】`).replace(`@${mem.nameEn}`, `【${mem.avatar} ${mem.nameEn}】`); }
        }
        return (
            <div key={m.messageId} style={{ display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 10, background: m.type === 'ai' ? 'rgba(20,184,166,.04)' : m.type === 'system' ? 'rgba(99,102,241,.03)' : 'transparent', border: m.type === 'ai' ? '1px solid rgba(20,184,166,.1)' : m.type === 'system' ? '1px solid rgba(99,102,241,.08)' : 'none', marginBottom: 4 }}>
                <div style={{ fontSize: 18, flexShrink: 0 }}>{m.senderAvatar}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text, #1e293b)' }}>{m.senderName} <span style={{ fontWeight: 400, color: 'var(--text-muted, #64748b)', marginInlineStart: 4, fontSize: 9 }}>{new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text, #1e293b)', lineHeight: 1.6, marginTop: 2 }}>{text}</div>
                    {/* AI Action */}
                    {m.aiAction && m.aiAction.status === 'proposed' && (
                        <div style={{ background: 'rgba(20,184,166,.06)', border: '1px solid rgba(20,184,166,.15)', borderRadius: 8, padding: '8px 12px', marginTop: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>🤖 {m.aiAction.description}</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ fontSize: 10, padding: '4px 14px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => { chat.approveAIAction(m.aiAction!.actionId, user.id); chat.executeAIAction(m.aiAction!.actionId); chat.sendSystemMessage(activeRoom, `✅ ${user.name} وافق على: ${m.aiAction!.description}`); }}>✅ {lang === 'ar' ? 'موافق' : 'Approve'}</button>
                                <button style={{ fontSize: 10, padding: '4px 14px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => { chat.rejectAIAction(m.aiAction!.actionId, user.id); chat.sendSystemMessage(activeRoom, `❌ ${user.name} رفض: ${m.aiAction!.description}`); }}>❌ {lang === 'ar' ? 'رفض' : 'Reject'}</button>
                            </div>
                        </div>
                    )}
                    {m.aiAction && m.aiAction.status !== 'proposed' && (
                        <div style={{ fontSize: 10, color: m.aiAction.status === 'approved' || m.aiAction.status === 'executed' ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                            {m.aiAction.status === 'executed' ? '✅ تم التنفيذ' : m.aiAction.status === 'approved' ? '✅ تمت الموافقة' : '❌ مرفوض'}
                        </div>
                    )}
                    {/* Card previews */}
                    {m.cardRefs.map((cr, i) => (
                        <div key={i} style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, rgba(0,0,0,.1))', borderRadius: 8, padding: '8px 12px', marginTop: 4, cursor: 'pointer' }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{cr.title}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted, #64748b)', display: 'flex', gap: 8, marginTop: 2 }}>
                                <span>{cr.clientName}</span><span>{cr.status}</span><span>{cr.assignee}</span>{cr.dueDate && <span>📅 {cr.dueDate}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main, #f1f5f9)', fontFamily: "'Noto Sans Arabic','Inter',system-ui,sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'var(--card-bg, #fff)', borderBottom: '1px solid var(--border, rgba(0,0,0,.08))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>R</div>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>💬 {lang === 'ar' ? 'المحادثات' : 'Chat'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href="/workspace" style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>← {lang === 'ar' ? 'المساحة' : 'Workspace'}</Link>
                    <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border, rgba(0,0,0,.08))', background: 'var(--card-bg, #fff)', cursor: 'pointer', fontSize: 14 }}>🌙</button>
                    <button onClick={toggleLang} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border, rgba(0,0,0,.08))', background: 'var(--card-bg, #fff)', cursor: 'pointer', fontSize: 14 }}>🌐</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: 'calc(100vh - 56px)' }}>
                {/* Sidebar: Rooms */}
                <div style={{ background: 'var(--card-bg, #fff)', borderInlineEnd: '1px solid var(--border, rgba(0,0,0,.06))', padding: 8, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '8px 10px' }}>🏢 {lang === 'ar' ? 'الغرف' : 'Rooms'}</div>
                    {rooms.map(r => (
                        <button key={r.roomId} onClick={() => setActiveRoom(r.roomId)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: activeRoom === r.roomId ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: activeRoom === r.roomId ? '#fff' : 'var(--text, #1e293b)', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'start', marginBottom: 2, transition: 'all .15s' }}>
                            <span style={{ fontSize: 16 }}>{r.icon}</span>
                            <span style={{ flex: 1 }}>{lang === 'ar' ? r.name : r.nameEn}</span>
                        </button>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '12px 10px 8px' }}>👥 {lang === 'ar' ? 'الفريق' : 'Team'}</div>
                    {TEAM.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text, #1e293b)' }}>
                            <span>{m.avatar}</span><span>{m.name}</span>
                            <span style={{ fontSize: 9, color: 'var(--text-muted, #64748b)', marginInlineStart: 'auto' }}>{m.department === user.department ? '●' : ''}</span>
                        </div>
                    ))}
                </div>

                {/* Main: Messages */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Room Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border, rgba(0,0,0,.06))', background: 'var(--card-bg, #fff)' }}>
                        <span style={{ fontSize: 20 }}>{room?.icon || '💬'}</span>
                        <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #1e293b)' }}>{lang === 'ar' ? room?.name : room?.nameEn}</div><div style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>{room?.members.length || 0} {lang === 'ar' ? 'عضو' : 'members'} {room?.aiEnabled ? '• 🤖 AI' : ''}</div></div>
                    </div>

                    {/* Messages */}
                    <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                        {msgs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)', padding: 40, fontSize: 13 }}>💬 {lang === 'ar' ? 'ابدأ المحادثة' : 'Start chatting'}</div>}
                        {msgs.map(renderMessage)}
                    </div>

                    {/* Mention Autocomplete */}
                    {showMentions && filteredMentions.length > 0 && (
                        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, rgba(0,0,0,.1))', borderRadius: 8, margin: '0 16px', padding: 4, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
                            {filteredMentions.slice(0, 6).map(m => (
                                <button key={m.id} onClick={() => insertMention(m)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, textAlign: 'start', borderRadius: 6 }}>
                                    <span>{m.avatar}</span><span style={{ fontWeight: 600 }}>{m.name}</span><span style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>{m.position}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--border, rgba(0,0,0,.06))', background: 'var(--card-bg, #fff)' }}>
                        <input value={input} onChange={handleInput} onKeyDown={e => e.key === 'Enter' && send()} placeholder={lang === 'ar' ? '@ذكر شخص أو اكتب رسالة...' : '@mention or type...'} style={{ flex: 1, border: '1px solid var(--border, rgba(0,0,0,.1))', borderRadius: 10, padding: '8px 14px', fontSize: 13, background: 'var(--bg-main, #f8fafc)', color: 'var(--text, #1e293b)', outline: 'none' }} />
                        <button onClick={send} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>➤</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
