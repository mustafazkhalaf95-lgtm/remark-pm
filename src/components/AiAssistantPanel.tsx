'use client';
import { useState, useRef, useEffect } from 'react';
import { apiUrl } from '@/lib/hooks';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AiAssistantPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(apiUrl('/api/ai/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, conversationId }),
            });
            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setMessages(prev => [...prev, { id: data.message.id, role: 'assistant', content: data.message.content }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'حدث خطأ. حاول مرة أخرى.' }]);
        }
        setLoading(false);
    };

    const quickActions = [
        { label: '📊 تقرير الأداء', prompt: 'أعطيني تقرير شامل عن أداء المشاريع والتأخيرات' },
        { label: '👥 أداء الفريق', prompt: 'أعطيني تقييم أداء الفريق' },
        { label: '🎯 الأولويات', prompt: 'ما هي أولوياتي حالياً؟' },
        { label: '🔄 سير العمل', prompt: 'اشرح لي مسار العمل' },
    ];

    // Render markdown-like content (simple)
    const renderContent = (content: string) => {
        return content
            .replace(/## (.*)\n/g, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
            .replace(/### (.*)\n/g, '<h4 class="text-sm font-bold text-white/90 mt-3 mb-1">$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-violet-300 text-[11px]">$1</code>')
            .replace(/^- (.*)/gm, '<li class="text-sm text-white/80 mr-4">$1</li>')
            .replace(/^(\d+)\. (.*)/gm, '<li class="text-sm text-white/80 mr-4">$2</li>')
            .replace(/> (.*)/gm, '<blockquote class="border-r-2 border-violet-500 pr-3 text-sm text-white/70 my-2 italic">$1</blockquote>')
            .replace(/\| (.*)/gm, '<div class="text-xs text-white/60 font-mono">| $1</div>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 left-6 z-[90] w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_25px_rgba(124,58,237,0.5)] flex items-center justify-center text-white text-2xl hover:scale-110 active:scale-95 transition-all ${isOpen ? 'rotate-45' : ''}`}
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Panel */}
            <div className={`fixed bottom-24 left-6 z-[90] w-[420px] max-w-[calc(100vw-3rem)] transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="bg-[#0d0e1b]/95 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[70vh]">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg shadow-lg">🤖</div>
                            <div>
                                <div className="font-bold text-white text-sm">مساعد ريمارك الذكي</div>
                                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> متصل
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions (only shown when no messages) */}
                    {messages.length === 0 && (
                        <div className="p-4 border-b border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-3">إجراءات سريعة</div>
                            <div className="grid grid-cols-2 gap-2">
                                {quickActions.map(action => (
                                    <button
                                        key={action.label}
                                        onClick={() => { setInput(action.prompt); setTimeout(() => sendMessage(), 100); setInput(action.prompt); }}
                                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all text-center"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin min-h-[200px]">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <span className="text-4xl mb-4">🤖</span>
                                <p className="text-white/60 text-sm font-semibold mb-1">مرحباً! أنا مساعدك الذكي</p>
                                <p className="text-white/40 text-xs">اسألني أي شيء عن المشاريع والمهام</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-violet-600/50 border border-violet-500/30 rounded-2xl rounded-br-md' : 'bg-white/5 border border-white/5 rounded-2xl rounded-bl-md'} px-4 py-3`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="text-sm text-white/90 leading-relaxed [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_h4]:font-bold" dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                                    ) : (
                                        <div className="text-sm text-white">{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-white/5">
                        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-violet-500/50 transition-all">
                            <input
                                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none py-3 px-4"
                                placeholder="اكتب سؤالك..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="px-3 py-2 text-violet-400 hover:text-violet-300 disabled:opacity-30 transition-colors"
                            >
                                <svg className="w-5 h-5 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
