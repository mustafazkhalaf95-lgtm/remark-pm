/* ══════════════════════════════════════════════════════════
   Remark PM — Rate Limiting
   Simple in-memory rate limiter for API routes.
   ══════════════════════════════════════════════════════════ */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 60_000);

/**
 * Check rate limit for a user/key. Returns true if allowed.
 */
export function rateLimit(
    key: string,
    limit: number = 100,
    windowSeconds: number = 60
): boolean {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const storeKey = `${key}_${Math.floor(now / windowMs)}`;

    const entry = store.get(storeKey);
    if (!entry) {
        store.set(storeKey, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= limit) return false;
    entry.count++;
    return true;
}

/**
 * Get remaining requests for a key
 */
export function getRemainingRequests(
    key: string,
    limit: number = 100,
    windowSeconds: number = 60
): number {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const storeKey = `${key}_${Math.floor(now / windowMs)}`;

    const entry = store.get(storeKey);
    if (!entry) return limit;
    return Math.max(0, limit - entry.count);
}
