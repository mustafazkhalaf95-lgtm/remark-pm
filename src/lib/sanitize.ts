/* ══════════════════════════════════════════════════════════
   Remark PM — Input Sanitization
   Sanitize all text inputs to prevent XSS and injection.
   ══════════════════════════════════════════════════════════ */

/**
 * Sanitize plain text — remove HTML tags and scripts
 */
export function sanitizeText(input: string, maxLength: number = 5000): string {
    return input
        .trim()
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .substring(0, maxLength);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, '');
}

/**
 * Sanitize a URL
 */
export function sanitizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return '';
    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        return parsed.toString();
    } catch {
        return '';
    }
}

/**
 * Sanitize JSON string (validate it's valid JSON)
 */
export function sanitizeJson(input: string, fallback: string = '[]'): string {
    try {
        JSON.parse(input);
        return input;
    } catch {
        return fallback;
    }
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (c) => map[c] || c);
}
