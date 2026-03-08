"use client";

import React, { useState, useRef, useCallback } from "react";

export const GLASSCARD_CFG = {
    PATTERN_OPACITY: 0.02,
    HOVER_OPACITY_DELTA: 0.015,
    PATTERN_SCALE: 16,
    PATTERN_STROKE_COLOR: "rgba(230, 237, 247, 0.6)",
};

// High-performance data-URI SVG hex pattern
const getHexPatternSvg = () => {
    const color = encodeURIComponent(GLASSCARD_CFG.PATTERN_STROKE_COLOR);
    return `data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${color}' fill-rule='evenodd'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.65V49h-2z' /%3E%3C/g%3E%3C/svg%3E`;
};

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
    style?: React.CSSProperties;
}

export default function GlassCard({
    children,
    className = "",
    hoverable = false,
    style,
}: GlassCardProps) {
    const [shimmer, setShimmer] = useState<{ x: number; y: number } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!hoverable || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setShimmer({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, [hoverable]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!hoverable || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setShimmer({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, [hoverable]);

    const handleMouseLeave = useCallback(() => {
        setShimmer(null);
    }, []);

    return (
        <div
            ref={cardRef}
            style={style}
            onMouseEnter={hoverable ? handleMouseEnter : undefined}
            onMouseMove={hoverable ? handleMouseMove : undefined}
            onMouseLeave={hoverable ? handleMouseLeave : undefined}
            className={`
                glass rounded-3xl overflow-hidden relative
                ${hoverable ? "glass-hover cursor-pointer group" : ""}
                ${className}
            `}
        >
            {/* Hexagon Pattern Overlay (Safe sibling, does not wrap children) */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out z-[0]"
                style={{
                    backgroundImage: `url("${getHexPatternSvg()}")`,
                    backgroundSize: `${GLASSCARD_CFG.PATTERN_SCALE}px`,
                    opacity: (hoverable && shimmer) ? GLASSCARD_CFG.PATTERN_OPACITY + GLASSCARD_CFG.HOVER_OPACITY_DELTA : GLASSCARD_CFG.PATTERN_OPACITY,
                    mixBlendMode: "plus-lighter",
                }}
            />

            {/* Spotlight / light follow effect */}
            {hoverable && shimmer && (
                <span
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(320px circle at ${shimmer.x}px ${shimmer.y}px, rgba(139,92,246,0.13) 0%, transparent 70%)`,
                    }}
                />
            )}

            {/* Top shimmer sweep on hover */}
            {hoverable && (
                <span className="
                    pointer-events-none absolute top-0 left-0 right-0 h-px
                    bg-gradient-to-r from-transparent via-violet-400/60 to-transparent
                    translate-x-[-100%] group-hover:translate-x-[100%]
                    transition-transform duration-700 ease-in-out
                " />
            )}

            {children}
        </div>
    );
}
