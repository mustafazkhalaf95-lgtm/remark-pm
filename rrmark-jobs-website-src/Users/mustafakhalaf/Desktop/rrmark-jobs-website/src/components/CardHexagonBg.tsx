"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

// No colors config needed; using pure transparent engraving effects

interface CardHexagonBgProps {
    isActive?: boolean;
}

function hexPoints(cx: number, cy: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
}

function buildHoneycombCells(viewWidth: number, viewHeight: number, cellRadius: number) {
    const cells: { cx: number; cy: number }[] = [];
    const w = cellRadius * Math.sqrt(3);
    const h = cellRadius * 1.5;

    const cols = Math.ceil(viewWidth / w) + 2;
    const rows = Math.ceil(viewHeight / h) + 2;

    for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
            const offsetX = (row % 2 !== 0) ? w / 2 : 0;
            const cx = col * w + offsetX;
            const cy = row * h;
            cells.push({ cx, cy });
        }
    }
    return cells;
}

export default function CardHexagonBg({ isActive = true }: CardHexagonBgProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

    useEffect(() => {
        if (!isActive) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // Track mouse relative to the card's top-left
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isActive]);

    const width = 800;
    const height = 800;
    const cellR = 16; // Slightly larger, organized cells

    // Memoize the SVG paths so we don't recalculate them on every mouse move
    const cells = useMemo(() => buildHoneycombCells(width, height, cellR), [width, height, cellR]);

    const svgTransform = "rotate(0deg) scale(1)";
    const svgStyle: React.CSSProperties = {
        position: "absolute",
        top: "-10%", // Slight offset to ensure full coverage
        left: "-10%",
        transform: svgTransform,
    };

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none z-0"
        >
            {/* Base SVG: Very subtle glass etching */}
            <svg
                width="120%"
                height="120%"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid slice"
                style={{
                    ...svgStyle,
                    // Glass engraving effect: very subtle opacity + overlay blend mode
                    opacity: isActive ? 0.35 : 0.08,
                    mixBlendMode: "overlay",
                    transition: "opacity 0.6s ease-in-out"
                }}
            >
                {/* Draw Hexagon outlines as transparent glass etchings */}
                <g
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1"
                    fill="transparent"
                    style={{ transition: "all 0.6s ease-in-out" }}
                >
                    {cells.map((cell, i) => (
                        <polygon key={`outline-${i}`} points={hexPoints(cell.cx, cell.cy, cellR)} />
                    ))}
                </g>
            </svg>

            {/* Hover Highlight SVG: Soft white edges masked by mouse position */}
            {isActive && (
                <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                        maskImage: `radial-gradient(70px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                        WebkitMaskImage: `radial-gradient(70px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                        opacity: 1
                    }}
                >
                    <svg
                        width="120%"
                        height="120%"
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="xMidYMid slice"
                        style={{ ...svgStyle }}
                    >
                        <g stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" fill="transparent">
                            {cells.map((cell, i) => (
                                <polygon key={`highlight-${i}`} points={hexPoints(cell.cx, cell.cy, cellR)} />
                            ))}
                        </g>
                    </svg>
                </div>
            )}
        </motion.div>
    );
}
