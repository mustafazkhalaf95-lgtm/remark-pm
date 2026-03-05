"use client";

import React, { useEffect, useState, useId } from "react";

/* ═══════════════════════════════════════════════════════
   Configurable Constants — edit these to tune look & feel
   ═══════════════════════════════════════════════════════ */

export const ASSISTANT_CFG = {
    /** Outer diameter of the circle button (px) */
    size: 52,

    /* ── Rotation animation (on mount) ── */
    /** Duration of the initial spin in seconds */
    ROTATION_DURATION: 1.5,
    /** CSS easing for the spin */
    ROTATION_EASING: "cubic-bezier(0.33, 1, 0.68, 1)", // easeOutCubic

    /* ── Greeting (shown after rotation completes) ── */
    /** Extra delay (ms) after rotation before showing greeting */
    GREETING_DELAY: 200,
    /** Greeting text — change freely */
    GREETING_TEXT: "مرحباً ، مساعد ريمارك هنا لمساعدتك",

    /* ── Hover ── */
    /** Scale on hover */
    hoverScale: 1.05,
    /** Hover glow intensity — box-shadow spread (px) */
    GLOW_INTENSITY: 14,
    /** Hover transition (ms) */
    hoverDuration: 300,

    /* ── Honeycomb pattern ── */
    /** Opacity of the hex cell pattern layer (0–1) */
    PATTERN_OPACITY: 1,

    /* ── Pulse glow ── */
    pulseDuration: 3200,

    /* ── Colors (from premium palette) ── */
    colors: {
        bg: "#0B1220",
        cellFill: "rgba(39,52,85,0.75)",
        cellStroke: "rgba(67,127,255,0.6)",
        glowInner: "rgba(47,107,255,0.45)",
        glowOuter: "rgba(124,58,237,0.18)",
        specular: "rgba(230,237,247,0.15)",
        ring: "rgba(47,107,255,0.28)",
        iconColor: "rgba(230,237,247,0.88)",
    },
} as const;

/* ═══════════════════════════════════════════════════════
   SVG Honeycomb Generator — builds a larger hex grid
   ═══════════════════════════════════════════════════════ */

/** Generate flat-top hexagon points string for SVG polygon */
function hexPoints(cx: number, cy: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
}

/** Build a dense honeycomb grid that fills the viewBox */
function buildHoneycombCells(viewSize: number, cellRadius: number) {
    const cells: { cx: number; cy: number }[] = [];
    const w = cellRadius * Math.sqrt(3); // horizontal spacing
    const h = cellRadius * 1.5;          // vertical spacing
    const center = viewSize / 2;

    // Generate enough rows/cols to overfill the circle
    const cols = Math.ceil(viewSize / w) + 4;
    const rows = Math.ceil(viewSize / h) + 4;

    const startCol = -Math.floor(cols / 2);
    const startRow = -Math.floor(rows / 2);

    for (let row = startRow; row <= startRow + rows; row++) {
        for (let col = startCol; col <= startCol + cols; col++) {
            const offsetX = (row % 2 !== 0) ? w / 2 : 0;
            const cx = center + col * w + offsetX;
            const cy = center + row * h;

            // Only include cells whose center is within ~55% of viewSize from center
            // (ensures full coverage inside the circle)
            const dist = Math.sqrt((cx - center) ** 2 + (cy - center) ** 2);
            if (dist < viewSize * 0.58) {
                cells.push({ cx, cy });
            }
        }
    }
    return cells;
}

/* ═══════════════════════════════════════════════════════
   Component Props
   ═══════════════════════════════════════════════════════ */

interface AssistantHexagonProps {
    isOpen: boolean;
    onClick: () => void;
    onRotationComplete?: () => void;
    className?: string;
    spinKey?: number;
}

/**
 * AssistantHexagon (Circle Edition)
 * ─────────────────────────────────
 * Circular button with honeycomb SVG pattern inside.
 *
 * Performance:
 * - CSS animations only → 60fps guaranteed
 * - clip-path: circle() is GPU-composited
 * - transform: scale + rotate on compositor thread
 * - opacity changes on compositor thread
 * - Zero JS animation loops
 */
