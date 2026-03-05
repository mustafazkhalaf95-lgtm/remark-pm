"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import BadgePill from "@/components/BadgePill";
import GlowBackground from "@/components/GlowBackground";
import RemarkLogo from "@/components/RemarkLogo";
import CrystalOrb from "@/components/CrystalOrb";
import CardHexagonBg from "@/components/CardHexagonBg";
import { useLanguage } from "@/context/LanguageContext";
import { ROLES } from "@/lib/roles";
import { type OrbAnimState } from "@/lib/animationConfig";

function getRoleIcon(id: string): string {
    const icons: Record<string, string> = {
        "marketing-manager": "📊",
        "marketing-coordinator": "🗂️",
        "social-media-specialist": "📱",
        "media-buyer": "📈",
        "creative-director": "🎨",
        copywriter: "✍️",
        "account-manager": "🤝",
        videographer: "🎥",
        "video-editor": "🎬",
    };
    return icons[id] ?? "💼";
}

function JobCard({ role, i, t, router, isActive = true, expanded = false, onExpand, onCollapse }: { role: any; i: number; t: any; router: any; isActive?: boolean; expanded?: boolean; onExpand?: () => void; onCollapse?: () => void }) {
    const { dir } = useLanguage();
    const localized = t.roles[role.id] as { title: string; description: string; responsibilities: string[]; requirements: string[] };

    const triggerAssistant = () => {
        if (expanded) return;
        const textEn = `Great choice! Any questions about the ${role.title} role? 💼`;
        const textAr = `اختيار رائع! هل لديك استفسار عن وظيفة ${localized.title}؟ 💼`;

        window.dispatchEvent(
            new CustomEvent("assistant-message", {
                detail: { text: dir === "rtl" ? textAr : textEn, delay: 600 }
            })
        );
        onExpand?.();
    };

    // Auto-collapse when sliding away in carousel
    useEffect(() => {
        if (!isActive && expanded) {
            onCollapse?.();
        }
    }, [isActive, expanded, onCollapse]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, width: expanded ? 700 : 340 }}
            transition={{
                opacity: { delay: i * 0.08 },
                y: { delay: i * 0.08 },
                width: { type: "spring", stiffness: 200, damping: 25 },
                layout: { type: "spring", stiffness: 350, damping: 30 }
            }}
            className="flex"
            style={{ willChange: "transform, opacity, width" }}
        >
            <GlassCard
                hoverable
                className={`p-6 w-full flex gap-0 group ${expanded ? '!overflow-visible' : 'overflow-hidden'} min-h-[420px] !bg-white/[0.02] !backdrop-blur-md !border-white/[0.05] ${!expanded && isActive ? "hover:-translate-y-2" : ""} transition-all duration-300 pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.1)]`}
            >
                {/* Hexagon Background Effect (Dimmed when inactive) */}
                <CardHexagonBg isActive={isActive} />

                {/* Content Container (Flex Row for horizontal expansion) */}
                <div className="relative z-10 flex flex-row h-full w-full">
                    {/* Left Column (Main Card Content - Fixed Width) */}
                    <motion.div layout className="flex flex-col gap-4 w-[292px] shrink-0 h-full">
                        {/* Header Row */}
                        <motion.div layout className="flex items-start gap-4 w-full">
                            <motion.div layout className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] backdrop-blur-md">
                                {getRoleIcon(role.id)}
                            </motion.div>
                            <div className="flex-1 w-full">
                                <h2 className="text-xl font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors duration-300">
                                    {localized.title}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                        SYS-REF-{role.id.substring(0, 4).toUpperCase()}-0{i + 1}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Divider */}
                        <motion.div layout className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Description */}
                        <motion.p layout className="text-sm text-white/60 leading-relaxed font-light">
                            {localized.description}
                        </motion.p>

                        {/* Tags */}
                        <motion.div layout className="flex flex-wrap gap-1.5 mt-auto pb-1">
                            {role.tags.map((tag: any) => (
                                <BadgePill key={tag.label} label={tag.label} color={tag.color} />
                            ))}
                        </motion.div>

                        {/* Actions Panel */}
                        <motion.div layout className="mt-1 flex items-center gap-0 w-full p-1 bg-white/[0.02] border border-white/5 rounded-[18px] backdrop-blur-md">
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                className="flex-1 whitespace-nowrap !text-white/60 hover:!text-white hover:!bg-white/[0.04] !rounded-l-[14px] !rounded-r-none !border-transparent"
                                onClick={expanded ? () => onCollapse?.() : triggerAssistant}
                            >
                                {expanded ? t.hideDetails : t.viewDetails}
                            </GlassButton>
                            <div className="w-px h-6 bg-white/10" />
                            <GlassButton
                                variant="primary"
                                size="sm"
                                className="flex-1 whitespace-nowrap !bg-cyan-500/10 hover:!bg-cyan-500/20 !text-cyan-300 !border-transparent !rounded-r-[14px] !rounded-l-none hover:shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] transition-all"
                                onClick={() => router.push(`/apply?role=${role.id}`)}
                            >
                                {t.applyNow}
                            </GlassButton>
                        </motion.div>
                    </motion.div>

                    {/* Right Column (Expanded Details - Slides in horizontally) */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                animate={{ opacity: 1, width: 292, marginLeft: 24 }} // 292px matches left col, 24px gap
                                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
                                className="flex flex-col gap-6 overflow-hidden border-l border-white/[0.06] pl-6 h-full justify-center"
                            >
                                {/* Responsibilities */}
                                {localized.responsibilities && (
                                    <div>
                                        <h3 className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="w-3 h-px bg-cyan-400/50" />
                                            {t.respTitle}
                                        </h3>
                                        <ul className="space-y-2">
                                            {localized.responsibilities.map((item: string, idx: number) => (
                                                <li key={idx} className="text-[11px] text-white/60 flex items-start gap-2">
                                                    <span className="text-violet-500/70 mt-[1px] shrink-0 text-[10px]">▹</span>
                                                    <span className="leading-relaxed font-light">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Requirements */}
                                {localized.requirements && (
                                    <div className="pb-2">
                                        <h3 className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="w-3 h-px bg-cyan-400/50" />
                                            {t.reqTitle}
                                        </h3>
                                        <ul className="space-y-2">
                                            {localized.requirements.map((item: string, idx: number) => (
                                                <li key={idx} className="text-[11px] text-white/60 flex items-start gap-2">
                                                    <span className="text-violet-500/70 mt-[1px] shrink-0 text-[10px]">▹</span>
                                                    <span className="leading-relaxed font-light">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </GlassCard>
        </motion.div>
    );
}

export default function CareersPage() {
    const { t, dir } = useLanguage();
    const router = useRouter();
    const [orbState, setOrbState] = useState<OrbAnimState>("idle");
    const [activeJobIndex, setActiveJobIndex] = useState(0);
    const [expandedJobIndex, setExpandedJobIndex] = useState<number | null>(null);
    const isDetailView = expandedJobIndex !== null;

    // Infinite wrapping helpers
    const n = ROLES.length;
    const wrap = (idx: number) => ((idx % n) + n) % n;

    return (
        <main className="relative min-h-screen" dir={dir}>
            <GlowBackground />

            {/* ── PREMIUM HERO REDESIGN ── */}
            <section className="relative w-full max-w-5xl mx-auto px-6 pt-32 pb-20 md:pt-44 md:pb-28">

                {/* Deep Background Ambience */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none overflow-hidden -z-10">
                    <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

                    {/* Left/Text Side (Kinetic Typography) */}
                    <motion.div
                        initial={{ opacity: 0, x: dir === 'rtl' ? 40 : -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full lg:w-[55%] flex flex-col items-start text-start relative z-10"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/30 text-violet-300 text-[11px] font-bold uppercase tracking-[0.2em] mb-8 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            {t.heroBadge}
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.1] mb-6 tracking-tight">
                            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="block">
                                {t.heroTitle1}
                            </motion.span>
                            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="block mt-2">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 animate-gradient-x" style={{ backgroundSize: '200% auto' }}>
                                    {t.heroTitle2}
                                </span>
                            </motion.span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
                            className="text-white/60 text-lg max-w-lg leading-relaxed mb-10 font-medium"
                        >
                            {t.heroSubtitle(ROLES.length)}
                        </motion.p>

                        {/* Integrated Stats Glass Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
                            className="flex flex-wrap items-center justify-start gap-4"
                        >
                            {[
                                { value: `${ROLES.length}`, label: t.statRoles, icon: "🔥" },
                                { value: t.statWorkVal, label: t.statWork, icon: "🌍" },
                                { value: t.statGrowthVal, label: t.statGrowth, icon: "🚀" },
                            ].map((stat, idx) => (
                                <div key={idx} className="glass px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
                                    <div className="text-xl">{stat.icon}</div>
                                    <div className="text-start">
                                        <div className="text-lg font-bold text-white leading-none mb-1">{stat.value}</div>
                                        <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right/Visual Side (Floating Parallax) */}
                    <div className="w-full lg:w-[45%] relative h-[450px] flex items-center justify-center pointer-events-none lg:pointer-events-auto">

                        {/* Main Central Visual */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
                            className="relative z-10 w-[300px] h-[300px] flex justify-center items-center"
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CrystalOrb size={320} onStateChange={setOrbState} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                <RemarkLogo size="lg" orbState={orbState} />
                            </div>
                        </motion.div>

                        {/* Floating Min-Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: [0, -15, 0] }} transition={{ opacity: { delay: 1, duration: 0.8 }, y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
                            className={`absolute top-10 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-20`}
                        >
                            <div className="glass px-4 py-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm">✨</div>
                                <div>
                                    <div className="text-xs text-white/50 font-medium mb-0.5">{dir === 'rtl' ? "انضم لفريقنا" : "Join the Team"}</div>
                                    <div className="text-sm font-bold text-white leading-none">{dir === 'rtl' ? "بيئة إبداعية" : "Creative Environment"}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Min-Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: [0, 20, 0] }} transition={{ opacity: { delay: 1.2, duration: 0.8 }, y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 } }}
                            className={`absolute bottom-16 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-20`}
                        >
                            <div className="glass px-4 py-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">💎</div>
                                <div>
                                    <div className="text-xs text-white/50 font-medium mb-0.5">{dir === 'rtl' ? "المستقبل" : "The Future"}</div>
                                    <div className="text-sm font-bold text-gradient leading-none">{dir === 'rtl' ? "ريمارك" : "Remark"}</div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
                >
                    <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{dir === 'rtl' ? "اكتشف المستقبل" : "Explore the Future"}</span>
                    <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center pt-2">
                        <motion.div
                            animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="w-1 h-1 rounded-full bg-violet-400"
                        />
                    </div>
                </motion.div>
            </section>

            {/* 3D Coverflow Jobs Carousel */}
            <section className="max-w-6xl mx-auto px-6 pb-32">
                <AnimatePresence mode="wait">
                    {!isDetailView ? (
                        /* ===== CAROUSEL MODE ===== */
                        <motion.div
                            key="carousel-mode"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="relative h-[650px] w-full flex items-center justify-center pointer-events-none" style={{ perspective: "1200px" }}>
                                {ROLES.map((role, i) => {
                                    const isActive = i === activeJobIndex;
                                    const offset = i - activeJobIndex;
                                    // Wrap offsets for infinite illusion
                                    let wrappedOffset = offset;
                                    if (wrappedOffset > n / 2) wrappedOffset -= n;
                                    if (wrappedOffset < -n / 2) wrappedOffset += n;
                                    const absOffset = Math.abs(wrappedOffset);

                                    // Render ONLY 5 cards (center, 2 left, 2 right) for the cylinder effect
                                    if (absOffset > 2) return null;

                                    const directionFactor = dir === 'rtl' ? -1 : 1;
                                    const RADIUS = 850;
                                    const ANGLE_STEP = 24;

                                    const angleDeg = wrappedOffset * ANGLE_STEP * directionFactor;
                                    const angleRad = (angleDeg * Math.PI) / 180;

                                    const extraGap = absOffset > 0 ? (80 * Math.sign(wrappedOffset) * directionFactor) : 0;
                                    const xOffset = (RADIUS * Math.sin(angleRad)) + extraGap;
                                    const zOffset = RADIUS * Math.cos(angleRad) - RADIUS;

                                    const rotateY = angleDeg;
                                    const scale = isActive ? 1.2 : 1 - (absOffset * 0.08);
                                    const opacity = isActive ? 1 : Math.max(0.2, 1 - (absOffset * 0.35));
                                    const zIndex = 50 - absOffset;

                                    return (
                                        <motion.div
                                            key={role.id}
                                            className={`absolute flex items-start justify-center ${isActive ? 'cursor-default pointer-events-auto' : 'cursor-pointer pointer-events-auto'}`}
                                            style={{ zIndex }}
                                            initial={false}
                                            animate={{
                                                x: xOffset,
                                                z: zOffset,
                                                rotateY: rotateY,
                                                scale: scale,
                                                opacity: opacity,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 220,
                                                damping: 25,
                                                mass: 1
                                            }}
                                            onClick={() => !isActive && setActiveJobIndex(i)}
                                        >
                                            <div className={`h-full rounded-[26px] ${isActive ? 'active-card-glow' : ''}`}>
                                                <JobCard
                                                    role={role} i={i} t={t} router={router}
                                                    isActive={isActive}
                                                    expanded={false}
                                                    onExpand={() => setExpandedJobIndex(i)}
                                                    onCollapse={() => setExpandedJobIndex(null)}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Carousel Navigation */}
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <button
                                    onClick={() => setActiveJobIndex(prev => wrap(prev - 1))}
                                    className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {dir === 'rtl' ? '→' : '←'}
                                </button>

                                <div className="flex gap-2">
                                    {ROLES.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveJobIndex(i)}
                                            className={`h-2 rounded-full transition-all duration-300 ${i === activeJobIndex ? 'bg-violet-400 w-8' : 'bg-white/20 hover:bg-white/40 w-2'}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => setActiveJobIndex(prev => wrap(prev + 1))}
                                    className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {dir === 'rtl' ? '←' : '→'}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* ===== DETAIL VIEW MODE ===== */
                        <motion.div
                            key="detail-mode"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-10"
                        >
                            {/* Expanded Card (Top, Centered, Wide) */}
                            <motion.div
                                initial={{ y: 0, scale: 1.2 }}
                                animate={{ y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                className="active-card-glow rounded-[26px]"
                            >
                                <JobCard
                                    role={ROLES[expandedJobIndex]} i={expandedJobIndex} t={t} router={router}
                                    isActive={true}
                                    expanded={true}
                                    onExpand={() => { }}
                                    onCollapse={() => setExpandedJobIndex(null)}
                                />
                            </motion.div>

                            {/* Other Cards (Small Row Below) */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 25 }}
                                className="flex items-start justify-center gap-4 flex-wrap max-w-5xl"
                            >
                                {ROLES.filter((_, i) => i !== expandedJobIndex).map((role, idx) => {
                                    const originalIndex = ROLES.indexOf(role);
                                    return (
                                        <motion.div
                                            key={role.id}
                                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                            animate={{ opacity: 0.7, y: 0, scale: 0.75 }}
                                            whileHover={{ opacity: 1, scale: 0.8 }}
                                            transition={{ delay: idx * 0.04, type: "spring", stiffness: 200, damping: 25 }}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                setActiveJobIndex(originalIndex);
                                                setExpandedJobIndex(originalIndex);
                                            }}
                                        >
                                            <JobCard
                                                role={role} i={originalIndex} t={t} router={router}
                                                isActive={false}
                                                expanded={false}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.06] py-8">
                <p className="text-center text-white/30 text-sm">
                    {t.footerText(new Date().getFullYear())}
                </p>
            </footer>
        </main>
    );
}
