/**
 * CrystalOrb — Internal Name: "دائرة هكسا" (Hexa Circle)
 *
 * When this component is used ALONE (without the Remark logo), it is called:
 *   → دائرة هكسا / Hexa Circle
 *
 * When this component wraps or appears WITH the RemarkLogo on top, the
 * combined element is called:
 *   → هكسا ريمارك / Hexa Remark
 */
"use client";

import React, { useRef, useState, useCallback, useId, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { PALETTE, RGB, TIMING, EASING, type OrbAnimState, getWaveColor } from "@/lib/animationConfig";

interface CrystalOrbProps {
    size?: number;
    className?: string;
    onStateChange?: (state: OrbAnimState) => void;
}
interface Ripple { id: number; x: number; y: number; }

export default function CrystalOrb({ size = 260, className = "", onStateChange }: CrystalOrbProps) {
    const half = size / 2;
    const uid = useId().replace(/:/g, "");
    const containerRef = useRef<HTMLDivElement>(null);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const rippleCounter = useRef(0);

    /* ── State machine: idle → cascading → spinning → resetting → idle ── */
    const [animState, setAnimState] = useState<OrbAnimState>("idle");
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const rotationRef = useRef(0);
    const [currentRotation, setCurrentRotation] = useState(0);
    const [mouseLocal, setMouseLocal] = useState({ x: half, y: half });

    /* ── 3D tilt ── */
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springCfg = { stiffness: 150, damping: 20, mass: 0.5 };
    const springX = useSpring(mouseX, springCfg);
    const springY = useSpring(mouseY, springCfg);
    const rotateX = useTransform(springY, [0, 1], [8, -8]);
    const rotateY = useTransform(springX, [0, 1], [-8, 8]);
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

    /* ── Hex grid ── */
    const hexPts = (cx: number, cy: number, r: number) => {
        const p: string[] = [];
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
        }
        return p.join(" ");
    };
    const cellR = size / 14, cellW = cellR * 2, cellH = cellR * Math.sqrt(3);
    const cells: { cx: number; cy: number; delay: number; depth: number; dist: number }[] = [];
    const cols = Math.ceil(size / cellW) + 2, rows = Math.ceil(size / cellH) + 2;
    for (let row = -Math.floor(rows / 2); row <= Math.floor(rows / 2); row++) {
        for (let col = -Math.floor(cols / 2); col <= Math.floor(cols / 2); col++) {
            const cx = half + col * cellW * 0.75;
            const cy = half + row * cellH + (col % 2 !== 0 ? cellH / 2 : 0);
            const dist = Math.sqrt((cx - half) ** 2 + (cy - half) ** 2);
            if (dist + cellR * 0.6 < half) {
                const nd = dist / half;
                cells.push({ cx, cy, delay: nd * 3 + Math.random() * 0.5, depth: 1 - nd * 0.25, dist: nd });
            }
        }
    }

    /* ── Helpers ── */
    const fire = useCallback((state: OrbAnimState) => { setAnimState(state); onStateChange?.(state); }, [onStateChange]);
    const later = useCallback((fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.current.push(id); }, []);
    useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

    /* ── Handlers ── */
    const handleEnter = useCallback(() => {
        if (animState !== "idle") return;
        fire("cascading");
        later(() => {
            const r = rotationRef.current + 720;
            rotationRef.current = r;
            setCurrentRotation(r);
            fire("spinning");
            later(() => {
                fire("resetting");
                later(() => fire("idle"), TIMING.resetDuration);
            }, TIMING.spinDuration);
        }, TIMING.cascadeDuration);
    }, [animState, fire, later]);

    const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        mouseX.set(nx); mouseY.set(ny);
        setGlowPos({ x: nx * 100, y: ny * 100 });
        setMouseLocal({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, [mouseX, mouseY]);

    const handleLeave = useCallback(() => {
        mouseX.set(0.5); mouseY.set(0.5);
        setGlowPos({ x: 50, y: 50 });
        setMouseLocal({ x: half, y: half });
    }, [mouseX, mouseY, half]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const id = ++rippleCounter.current;
        setRipples(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 800);
    }, []);

    /* ── Per-cell overlay style (opacity-based for smooth transitions) ── */
    const cellOverlay = (cell: typeof cells[0], idx: number) => {
        const dm = Math.sqrt((cell.cx - mouseLocal.x) ** 2 + (cell.cy - mouseLocal.y) ** 2);
        const nd = Math.min(dm / size, 1);
        const [r, g, b] = getWaveColor(nd);
        const active = animState === "cascading" || animState === "spinning";
        const delay = animState === "cascading" ? Math.round(nd * TIMING.cascadeDuration * 0.8) : 0;
        const dur = animState === "resetting" ? TIMING.cellResetTransition : TIMING.cellTransition;
        const ease = animState === "resetting" ? EASING.reset : EASING.cellColor;
        return {
            fill: `rgb(${r},${g},${b})`,
            opacity: active ? 0.5 : 0,
            style: { transition: `opacity ${dur}ms ${ease} ${delay}ms`, willChange: "opacity" as const },
        };
    };

    const cellBorder = (cell: typeof cells[0]) => {
        const dm = Math.sqrt((cell.cx - mouseLocal.x) ** 2 + (cell.cy - mouseLocal.y) ** 2);
        const nd = Math.min(dm / size, 1);
        const [r, g, b] = getWaveColor(nd);
        const active = animState === "cascading" || animState === "spinning";
        const delay = animState === "cascading" ? Math.round(nd * TIMING.cascadeDuration * 0.8) : 0;
        const dur = animState === "resetting" ? TIMING.cellResetTransition : TIMING.cellTransition;
        const ease = animState === "resetting" ? EASING.reset : EASING.cellColor;
        const bri = 1 - cell.dist * 0.4;
        return {
            stroke: active ? `rgba(${r},${g},${b},0.7)` : `rgba(${RGB.highlight},${(0.20 * bri).toFixed(2)})`,
            strokeWidth: active ? 2 : 1.4,
            style: { transition: `stroke ${dur}ms ${ease} ${delay}ms, stroke-width ${dur}ms ${ease} ${delay}ms` },
        };
    };

    /* ── Derived state ── */
    const isSpin = animState === "spinning";
    const gT = animState === "resetting"
        ? `all ${TIMING.resetDuration}ms ${EASING.reset}`
        : `all ${TIMING.glowTransition}ms ${EASING.glow}`;

    return (
        <motion.div ref={containerRef}
            className={`relative cursor-pointer select-none ${className}`}
            style={{ width: size, height: size, perspective: 800, rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseEnter={handleEnter} onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={handleClick}
            transition={{ type: "spring", ...springCfg }}>

            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full" style={{
                background: isSpin
                    ? `radial-gradient(circle, rgba(${RGB.violetAccent},0.5) 0%, rgba(${RGB.accentBlue},0.25) 30%, transparent 65%)`
                    : `radial-gradient(circle, rgba(${RGB.accentBlue},0.35) 0%, rgba(${RGB.slateBlue},0.12) 35%, transparent 65%)`,
                filter: `blur(${isSpin ? 55 : 45}px)`, transform: `scale(${isSpin ? 1.8 : 1.6})`,
                transition: gT, animation: "crystal-outer-pulse 4s ease-in-out infinite",
            }} />

            {/* Secondary halo */}
            <div className="absolute inset-0 rounded-full" style={{
                background: isSpin
                    ? `radial-gradient(circle, rgba(${RGB.violetAccent},0.3) 0%, rgba(${RGB.accentBlue},0.12) 40%, transparent 55%)`
                    : `radial-gradient(circle, rgba(${RGB.accentBlue},0.22) 0%, rgba(${RGB.slateBlue},0.06) 40%, transparent 55%)`,
                filter: "blur(25px)", transform: "scale(1.3)", transition: gT,
            }} />

            {/* Cursor-tracking glow */}
            <div className="absolute inset-0 rounded-full z-20 pointer-events-none" style={{
                background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(${RGB.highlight},0.18) 0%, rgba(${RGB.accentBlue},0.05) 30%, transparent 60%)`,
                transition: "background 0.15s ease",
            }} />

            {/* Floor reflection */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{
                bottom: -size * 0.18, width: size * 0.9, height: size * 0.35,
                background: `radial-gradient(ellipse at center, rgba(${RGB.accentBlue},0.18) 0%, rgba(${RGB.slateBlue},0.06) 40%, transparent 70%)`,
                filter: "blur(28px)",
            }} />

            {/* ── Main SVG sphere ── */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10" style={{
                filter: `drop-shadow(0 0 ${isSpin ? 45 : 30}px rgba(${isSpin ? RGB.violetAccent : RGB.accentBlue},${isSpin ? 0.55 : 0.35}))`,
                transform: `rotate(${currentRotation}deg)`,
                transition: animState === "spinning"
                    ? `transform ${TIMING.spinDuration}ms ${EASING.spin}, filter ${TIMING.glowTransition}ms ${EASING.glow}`
                    : animState === "resetting" ? `filter ${TIMING.resetDuration}ms ${EASING.reset}` : `filter ${TIMING.glowTransition}ms ${EASING.glow}`,
                willChange: "transform, filter",
            }}>
                <defs>
                    <clipPath id={`${uid}-clip`}><circle cx={half} cy={half} r={half - 2} /></clipPath>
                    <radialGradient id={`${uid}-inner`} cx="35%" cy="28%" r="70%">
                        <stop offset="0%" stopColor={`rgba(${RGB.highlight},0.30)`} />
                        <stop offset="30%" stopColor={`rgba(${RGB.accentBlue},0.12)`} />
                        <stop offset="70%" stopColor={`rgba(${RGB.slateBlue},0.04)`} />
                        <stop offset="100%" stopColor={`rgba(${RGB.deepNavy},0)`} />
                    </radialGradient>
                    <linearGradient id={`${uid}-face`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={`rgba(${RGB.highlight},0.25)`} />
                        <stop offset="40%" stopColor={`rgba(${RGB.accentBlue},0.15)`} />
                        <stop offset="100%" stopColor={`rgba(${RGB.slateBlue},0.08)`} />
                    </linearGradient>
                    <radialGradient id={`${uid}-spec`} cx="28%" cy="22%" r="60%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                        <stop offset="40%" stopColor={`rgba(${RGB.highlight},0.12)`} />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                    <radialGradient id={`${uid}-ctr`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={`rgba(${RGB.accentBlue},0.20)`} />
                        <stop offset="100%" stopColor={`rgba(${RGB.deepNavy},0)`} />
                    </radialGradient>
                </defs>

                <g clipPath={`url(#${uid}-clip)`}>
                    <circle cx={half} cy={half} r={half} fill={PALETTE.deepNavy} />
                    <circle cx={half * 0.9} cy={half * 0.85} r={half * 0.7} fill={`url(#${uid}-ctr)`} />

                    {cells.map((cell, i) => {
                        const ir = cellR * 0.88;
                        const bri = 1 - cell.dist * 0.4;
                        const ov = cellOverlay(cell, i);
                        const bd = cellBorder(cell);
                        return (
                            <g key={i}>
                                <polygon points={hexPts(cell.cx, cell.cy, cellR * 0.95)} fill="none"
                                    stroke={bd.stroke} strokeWidth={bd.strokeWidth} style={bd.style} />
                                <polygon points={hexPts(cell.cx, cell.cy, ir)} fill={`url(#${uid}-face)`}
                                    opacity={cell.depth * bri} className="crystal-cell" style={{ animationDelay: `${cell.delay}s` }} />
                                <polygon points={hexPts(cell.cx, cell.cy, ir)}
                                    fill={ov.fill} opacity={ov.opacity} style={ov.style} />
                                <polygon points={hexPts(cell.cx - 1.5, cell.cy - 1.5, ir * 0.75)}
                                    fill={`url(#${uid}-spec)`} opacity={cell.depth * bri * 0.7} />
                                <polygon points={hexPts(cell.cx + 1.2, cell.cy + 1.2, ir * 0.6)}
                                    fill={`rgba(${RGB.deepNavy},0.5)`} opacity={cell.depth * 0.5} />
                                {i % 2 === 0 && <polygon points={hexPts(cell.cx, cell.cy, ir * 0.55)}
                                    fill={`rgba(${RGB.highlight},${(0.06 * bri).toFixed(3)})`} />}
                                {i % 4 === 0 && <circle cx={cell.cx - 3} cy={cell.cy - 3} r={1.8}
                                    fill={`rgba(${RGB.highlight},0.75)`} className="crystal-sparkle"
                                    style={{ animationDelay: `${cell.delay + 1}s` }} />}
                            </g>
                        );
                    })}

                    <circle cx={half} cy={half} r={half} fill={`url(#${uid}-inner)`} />
                    <ellipse cx={half * 0.82} cy={half * 0.32} rx={half * 0.4} ry={half * 0.1}
                        fill={`rgba(${RGB.highlight},0.12)`} style={{ filter: "blur(5px)" }} />
                    <ellipse cx={half} cy={half * 1.75} rx={half * 0.3} ry={half * 0.06}
                        fill={`rgba(${RGB.accentBlue},0.06)`} style={{ filter: "blur(3px)" }} />
                    <circle cx={half} cy={half} r={half - 2} fill="none"
                        stroke={isSpin ? `rgba(${RGB.violetAccent},0.45)` : `rgba(${RGB.accentBlue},0.22)`}
                        strokeWidth={isSpin ? 3 : 2}
                        style={{ transition: `stroke ${TIMING.glowTransition}ms ${EASING.glow}, stroke-width ${TIMING.glowTransition}ms ${EASING.glow}` }} />
                    {isSpin && <circle cx={half} cy={half} r={half - 4} fill="none"
                        stroke={`rgba(${RGB.violetAccent},0.45)`} strokeWidth={2.5}
                        strokeDasharray={`${half * 0.8} ${half * 4}`} strokeLinecap="round"
                        style={{ filter: `blur(2px) drop-shadow(0 0 6px rgba(${RGB.violetAccent},0.4))` }} />}
                    <circle cx={half} cy={half} r={half - 6} fill="none"
                        stroke={`rgba(${RGB.accentBlue},0.08)`} strokeWidth={1} />
                </g>
            </svg>

            {/* Spin glow ring */}
            {isSpin && <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                zIndex: 15, border: `2px solid rgba(${RGB.violetAccent},0.3)`,
                boxShadow: `0 0 20px rgba(${RGB.violetAccent},0.25), inset 0 0 20px rgba(${RGB.accentBlue},0.15)`,
                animation: "crystal-spin-glow 0.6s ease-in-out infinite alternate",
            }} />}

            {/* Ripples */}
            <AnimatePresence>
                {ripples.map(rp => (
                    <motion.div key={rp.id} className="absolute rounded-full pointer-events-none z-30"
                        initial={{ width: 20, height: 20, x: rp.x - 10, y: rp.y - 10, opacity: 0.6 }}
                        animate={{ width: size * 1.2, height: size * 1.2, x: rp.x - size * 0.6, y: rp.y - size * 0.6, opacity: 0 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            background: `radial-gradient(circle, rgba(${RGB.accentBlue},0.25) 0%, rgba(${RGB.slateBlue},0.10) 40%, transparent 70%)`,
                            border: `1px solid rgba(${RGB.accentBlue},0.18)`,
                        }} />
                ))}
            </AnimatePresence>

            {/* Sparkles */}
            {[...Array(12)].map((_, i) => {
                const a = (Math.PI * 2 * i) / 12;
                const d = half * 0.4 + Math.random() * half * 0.4;
                const s = 2 + Math.random() * 3;
                return <span key={i} className="absolute rounded-full crystal-sparkle pointer-events-none"
                    style={{
                        left: half + Math.cos(a) * d, top: half + Math.sin(a) * d,
                        width: s, height: s, background: `rgba(${RGB.highlight},0.85)`,
                        boxShadow: `0 0 8px 3px rgba(${RGB.accentBlue},0.5), 0 0 18px 6px rgba(${RGB.slateBlue},0.2)`,
                        animationDelay: `${i * 0.5}s`,
                    }} />;
            })}
        </motion.div>
    );
}