export default function AssistantHexagon({
    isOpen,
    onClick,
    onRotationComplete,
    className = "",
    spinKey = 0,
}: AssistantHexagonProps) {
    const uid = useId().replace(/:/g, "");
    const s = ASSISTANT_CFG.size;
    const viewBox = 120; // internal SVG coordinate system
    const cellR = 9.5;   // hex cell radius in SVG units
    const [isSpinning, setIsSpinning] = useState(true);

    // Trigger onRotationComplete callback after rotation ends
    useEffect(() => {
        setIsSpinning(true);
        const timer = setTimeout(() => {
            setIsSpinning(false);
            onRotationComplete?.();
        }, ASSISTANT_CFG.ROTATION_DURATION * 1000 + 50);
        return () => clearTimeout(timer);
    }, [spinKey, onRotationComplete]);

    const cells = buildHoneycombCells(viewBox, cellR);

    return (
        <>
            {/* Scoped keyframes */}
            <style>{`
                @keyframes asst-spin-${uid} {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes asst-pulse-${uid} {
                    0%, 100% {
                        opacity: 0.22;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.48;
                        transform: scale(1.08);
                    }
                }
                .asst-circle-${uid} {
                    width: ${s}px;
                    height: ${s}px;
                    border-radius: 9999px;
                    cursor: pointer;
                    position: relative;
                    transition: transform ${ASSISTANT_CFG.hoverDuration}ms cubic-bezier(0.16, 1, 0.3, 1),
                                filter ${ASSISTANT_CFG.hoverDuration}ms cubic-bezier(0.16, 1, 0.3, 1);
                    will-change: transform, filter;
                }
                .asst-circle-${uid}:hover {
                    transform: scale(${ASSISTANT_CFG.hoverScale});
                    filter: brightness(1.12) drop-shadow(0 0 ${ASSISTANT_CFG.GLOW_INTENSITY}px ${ASSISTANT_CFG.colors.glowInner});
                }
                .asst-circle-${uid}:active {
                    transform: scale(0.97);
                }
                .asst-glow-${uid} {
                    position: absolute;
                    inset: -8px;
                    border-radius: 9999px;
                    background: radial-gradient(circle,
                        ${ASSISTANT_CFG.colors.glowInner} 0%,
                        ${ASSISTANT_CFG.colors.glowOuter} 50%,
                        transparent 72%
                    );
                    animation: asst-pulse-${uid} ${ASSISTANT_CFG.pulseDuration}ms ease-in-out infinite;
                    pointer-events: none;
                    will-change: opacity, transform;
                }
                .asst-pattern-${uid} {
                    animation: asst-spin-${uid} ${ASSISTANT_CFG.ROTATION_DURATION}s ${ASSISTANT_CFG.ROTATION_EASING} 1 forwards;
                    will-change: transform;
                    transform-origin: center center;
                }
            `}</style>

            <button
                onClick={onClick}
                className={`asst-circle-${uid} outline-none border-none p-0 ${className}`}
                aria-label="Chat assistant"
                type="button"
            >
                {/* Pulse glow halo — behind the circle */}
                <div className={`asst-glow-${uid}`} style={{ zIndex: -1 }} />

                {/* Circle body */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        borderRadius: "9999px",
                        background: ASSISTANT_CFG.colors.bg,
                        border: `1.5px solid ${ASSISTANT_CFG.colors.ring}`,
                    }}
                >
                    {/* Honeycomb pattern layer — rotates on mount, clipped inside circle */}
                    <svg
                        key={`pattern-${spinKey}`}
                        width={s}
                        height={s}
                        viewBox={`0 0 ${viewBox} ${viewBox}`}
                        className={isSpinning ? `asst-pattern-${uid}` : ""}
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: ASSISTANT_CFG.PATTERN_OPACITY,
                            zIndex: 1,
                        }}
                    >
                        <defs>
                            {/* Circular clip for the pattern */}
                            <clipPath id={`cell-clip-${uid}`}>
                                <circle cx={viewBox / 2} cy={viewBox / 2} r={viewBox / 2} />
                            </clipPath>

                            {/* Honeycomb Mask: Only the cells are perfectly opaque, revealing the flying 'bees' */}
                            <mask id={`honeycomb-mask-${uid}`}>
                                {cells.map((cell, i) => (
                                    <polygon
                                        key={i}
                                        points={hexPoints(cell.cx, cell.cy, cellR * 0.88)}
                                        fill="white"
                                    />
                                ))}
                            </mask>

                            {/* Inner radial glow */}
                            <radialGradient id={`inner-glow-${uid}`} cx="50%" cy="42%" r="58%">
                                <stop offset="0%" stopColor={ASSISTANT_CFG.colors.glowInner} stopOpacity="0.35" />
                                <stop offset="55%" stopColor={ASSISTANT_CFG.colors.glowOuter} stopOpacity="0.12" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>

                            {/* Moving wandering bees lights */}
                            <radialGradient id={`bee-1-${uid}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(100,200,255,1)" stopOpacity="0.95" />
                                <stop offset="40%" stopColor="rgba(80,150,255,1)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id={`bee-2-${uid}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(160,100,255,1)" stopOpacity="0.85" />
                                <stop offset="40%" stopColor="rgba(140,80,255,1)" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>

                            {/* Specular highlight */}
                            <radialGradient id={`spec-${uid}`} cx="35%" cy="26%" r="45%">
                                <stop offset="0%" stopColor={ASSISTANT_CFG.colors.specular} />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                        </defs>

                        <g clipPath={`url(#cell-clip-${uid})`}>
                            {/* Background glow */}
                            <rect width={viewBox} height={viewBox} fill={`url(#inner-glow-${uid})`} />

                            {/* Base Honeycomb cells (dimmer background) */}
                            {cells.map((cell, i) => (
                                <polygon
                                    key={i}
                                    points={hexPoints(cell.cx, cell.cy, cellR * 0.88)}
                                    fill={ASSISTANT_CFG.colors.cellFill}
                                    stroke={ASSISTANT_CFG.colors.cellStroke}
                                    strokeWidth={0.7}
                                    opacity={0.3 + (i % 5) * 0.05}
                                />
                            ))}

                            {/* Wandering bee lights group */}
                            <g mask={`url(#honeycomb-mask-${uid})`} style={{ mixBlendMode: 'screen' }}>
                                <circle r={viewBox * 0.35} fill={`url(#bee-1-${uid})`}>
                                    <animate attributeName="cx" values="10; 110; 60; 10" dur="7s" repeatCount="indefinite" />
                                    <animate attributeName="cy" values="70; 20; 100; 70" dur="11s" repeatCount="indefinite" />
                                </circle>
                                <circle r={viewBox * 0.28} fill={`url(#bee-2-${uid})`}>
                                    <animate attributeName="cx" values="100; 20; 80; 100" dur="9.5s" repeatCount="indefinite" />
                                    <animate attributeName="cy" values="30; 90; 40; 30" dur="6s" repeatCount="indefinite" />
                                </circle>
                            </g>
                        </g>

                        {/* Specular highlight on top */}
                        <ellipse
                            cx={viewBox * 0.38}
                            cy={viewBox * 0.28}
                            rx={viewBox * 0.22}
                            ry={viewBox * 0.1}
                            fill={`url(#spec-${uid})`}
                            opacity={0.55}
                        />
                    </svg>

                    {/* Close icon — always on top */}
                    <svg
                        width={s}
                        height={s}
                        viewBox={`0 0 ${viewBox} ${viewBox}`}
                        className="absolute inset-0 transition-opacity duration-300"
                        style={{ zIndex: 2, opacity: isOpen ? 1 : 0, pointerEvents: "none" }}
                    >
                        <g
                            stroke={ASSISTANT_CFG.colors.iconColor}
                            strokeWidth={3}
                            strokeLinecap="round"
                        >
                            <line
                                x1={viewBox / 2 - 14}
                                y1={viewBox / 2 - 14}
                                x2={viewBox / 2 + 14}
                                y2={viewBox / 2 + 14}
                            />
                            <line
                                x1={viewBox / 2 + 14}
                                y1={viewBox / 2 - 14}
                                x2={viewBox / 2 - 14}
                                y2={viewBox / 2 + 14}
                            />
                        </g>
                    </svg>
                </div>

                {/* Subtle border ring */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        borderRadius: "9999px",
                        border: `1px solid ${ASSISTANT_CFG.colors.ring}`,
                        zIndex: 3,
                    }}
                />
            </button>
        </>
    );
}
