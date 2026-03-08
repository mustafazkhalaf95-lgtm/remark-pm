/**
 * FloatingAssistant — Internal Name: "مساعد ريمارك" (Remark Assistant)
 *
 * The intelligent AI chat assistant that appears as a floating button
 * in the bottom corner of the page.
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { RGB, PALETTE } from "@/lib/animationConfig";
import { useLanguage } from "@/context/LanguageContext";
import AssistantHexagon, { ASSISTANT_CFG } from "@/components/AssistantHexagon";

interface Message { id: number; text: string; sender: "user" | "assistant"; ts: Date; }

/* ── Mock AI — will be replaced with Claude API ── */
function getMockReply(input: string, lang: "ar" | "en"): string {
    const q = input.toLowerCase();
    if (lang === "ar") {
        if (q.includes("وظيف") || q.includes("شاغر") || q.includes("عمل"))
            return "لدينا حالياً 9 وظائف شاغرة تشمل: مدير تسويق، منسّق تسويق، أخصائي سوشال ميديا، ميديا باير، مدير إبداعي، كاتب محتوى، مدير حسابات، مصوّر فيديو، ومونتير. يمكنك تصفّح التفاصيل بالأسفل والتقديم مباشرة! 🎯";
        if (q.includes("رات") || q.includes("دخل") || q.includes("معاش"))
            return "الرواتب تنافسية وتُحدد حسب الخبرة والمؤهلات. نقدم حزمة شاملة تتضمن: راتب أساسي + بونص أداء + تأمين صحي. للتفاصيل الدقيقة، قدّم على الوظيفة وسنتواصل معك. 💼";
        if (q.includes("شرك") || q.includes("ريمارك") || q.includes("remark") || q.includes("عنك"))
            return "Remark هي وكالة تسويق رقمي متخصصة في إنتاج المحتوى الإبداعي، إدارة الحملات الإعلانية، والتسويق عبر وسائل التواصل الاجتماعي. فريقنا يعمل عن بُعد من مختلف أنحاء العالم! 🌍";
        if (q.includes("تقد") || q.includes("ارسل") || q.includes("سيرة") || q.includes("كيف اقدم"))
            return "التقديم سهل وسريع! اختَر الوظيفة المناسبة من القائمة، اضغط 'قدّم الآن'، واملأ بياناتك الشخصية مع رفع سيرتك الذاتية (PDF). سنتواصل معك خلال أيام عمل قليلة. ✨";
        if (q.includes("عن بعد") || q.includes("مكان") || q.includes("موقع") || q.includes("remote"))
            return "نعم! العمل لدينا عن بُعد بالكامل 🏠. يمكنك العمل من أي مكان في العالم. نستخدم أدوات تواصل حديثة لضمان التنسيق بين الفريق.";
        if (q.includes("خبر") || q.includes("مهار") || q.includes("شرط") || q.includes("متطلب"))
            return "المتطلبات تختلف حسب الوظيفة. بشكل عام نبحث عن: شغف بالتسويق الرقمي، مهارات تواصل ممتازة، وقدرة على العمل ضمن فريق. تفاصيل كل وظيفة موجودة في بطاقتها أدناه. 📋";
        return "شكراً لسؤالك! 😊 يمكنني مساعدتك بأي استفسار عن Remark أو الوظائف المتاحة. ماذا تود أن تعرف؟";
    }
    if (q.includes("job") || q.includes("position") || q.includes("opening"))
        return "We have 9 open positions including: Marketing Manager, Coordinator, Social Media Specialist, Media Buyer, Creative Director, Copywriter, Account Manager, Videographer, and Video Editor. Browse below and apply! 🎯";
    if (q.includes("salary") || q.includes("pay") || q.includes("compensation"))
        return "We offer competitive compensation based on experience: base salary + performance bonus + health insurance. Apply and we'll discuss details during the interview! 💼";
    if (q.includes("company") || q.includes("remark") || q.includes("about"))
        return "Remark is a leading digital marketing agency specializing in creative content, ad campaign management, and social media marketing. Our team works remotely worldwide! 🌍";
    if (q.includes("apply") || q.includes("how") || q.includes("submit"))
        return "Easy! Pick a position below, click 'Apply Now', fill in your details and upload your CV (PDF). We'll get back to you within a few business days. ✨";
    if (q.includes("remote") || q.includes("location") || q.includes("where"))
        return "Yes! We're fully remote 🏠. Work from anywhere in the world. We use modern tools for seamless team collaboration.";
    return "Thanks for your question! 😊 I can help with anything about Remark or our open positions. What would you like to know?";
}

