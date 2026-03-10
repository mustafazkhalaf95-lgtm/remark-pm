'use client';
/* ══════════════════════════════════════════════════════════════════
   Chat — API-driven chat page
   Hooks: useChatRooms, useChatMessages, useUsers
   No localStorage stores.
   ══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useChatRooms, useChatMessages, useUsers } from '@/lib/hooks';
import type { ChatRoomData, ChatMessageData, UserData } from '@/lib/hooks';
import { useSettings } from '@/lib/useSettings';

/* ── Type icon helper ── */
const ROOM_ICONS: Record<string, string> = {
    company: '🏢',
    department: '👥',
    client: '💼',
    direct: '💬',
    project: '📋',
};

/* ── Resolve display name from user/profile ── */
function senderName(msg: ChatMessageData, lang: string): string {
    if (msg.sender?.profile) {
        return lang === 'ar'
            ? (msg.sender.profile.fullNameAr || msg.sender.profile.fullName)
            : msg.sender.profile.fullName;
    }
    return msg.sender?.email || '?';
}

function senderAvatar(msg: ChatMessageData): string {
    return msg.sender?.profile?.avatar || '👤';
}

/* ═══════════════════════════════════════════════════
   ChatPage Component
   ═══════════════════════════════════════════════════ */

export default function ChatPage() {
    const { rooms, loading: roomsLoading } = useChatRooms();
    const { users, loading: usersLoading } = useUsers();
    const { lang, toggleTheme, toggleLang } = useSettings();

    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const msgsRef = useRef<HTMLDivElement>(null);

    // Auto-select first room
    useEffect(() => {
        if (!activeRoomId && rooms.length > 0) {
            setActiveRoomId(rooms[0].id);
        }
    }, [rooms, activeRoomId]);

    const { messages, loading: msgsLoading, sendMessage } = useChatMessages(activeRoomId);
    const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId), [rooms, activeRoomId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight);
    }, [messages, activeRoomId]);

    /* ── Mention handling ── */
    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        const last = val.split(' ').pop() || '';
        if (last.startsWith('@') && last.length > 1) {
            setShowMentions(true);
            setMentionFilter(last.slice(1));
        } else {
            setShowMentions(false);
        }
    }, []);

    const filteredMentions = useMemo(() => {
        if (!showMentions || !mentionFilter) return [];
        const q = mentionFilter.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(q) ||
            (u.nameAr && u.nameAr.includes(mentionFilter)) ||
            u.email.toLowerCase().includes(q)
        ).slice(0, 6);
    }, [users, showMentions, mentionFilter]);

    const insertMention = useCallback((u: UserData) => {
        const words = input.split(' ');
        words.pop();
        const displayName = lang === 'ar' ? (u.nameAr || u.name) : u.name;
        setInput(words.join(' ') + (words.length ? ' ' : '') + `@${displayName} `);
        setShowMentions(false);
    }, [input, lang]);

    /* ── Send message ── */
    const send = useCallback(async () => {
        if (!input.trim()) return;
        // Get first user as sender in dev mode
        const senderId = users[0]?.id || '';
        await sendMessage(input, senderId);
        setInput('');
    }, [input, users, sendMessage]);

    /* ── Loading state ── */
    if (roomsLoading || usersLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main, #f1f5f9)', fontFamily: "'Noto Sans Arabic','Inter',system-ui,sans-serif" }}>
                <div style={{ fontSize: 14, color: 'var(--text-muted, #64748b)' }}>
                    {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
            </div>
        );
    }

    /* ── Render message ── */
    const renderMessage = (m: ChatMessageData) => {
        const name = senderName(m, lang);
        const avatar = senderAvatar(m);

        // Parse mentions from content
        let displayContent = m.content;
        try {
            const mentionIds: string[] = JSON.parse(m.mentions || '[]');
            for (const uid of mentionIds) {
                const u = users.find(usr => usr.id === uid || usr.name.toLowerCase() === uid.toLowerCase());
                if (u) {
                    displayContent = displayContent.replace(
                        new RegExp(`@${uid}`, 'gi'),
                        `【${u.avatar} ${lang === 'ar' ? (u.nameAr || u.name) : u.name}】`
                    );
                }
            }
        } catch { /* ignore parse errors */ }

        return (
            <div key={m.id} style={{
                display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 10,
                background: m.type === 'ai_suggestion' ? 'rgba(20,184,166,.04)' : m.type === 'system' ? 'rgba(99,102,241,.03)' : 'transparent',
                border: m.type === 'ai_suggestion' ? '1px solid rgba(20,184,166,.1)' : m.type === 'system' ? '1px solid rgba(99,102,241,.08)' : 'none',
                marginBottom: 4,
            }}>
                <div style={{ fontSize: 18, flexShrink: 0 }}>{avatar}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                        {name}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted, #64748b)', marginInlineStart: 4, fontSize: 9 }}>
                            {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text, #1e293b)', lineHeight: 1.6, marginTop: 2 }}>
                        {displayContent}
                    </div>
                    {/* Reply preview */}
                    {m.replyTo && (
                        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, rgba(0,0,0,.1))', borderRadius: 8, padding: '6px 10px', marginTop: 4, fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
                            ↩️ {senderName(m.replyTo, lang)}: {m.replyTo.content.slice(0, 60)}
                        </div>
                    )}
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
                    <Link href="/" style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>← {lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
                    <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border, rgba(0,0,0,.08))', background: 'var(--card-bg, #fff)', cursor: 'pointer', fontSize: 14 }}>🌙</button>
                    <button onClick={toggleLang} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border, rgba(0,0,0,.08))', background: 'var(--card-bg, #fff)', cursor: 'pointer', fontSize: 14 }}>🌐</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: 'calc(100vh - 56px)' }}>
                {/* Sidebar: Rooms */}
                <div style={{ background: 'var(--card-bg, #fff)', borderInlineEnd: '1px solid var(--border, rgba(0,0,0,.06))', padding: 8, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '8px 10px' }}>
                        🏢 {lang === 'ar' ? 'الغرف' : 'Rooms'}
                    </div>
                    {rooms.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setActiveRoomId(r.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                padding: '8px 10px', borderRadius: 8, border: 'none',
                                background: activeRoomId === r.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                                color: activeRoomId === r.id ? '#fff' : 'var(--text, #1e293b)',
                                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                textAlign: 'start', marginBottom: 2, transition: 'all .15s',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{ROOM_ICONS[r.type] || '💬'}</span>
                            <span style={{ flex: 1 }}>{lang === 'ar' ? (r.nameAr || r.name) : r.name}</span>
                            {r._count && r._count.messages > 0 && (
                                <span style={{ fontSize: 9, opacity: 0.6 }}>{r._count.messages}</span>
                            )}
                        </button>
                    ))}

                    {/* Team Members */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '12px 10px 8px' }}>
                        👥 {lang === 'ar' ? 'الفريق' : 'Team'}
                    </div>
                    {users.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text, #1e293b)' }}>
                            <span>{u.avatar}</span>
                            <span>{lang === 'ar' ? (u.nameAr || u.name) : u.name}</span>
                            <span style={{ fontSize: 9, color: 'var(--text-muted, #64748b)', marginInlineStart: 'auto' }}>
                                {u.department}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main: Messages */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Room Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border, rgba(0,0,0,.06))', background: 'var(--card-bg, #fff)' }}>
                        <span style={{ fontSize: 20 }}>{activeRoom ? (ROOM_ICONS[activeRoom.type] || '💬') : '💬'}</span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                                {activeRoom ? (lang === 'ar' ? (activeRoom.nameAr || activeRoom.name) : activeRoom.name) : ''}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
                                {activeRoom?.members.length || 0} {lang === 'ar' ? 'عضو' : 'members'}
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                        {msgsLoading && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)', padding: 40, fontSize: 13 }}>
                                ⏳ {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                            </div>
                        )}
                        {!msgsLoading && messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)', padding: 40, fontSize: 13 }}>
                                💬 {lang === 'ar' ? 'ابدأ المحادثة' : 'Start chatting'}
                            </div>
                        )}
                        {messages.map(renderMessage)}
                    </div>

                    {/* Mention Autocomplete */}
                    {showMentions && filteredMentions.length > 0 && (
                        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, rgba(0,0,0,.1))', borderRadius: 8, margin: '0 16px', padding: 4, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
                            {filteredMentions.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => insertMention(u)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, textAlign: 'start', borderRadius: 6 }}
                                >
                                    <span>{u.avatar}</span>
                                    <span style={{ fontWeight: 600 }}>{lang === 'ar' ? (u.nameAr || u.name) : u.name}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>{u.position}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--border, rgba(0,0,0,.06))', background: 'var(--card-bg, #fff)' }}>
                        <input
                            value={input}
                            onChange={handleInput}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder={lang === 'ar' ? '@ذكر شخص أو اكتب رسالة...' : '@mention or type...'}
                            style={{ flex: 1, border: '1px solid var(--border, rgba(0,0,0,.1))', borderRadius: 10, padding: '8px 14px', fontSize: 13, background: 'var(--bg-main, #f8fafc)', color: 'var(--text, #1e293b)', outline: 'none' }}
                        />
                        <button
                            onClick={send}
                            style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 16 }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
