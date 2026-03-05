"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface CrystalBeeProps {
    icon: string;
    title: string;
    subtitle: string;
    orbitDuration?: number;
    orbitRadius?: number;
    orbitDelay?: number;
    startAngle?: number; // 0 to 360
    colorClass?: string; // e.g. "bg-violet-500/20"
}

export default function CrystalBee({
    icon,
    title,
    subtitle,
    orbitDuration = 20,
    orbitRadius = 180,
    orbitDelay = 0,
    startAngle = 0,
    colorClass = "bg-violet-500/20",
}: CrystalBeeProps) {
    const { dir } = useLanguage();
    const [isHovered, setIsHovered] = useState(false);

    // Initial position based on start angle
    const initialX = Math.cos((startAngle * Math.PI) / 180) * orbitRadius;
    const initialY = Math.sin((startAngle * Math.PI) / 180) * orbitRadius;

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 z-30"
            initial={{ opacity: 0, x: initialX, y: initialY }}
            animate={
                isHovered
                    ? { opacity: 1, scale: 1.1, zIndex: 50 } // Stop orbiting when hovered, pull forward
                    : {
                        opacity: 1,
                        scale: 1,
                        rotate: 360,
                        transition: {
                            rotate: {
                                repeat: Infinity,
                                duration: orbitDuration,
                                ease: "linear",
                                delay: orbitDelay,
                            },
                        },
                    }
            }
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            // Touch support
            onTouchStart={() => setIsHovered(true)}
            style={{
                // We offset by negative half-width/height to center the rotation point exactly on the container
                marginLeft: "-1rem",
                marginTop: "-1rem",
            }}
        >
            {/* The actual orbiting element needs to counter-rotate or just be positioned along the radius */}
            <motion.div
                className="relative"
                animate={isHovered ? { x: 0, y: 0 } : { x: orbitRadius, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <AnimatePresence mode="wait">
                    {!isHovered ? (
                        /* Default: Crystal Bee Mode */
                        <motion.div
                            key="bee"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                            className="cursor-pointer group relative"
                        >
                            {/* Glowing Crystal Body (Hexagon-ish or Orb) */}
                            <div className={`w-8 h-8 rounded-lg rotate-45 flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4)] backdrop-blur-md ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
                                <div className="-rotate-45 text-[10px] drop-shadow-md">{icon}</div>
                            </div>

                            {/* Rapid Wing Shimmer / Pulse */}
                            <motion.div
                                animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.4, 1] }}
                                transition={{ repeat: Infinity, duration: 0.15, ease: "easeInOut" }}
                                className={`absolute -inset-2 rounded-full blur-sm ${colorClass} -z-10`}
                            />

                            {/* Inner Light Core */}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="absolute inset-2 bg-white rounded-full blur-[2px]"
                            />
                        </motion.div>
                    ) : (
                        /* Hover: Opened Info Card Mode */
                        <motion.div
                            key="card"
                            initial={{ scale: 0.5, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.5, opacity: 0, y: 10, transition: { duration: 0.2 } }}
                            className="absolute top-0 w-48 -translate-x-1/2 -translate-y-1/2"
                            style={dir === 'rtl' ? { right: 0, transform: 'translate(50%, -50%)' } : { left: 0, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="glass px-4 py-3 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-3 overflow-hidden group">
                                {/* Subtle sweep effect on reveal */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />

                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm shadow-inner border border-white/10 ${colorClass}`}>
                                    {icon}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] text-white/60 font-medium mb-0.5 truncate uppercase tracking-wider">{subtitle}</div>
                                    <div className="text-sm font-bold text-white shadow-sm truncate">{title}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
