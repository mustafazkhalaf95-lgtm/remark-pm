"use client";

import React, { useState, useCallback } from "react";

interface Ripple {
    id: number;
    x: number;
    y: number;
}

interface GlassButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    variant?: "primary" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    fullWidth?: boolean;
}

export default function GlassButton({
    children,
    onClick,
    type = "button",
    disabled = false,
    loading = false,
    variant = "primary",
    size = "md",
    className = "",
    fullWidth = false,
}: GlassButtonProps) {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || loading) return;

        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const id = Date.now();
        setRipples((prev) => [
            ...prev,
            { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
        ]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);

        onClick?.();
    }, [disabled, loading, onClick]);

    const base =
        "relative inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 active:scale-[0.97] overflow-hidden";

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
    };

    const variants = {
        primary:
            "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-glow hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] hover:-translate-y-0.5",
        ghost:
            "glass text-white/80 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.25] hover:-translate-y-0.5",
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={disabled || loading}
            className={`
                ${base}
                ${sizes[size]}
                ${variants[variant]}
                ${fullWidth ? "w-full" : ""}
                ${disabled || loading ? "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none" : ""}
                ${className}
            `}
        >
            {/* Ripple effects */}
            {ripples.map((r) => (
                <span
                    key={r.id}
                    className="pointer-events-none absolute rounded-full animate-ripple"
                    style={{
                        left: r.x,
                        top: r.y,
                        width: 0,
                        height: 0,
                        transform: "translate(-50%, -50%)",
                        background:
                            variant === "primary"
                                ? "rgba(255,255,255,0.35)"
                                : "rgba(139,92,246,0.35)",
                    }}
                />
            ))}

            {loading && (
                <svg
                    className="animate-spin h-4 w-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}
