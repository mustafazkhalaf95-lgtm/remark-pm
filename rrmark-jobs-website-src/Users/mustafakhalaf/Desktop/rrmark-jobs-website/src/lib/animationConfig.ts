/* ─── Premium Animation Configuration ───
   All visual constants are centralized here for easy tuning.
   Adjust colors, durations, and easing curves to your liking.
*/

/* ── Color Palette (premium / serious) ── */
export const PALETTE = {
    deepNavy: '#0B1220',
    slateBlue: '#1F2A44',
    accentBlue: '#2F6BFF',
    violetAccent: '#7C3AED',
    highlight: '#E6EDF7',
} as const;

/** RGB tuples for inline rgba() usage */
export const RGB = {
    deepNavy: '11,18,32',
    slateBlue: '31,42,68',
    accentBlue: '47,107,255',
    violetAccent: '124,58,237',
    highlight: '230,237,247',
} as const;

/** Cascade wave gradient stops — cells interpolate through these */
export const WAVE_COLORS: [number, number, number][] = [
    [47, 107, 255],   // accent blue
    [60, 80, 220],    // mid blue
    [124, 58, 237],   // violet accent
    [80, 60, 200],    // deep violet-blue
    [31, 42, 68],     // slate blue
];

/* ── Timing (ms) ── */
export const TIMING = {
    cascadeDuration: 1800,
    spinDuration: 2400,
    resetDuration: 1000,
    cellTransition: 400,
    cellResetTransition: 600,
    glowTransition: 600,
} as const;

/* ── Easing curves ── */
export const EASING = {
    spin: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reset: 'cubic-bezier(0.16, 1, 0.3, 1)',      // easeOutExpo
    cellColor: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    glow: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/* ── Animation state type ── */
export type OrbAnimState = 'idle' | 'cascading' | 'spinning' | 'resetting';

/* ── Helper: interpolate between two RGB colors ── */
export function lerpColor(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    t: number,
): [number, number, number] {
    return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
    ];
}

/** Smooth gradient color from WAVE_COLORS based on 0–1 position */
export function getWaveColor(normalizedPos: number): [number, number, number] {
    const p = Math.max(0, Math.min(1, normalizedPos));
    const idx = p * (WAVE_COLORS.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, WAVE_COLORS.length - 1);
    return lerpColor(WAVE_COLORS[lo], WAVE_COLORS[hi], idx - lo);
}
