"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import RemarkLogo from "./RemarkLogo";
import AssistantHexagon from "./AssistantHexagon";
import LanguageSwitcher from "./LanguageSwitcher";
import GlassButton from "./GlassButton";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
    const { t, dir } = useLanguage();
    const pathname = usePathname();
    const isApplyPage = pathname === "/apply";

    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    // Sync state with the main FloatingAssistant
    useEffect(() => {
        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent<boolean>;
            setChatOpen(customEvent.detail);
        };
        window.addEventListener('sync-assistant-chat', handleSync);
        return () => window.removeEventListener('sync-assistant-chat', handleSync);
    }, []);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setHidden(true); // scrolling down
        } else {
            setHidden(false); // scrolling up
        }
        if (latest <= 10) {
            setHidden(false); // force show at top
        }
    });

    const showTop = !hidden;

    return (
        <motion.header
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: "-100%", opacity: 0 }
            }}
            initial="visible"
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-6 inset-x-0 z-50 flex justify-center w-full px-6 pointer-events-none"
            dir={dir}
        >
            <div
                dir={dir}
                className="pointer-events-auto flex items-center justify-between px-6 py-2.5 rounded-full bg-black/10 backdrop-blur-xl border border-white/5 shadow-[0_4px_32px_rgba(0,0,0,0.15)] max-w-5xl w-full mx-auto relative overflow-hidden group hover:border-white/10 hover:bg-black/20 transition-all duration-500"
            >

                {/* Subtle embedded glow effect */}
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Navigation Buttons (Swaps based on direction) */}
                <div className="relative z-10 flex items-center">
                    {isApplyPage ? (
                        <Link href="/">
                            <GlassButton variant="ghost" size="sm" className="hidden sm:inline-flex !rounded-full !px-5" >
                                {t.navAllRoles}
                            </GlassButton>
                        </Link>
                    ) : (
                        <Link href="/apply">
                            <GlassButton variant="primary" size="sm" className="hidden sm:inline-flex !rounded-full !px-6 bg-gradient-to-r from-violet-600/80 to-blue-600/80 hover:from-violet-500 hover:to-blue-500 shadow-none hover:shadow-glow opacity-90 hover:opacity-100">
                                {t.navOpenApp}
                            </GlassButton>
                        </Link>
                    )}
                </div>

                {/* Tools & Branding (Swaps based on direction) */}
                <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                    <div className="shadow-inner bg-black/10 rounded-full px-1 py-1">
                        <LanguageSwitcher />
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-white/10" />

                    <Link href="/" className="relative z-10 hover:scale-105 transition-transform duration-300 origin-center flex items-center">
                        <RemarkLogo size="md" />
                    </Link>

                    {/* Top Assistant Container - perfectly replaces the placeholder */}
                    <div className="w-11 h-11 shrink-0 relative flex items-center justify-center">
                        <AnimatePresence>
                            {showTop && (
                                <motion.div
                                    initial={{ scale: 0.2, opacity: 0 }}
                                    animate={{ scale: 0.65, opacity: 1 }}
                                    exit={{ scale: 1.1, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="absolute"
                                    style={{ originX: 0.5, originY: 0.5 }}
                                >
                                    <AssistantHexagon
                                        isOpen={chatOpen}
                                        onClick={() => window.dispatchEvent(new Event('toggle-assistant-chat'))}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
