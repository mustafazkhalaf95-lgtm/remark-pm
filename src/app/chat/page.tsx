'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';
import GlassCard from '@/components/GlassCard';

interface Member { user: { id: string; name: string; avatar?: string } }
interface Message { id: string; content: string; createdAt: string; user: { id: string; name: string; avatar?: string; role: string }; mentions: any[] }
interface Channel { id: string; name: string; description?: string; channelType: string; members: Member[]; messages: Message[]; unreadCount: number; _count: { messages: number; members: number } }
interface UserResult { id: string; name: string; role: string }

const ROLE_COLORS: Record<string, string> = { CEO: '#6366f1', COO: '#8b5cf6', CREATIVE_MANAGER: '#06b6d4', PRODUCTION_MANAGER: '#f59e0b', MARKETING: '#22c55e', DESIGNER: '#a855f7', COPYWRITER: '#ec4899', ACCOUNT_MANAGER: '#f97316', MEMBER: '#64748b' };

export default function ChatPage() {
    const { data: session } = useSession();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<UserResult[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<any>(null);

    const fetchChannels = useCallback(async () => {
        const res = await fetch('/api/channels');
        if (res.ok) {
            const data = await res.json();
            setChannels(data);
            if (!activeChannel && data.length > 0) setActiveChannel(data[0].id);
        }
        setLoading(false);
    }, [activeChannel]);

    const fetchMessages = useCallback(async () => {
        if (!activeChannel) return;
        const res = await fetch(`/api/channels/${activeChannel}/messages`);
        if (res.ok) setMessages(await res.json());
    }, [activeChannel]);

    useEffect(() => { fetchChannels(); }, [fetchChannels]);
    useEffect(() => { if (activeChannel) { fetchMessages(); } }, [activeChannel, fetchMessages]);

    // Polling for new messages every 3 seconds
    useEffect(() => {
        if (activeChannel) {
            pollRef.current = setInterval(fetchMessages, 3000);
            return () => clearInterval(pollRef.current);
        }
    }, [activeChannel, fetchMessages]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // @mention search
    useEffect(() => {
        if (mentionSearch !== null) {
            fetch(`/api/search/users?q=${mentionSearch}`).then(r => r.json()).then(data => setMentionResults(data));
        } else {
            setMentionResults([]);
        }
    }, [mentionSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        // Check for @mention trigger
        const lastAtIndex = val.lastIndexOf('@');
        if (lastAtIndex >= 0 && (lastAtIndex === 0 || val[lastAtIndex - 1] === ' ')) {
            const query = val.substring(lastAtIndex + 1);
            if (!query.includes(' ')) { setMentionSearch(query); setMentionIndex(0); return; }
        }
        setMentionSearch(null);
    };

    const insertMention = (user: UserResult) => {
        const lastAtIndex = input.lastIndexOf('@');
        const before = input.substring(0, lastAtIndex);
        const firstName = user.name.split(' ')[0].split('(')[0].trim();
        setInput(`${before}@${firstName} `);
        setMentionSearch(null);
        inputRef.current?.focus();
    };

    const sendMessage = async () => {
        if (!input.trim() || !activeChannel) return;
        const content = input.trim();
        setInput('');

        const res = await fetch(`/api/channels/${activeChannel}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        if (res.ok) {
            const msg = await res.json();
            setMessages(prev => [...prev, msg]);
        }
    };

    const createChannel = async () => {
        if (!newChannelName.trim()) return;
        const res = await fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newChannelName }),
        });
        if (res.ok) {
            const ch = await res.json();
            setChannels(prev => [ch, ...prev]);
            setActiveChannel(ch.id);
            setShowNewChannel(false);
            setNewChannelName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mentionSearch !== null && mentionResults.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionResults.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionResults[mentionIndex]); }
            else if (e.key === 'Escape') { setMentionSearch(null); }
            return;
        }
        if (e.key === 'Enter') sendMessage();
    };

    const escapeHtml = (text: string) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const formatMessageContent = (content: string) => {
        const escaped = escapeHtml(content);
        return escaped.replace(/@(\w+)/g, '<span class="text-violet-400 font-bold bg-violet-500/10 px-1 rounded">@$1</span>');
    };

    const formatTime = (date: string) => {
        const d = new Date(date);
        return d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    };

    const activeChannelData = channels.find(c => c.id === activeChannel);
    const userId = (session?.user as any)?.id;

    if (loading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Topbar */}
            <div className="flex items-center justify-between p-6 pb-2 relative z-10">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">💬 المحادثات</h1>
            </div>

            <div className="flex h-[calc(100vh-80px)] overflow-hidden relative z-10 px-6 pb-6 pt-2">
                <div className="flex w-full bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">

                    {/* Channel Sidebar */}
                    <div className="w-72 min-w-[288px] bg-white/[0.01] border-l border-white/5 flex flex-col h-full">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <span className="font-bold text-white/90">القنوات</span>
                            <button className="w-8 h-8 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 border border-violet-500/20 shadow-sm flex items-center justify-center transition-colors" onClick={() => setShowNewChannel(true)}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>

                        {showNewChannel && (
                            <div className="p-4 border-b border-white/5 bg-white/5 pb-5">
                                <input
                                    className="w-full bg-[#0d0e1b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 mb-3"
                                    placeholder="اسم القناة..."
                                    value={newChannelName}
                                    onChange={e => setNewChannelName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') createChannel(); if (e.key === 'Escape') setShowNewChannel(false); }}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-[0_0_10px_rgba(124,58,237,0.4)] transition-colors" onClick={createChannel}>إنشاء</button>
                                    <button className="flex-1 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setShowNewChannel(false)}>إلغاء</button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                            {channels.map(ch => {
                                const active = activeChannel === ch.id;
                                return (
                                    <div
                                        key={ch.id}
                                        onClick={() => setActiveChannel(ch.id)}
                                        className={`p-3 rounded-xl cursor-pointer mb-1 transition-all flex flex-col gap-1 border border-transparent ${active ? 'bg-violet-500/15 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`font-semibold text-sm flex items-center gap-2 ${active ? 'text-violet-300' : 'text-white/80'}`}>
                                                <span className={active ? 'text-violet-400' : 'text-white/40'}>{ch.channelType === 'DIRECT' ? '👤' : '#'}</span>
                                                {ch.name}
                                            </span>
                                            {ch.unreadCount > 0 && (
                                                <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(236,72,153,0.5)]">
                                                    {ch.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {ch.messages[0] && (
                                            <div className="text-[11px] text-white/40 truncate flex items-center gap-1.5 pl-5">
                                                <span className="font-medium text-white/50">{ch.messages[0].user.name.split(' ')[0]}:</span>
                                                <span>{ch.messages[0].content}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 flex flex-col h-full relative">
                        {/* Channel Header */}
                        {activeChannelData && (
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-4 backdrop-blur-md z-10 shadow-sm">
                                <h2 className="text-lg font-bold text-white/90 m-0">
                                    <span className="text-violet-400 mr-1">{activeChannelData.channelType === 'DIRECT' ? '👤' : '#'}</span>
                                    {activeChannelData.name}
                                </h2>
                                {activeChannelData.description && (
                                    <span className="text-sm text-white/40 border-r border-white/10 pr-4 mr-4 hidden md:inline-block">
                                        {activeChannelData.description}
                                    </span>
                                )}
                                <div className="mr-auto flex items-center gap-2 text-xs text-white/40 px-3 py-1 bg-white/5 rounded-full">
                                    👥 {activeChannelData._count.members} عضو
                                </div>
                            </div>
                        )}

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/40 animate-fade-in-up">
                                    <span className="text-6xl mb-6 opacity-80 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">💬</span>
                                    <span className="text-xl font-bold text-white mb-2">في انتظار الرسالة الأولى!</span>
                                    <span className="text-sm">اطرح فكرة، أو استخدم '@' لذكر أحد الزملاء.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {messages.map((msg, i) => {
                                        const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id;
                                        return (
                                            <div key={msg.id} className={`flex gap-4 ${!showAvatar ? '-mt-4' : ''}`}>
                                                {showAvatar ? (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0" style={{ background: ROLE_COLORS[msg.user.role] || '#64748b' }}>
                                                        {msg.user.name.charAt(0)}
                                                    </div>
                                                ) : <div className="w-10 flex-shrink-0" />}
                                                <div className="flex-1 max-w-[85%]">
                                                    {showAvatar && (
                                                        <div className="flex items-baseline gap-2 mb-1.5">
                                                            <span className="font-bold text-sm" style={{ color: ROLE_COLORS[msg.user.role] || 'white' }}>{msg.user.name}</span>
                                                            <span className="text-[11px] text-white/40">{formatTime(msg.createdAt)}</span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`text-sm text-white/90 leading-relaxed max-w-max px-4 py-2.5 rounded-2xl ${msg.user.id === userId ? 'bg-violet-600/60 border border-violet-500/30 rounded-tr-md' : 'bg-white/5 border border-white/5 rounded-tl-md'}`}
                                                    >
                                                        <span dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} className="h-4" />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.01] relative">
                            {mentionSearch !== null && mentionResults.length > 0 && (
                                <GlassCard className="absolute bottom-[calc(100%+8px)] left-4 right-4 max-h-48 overflow-y-auto z-50 p-2 shadow-2xl border-violet-500/20">
                                    {mentionResults.map((u, i) => (
                                        <div
                                            key={u.id}
                                            onClick={() => insertMention(u)}
                                            className={`p-2 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${i === mentionIndex ? 'bg-violet-500/20' : 'hover:bg-white/5'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ background: ROLE_COLORS[u.role] || '#64748b' }}>
                                                {u.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-sm text-white/90">{u.name}</span>
                                            <span className="text-[10px] uppercase font-bold text-white/40 ml-auto bg-white/5 px-2 py-0.5 rounded-md">{u.role}</span>
                                        </div>
                                    ))}
                                </GlassCard>
                            )}
                            <div className="flex items-end gap-3 bg-[#0d0e1b]/80 border border-white/10 rounded-2xl p-2 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50 transition-all shadow-inner">
                                <textarea
                                    ref={inputRef as any}
                                    className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none resize-none pt-2.5 px-3 min-h-[40px] max-h-[120px]"
                                    placeholder="اكتب رسالة... استخدم @ لذكر زميل في الفريق"
                                    rows={1}
                                    value={input}
                                    onChange={e => {
                                        handleInputChange(e as any);
                                        // Auto-resize textarea
                                        e.target.style.height = 'auto';
                                        e.target.style.height = (e.target.scrollHeight) + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-colors flex-shrink-0 mb-0.5"
                                    onClick={sendMessage}
                                    disabled={!input.trim()}
                                >
                                    <svg className="w-5 h-5 -rotate-90 transform translate-x-px translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