export default function FloatingAssistant() {
    const { lang } = useLanguage();
    const isAr = lang === "ar";
    const [chatOpen, setChatOpen] = useState(false);
    const [welcomeShow, setWelcomeShow] = useState(false);
    const [bubbleText, setBubbleText] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const idRef = useRef(0);
    const [mounted, setMounted] = useState(false);
    const [spinKey, setSpinKey] = useState(0);

    /* ── Scroll Tracking to match Header ── */
    const { scrollY } = useScroll();
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setIsHeaderHidden(true);
        } else {
            setIsHeaderHidden(false);
        }
        if (latest <= 10) {
            setIsHeaderHidden(false);
        }
    });

    const showBottom = isHeaderHidden || chatOpen;

    /* ── Sync chat state globally ── */
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('sync-assistant-chat', { detail: chatOpen }));
    }, [chatOpen]);

    useEffect(() => {
        const handleToggle = () => {
            setChatOpen(prev => {
                if (!prev) {
                    // Opening from header — add welcome message if needed
                    setWelcomeShow(false);
                    if (messages.length === 0) {
                        setMessages([{
                            id: ++idRef.current, sender: "assistant", ts: new Date(),
                            text: isAr
                                ? "مرحباً ، مساعد ريمارك هنا لمساعدتك 😊"
                                : "Hello! 👋 I'm Remark's assistant. Happy to help with any questions about our company or positions. How can I help?",
                        }]);
                    }
                    return true;
                } else {
                    return false;
                }
            });
        };
        window.addEventListener('toggle-assistant-chat', handleToggle);
        return () => window.removeEventListener('toggle-assistant-chat', handleToggle);
    }, [messages.length, isAr]);

    /* ── Mount delay for entrance ── */
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 800);
        return () => clearTimeout(t);
    }, []);

    /* ── Initial Welcome & Periodic Ping ── */
    useEffect(() => {
        if (!mounted || chatOpen) return;

        // Show welcome greeting shortly after mount
        if (!hasShownWelcome) {
            const timer = setTimeout(() => {
                setHasShownWelcome(true);
                setBubbleText(isAr ? "مرحباً ، مساعد ريمارك هنا لمساعدتك 😊" : "Hi! I'm here to help 😊");
                setWelcomeShow(true);
                setSpinKey(k => k + 1);

                if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
                bubbleTimeoutRef.current = setTimeout(() => {
                    setWelcomeShow(false);
                    setTimeout(() => setBubbleText(""), 350);
                }, 6000);
            }, 2500); // Wait 2.5s after page load before greeting
            return () => clearTimeout(timer);
        }

        const interval = setInterval(() => {
            setWelcomeShow(false);
            setTimeout(() => setSpinKey(k => k + 1), 350);
        }, 15000);
        return () => clearInterval(interval);
    }, [mounted, chatOpen, hasShownWelcome, isAr]);

    /* ── Reset on Language Change ── */
    useEffect(() => {
        setMessages([]);
        setBubbleText("");
        setWelcomeShow(false);
    }, [lang]);

    /* ── Rotation complete callback ── */
    const handleRotationComplete = useCallback(() => {
        if (!chatOpen) {
            setTimeout(() => {
                // If bubbleText is set, it means it's a custom contextual message that already showed,
                // so don't override it with the default greeting right after rotation.
                // We only show default greeting if bubbleText is empty.
                if (!bubbleText) {
                    setWelcomeShow(true);
                    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
                    bubbleTimeoutRef.current = setTimeout(() => setWelcomeShow(false), 6000);
                }
            }, ASSISTANT_CFG.GREETING_DELAY);
        }
    }, [chatOpen]);

    /* ── Auto-scroll ── */
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

    /* ── Global Event Listener for Context-Aware Messages ── */
    useEffect(() => {
        if (!mounted) return;

        const handleAssistantMessage = (e: Event) => {
            const customEvent = e as CustomEvent<{ text: string; delay?: number }>;
            const { text, delay = 500 } = customEvent.detail || {};
            if (!text) return;

            if (chatOpen) {
                // If chat is already open, just add it to the conversation
                setTyping(true);
                setTimeout(() => {
                    setTyping(false);
                    setMessages(p => [...p, { id: ++idRef.current, text, sender: "assistant", ts: new Date() }]);
                }, delay);
            } else {
                // If chat is closed, show it as a popup bubble and spin the hexagon
                setBubbleText(text);
                setWelcomeShow(true);
                setSpinKey(k => k + 1); // Trigger rotation animation

                // Add it silently to messages so it's there if they open the chat later
                setMessages(p => {
                    // Prevent duplicates if they click multiple times
                    if (p.some(m => m.text === text)) return p;
                    return [...p, { id: ++idRef.current, text, sender: "assistant", ts: new Date() }];
                });

                // Auto dismiss bubble
                if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
                bubbleTimeoutRef.current = setTimeout(() => {
                    setWelcomeShow(false);
                    // We don't clear bubbleText immediately so it fades out with the text intact
                    setTimeout(() => setBubbleText(""), 350);
                }, 6000);
            }
        };

        window.addEventListener("assistant-message", handleAssistantMessage);
        return () => window.removeEventListener("assistant-message", handleAssistantMessage);
    }, [mounted, chatOpen]);

    /* ── Open chat ── */
    const openChat = useCallback(() => {
        setChatOpen(true);
        setWelcomeShow(false);
        if (messages.length === 0) {
            setMessages([{
                id: ++idRef.current, sender: "assistant", ts: new Date(),
                text: isAr
                    ? "مرحباً ، مساعد ريمارك هنا لمساعدتك 😊"
                    : "Hello! 👋 I'm Remark's assistant. Happy to help with any questions about our company or positions. How can I help?",
            }]);
        }
    }, [messages.length, isAr]);

    /* ── Send message ── */
    const send = useCallback(() => {
        const txt = input.trim();
        if (!txt) return;
        setMessages(p => [...p, { id: ++idRef.current, text: txt, sender: "user", ts: new Date() }]);
        setInput("");
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setMessages(p => [...p, {
                id: ++idRef.current, text: getMockReply(txt, lang), sender: "assistant", ts: new Date(),
            }]);
        }, 1000 + Math.random() * 800);
    }, [input, lang]);

    const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!mounted) return null;

    return (
        <>
            {/* ── Welcome bubble (adapts position: top or bottom) ── */}
            <AnimatePresence>
                {welcomeShow && (
                    <motion.div
                        initial={{ opacity: 0, y: showBottom ? 12 : -16, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: showBottom ? 6 : -8, scale: 0.96 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className={`fixed z-[9998] max-w-[280px] cursor-pointer ${showBottom
                            ? "bottom-[84px] right-4"
                            : `top-[96px] ${isAr ? "left-[max(24px,calc(50vw-500px))]" : "right-[max(24px,calc(50vw-500px))]"}`
                            }`}
                        onClick={() => { setWelcomeShow(false); openChat(); }}
                        dir={isAr ? "rtl" : "ltr"}
                    >
                        {showBottom ? (
                            /* ── Bottom Bubble Style ── */
                            <div className="relative px-4 py-3 rounded-2xl rounded-br-md text-sm text-white/90 leading-relaxed"
                                style={{
                                    background: `rgba(${RGB.slateBlue},0.85)`,
                                    backdropFilter: "blur(16px)",
                                    border: `1px solid rgba(${RGB.accentBlue},0.2)`,
                                    boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 12px rgba(${RGB.accentBlue},0.1)`,
                                }}>
                                {bubbleText || (isAr ? ASSISTANT_CFG.GREETING_TEXT : "Hi! 👋 Questions about our positions?")}

                                {/* Caret Bottom */}
                                <div className="absolute -bottom-[6px] right-5 w-3 h-3 rotate-45"
                                    style={{ background: `rgba(${RGB.slateBlue},0.85)`, borderRight: `1px solid rgba(${RGB.accentBlue},0.2)`, borderBottom: `1px solid rgba(${RGB.accentBlue},0.2)` }} />
                            </div>
                        ) : (
                            /* ── Top Bubble Style (Beautiful, Transparent, Glowing) ── */
                            <div className={`relative px-5 py-3.5 rounded-2xl text-[13px] font-medium text-white/95 leading-relaxed shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/10 hover:border-white/20 transition-colors ${isAr ? 'rounded-tl-md' : 'rounded-tr-md'}`}
                                style={{
                                    background: "rgba(10, 15, 30, 0.4)",
                                    backdropFilter: "blur(24px)",
                                }}>
                                {/* Subtle inner glow line */}
                                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                {bubbleText || (isAr ? ASSISTANT_CFG.GREETING_TEXT : "Hi! 👋 Questions about our positions?")}

                                {/* Caret Top */}
                                <div className={`absolute -top-[6px] ${isAr ? 'left-6' : 'right-6'} w-3 h-3 rotate-45 border-l border-t border-white/10`}
                                    style={{ background: "rgba(10, 15, 30, 0.7)", backdropFilter: "blur(24px)" }} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Circle assistant button (Bottom Pop-in) ── */}
            <AnimatePresence>
                {showBottom && (
                    <motion.div
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="fixed bottom-4 right-4 z-[9999]"
                        style={{ originX: 0.5, originY: 0.5 }}
                    >
                        <AssistantHexagon
                            isOpen={chatOpen}
                            onClick={chatOpen ? () => setChatOpen(false) : openChat}
                            onRotationComplete={handleRotationComplete}
                            spinKey={spinKey}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Chat window ── */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed bottom-4 right-4 z-[9998] w-[360px] max-w-[calc(100vw-32px)] flex flex-col overflow-hidden"
                        style={{
                            height: 480, maxHeight: "calc(100vh - 120px)",
                            background: `rgba(${RGB.deepNavy},0.92)`,
                            backdropFilter: "blur(24px)",
                            border: `1px solid rgba(${RGB.accentBlue},0.15)`,
                            borderRadius: 24,
                            boxShadow: `0 16px 64px rgba(0,0,0,0.5), 0 0 20px rgba(${RGB.accentBlue},0.08)`,
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{
                            borderBottom: `1px solid rgba(${RGB.accentBlue},0.1)`,
                            background: `rgba(${RGB.slateBlue},0.3)`,
                        }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{
                                background: `radial-gradient(circle at 35% 30%, rgba(${RGB.accentBlue},0.4), ${PALETTE.deepNavy})`,
                                border: `1px solid rgba(${RGB.accentBlue},0.3)`,
                            }}>
                                <span className="text-sm">✦</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white/90">Remark Assistant</div>
                                <div className="text-[11px] text-emerald-400/80 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {isAr ? "متصل الآن" : "Online"}
                                </div>
                            </div>
                            <button onClick={() => setChatOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                                style={{ color: `rgba(${RGB.highlight},0.5)` }}>
                                <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin" dir={isAr ? "rtl" : "ltr"}>
                            {messages.map(msg => (
                                <motion.div key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.sender === "user" ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
                                        }`} style={msg.sender === "user" ? {
                                            background: `linear-gradient(135deg, rgba(${RGB.accentBlue},0.5), rgba(${RGB.violetAccent},0.35))`,
                                            color: `rgba(${RGB.highlight},0.95)`,
                                        } : {
                                            background: `rgba(${RGB.slateBlue},0.5)`,
                                            border: `1px solid rgba(${RGB.accentBlue},0.08)`,
                                            color: "rgba(255,255,255,0.82)",
                                        }}>
                                        {msg.text}
                                        <div className={`text-[10px] mt-1.5 ${msg.sender === "user" ? "text-white/35" : "text-white/25"}`}>
                                            {fmt(msg.ts)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {typing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex justify-start">
                                    <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5"
                                        style={{ background: `rgba(${RGB.slateBlue},0.5)` }}>
                                        <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                                        <span className="typing-dot" style={{ animationDelay: "150ms" }} />
                                        <span className="typing-dot" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Input */}
                        <div className="px-3 py-3 shrink-0" style={{ borderTop: `1px solid rgba(${RGB.accentBlue},0.08)` }}>
                            <div className="flex items-center gap-2 rounded-2xl px-3 py-1" style={{
                                background: `rgba(${RGB.slateBlue},0.35)`,
                                border: `1px solid rgba(${RGB.accentBlue},0.1)`,
                            }}>
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={onKey}
                                    placeholder={isAr ? "اكتب سؤالك هنا..." : "Type your question..."}
                                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-white/85 placeholder-white/25 py-2"
                                    dir={isAr ? "rtl" : "ltr"}
                                />
                                <button onClick={send} disabled={!input.trim()}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-30"
                                    style={{
                                        background: input.trim() ? `rgba(${RGB.accentBlue},0.5)` : "transparent",
                                    }}>
                                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none"
                                        className={isAr ? "rotate-180" : ""}>
                                        <path d="M3 8H13M13 8L9 4M13 8L9 12"
                                            stroke={`rgba(${RGB.highlight},0.8)`} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="text-center text-[10px] text-white/15 mt-2">
                                Powered by Remark AI
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
