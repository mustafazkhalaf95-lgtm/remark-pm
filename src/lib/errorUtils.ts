'use client';

/**
 * Global error handling utilities for Remark PM
 */

// ── Toast notification system ──
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

let _toasts: Toast[] = [];
let _listeners = new Set<() => void>();

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
    const toast: Toast = { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, message, type, duration };
    _toasts = [..._toasts, toast];
    _listeners.forEach(fn => fn());
    setTimeout(() => { dismissToast(toast.id); }, duration);
    return toast.id;
}

export function dismissToast(id: string) {
    _toasts = _toasts.filter(t => t.id !== id);
    _listeners.forEach(fn => fn());
}

export function getToasts() { return _toasts; }
export function subscribeToasts(fn: () => void) { _listeners.add(fn); return () => { _listeners.delete(fn); }; }

// ── Safe async wrapper ──
export async function safeAsync<T>(
    fn: () => Promise<T>,
    options: { errorMessage?: string; showToast?: boolean; fallback?: T } = {}
): Promise<T | undefined> {
    try {
        return await fn();
    } catch (error: any) {
        const msg = options.errorMessage || error?.message || 'حدث خطأ غير متوقع';
        console.error('[safeAsync]', msg, error);
        if (options.showToast !== false) {
            showToast(msg, 'error');
        }
        return options.fallback;
    }
}

// ── Safe API fetch ──
export async function safeFetch<T = any>(
    url: string,
    options?: RequestInit & { errorMessage?: string }
): Promise<{ data?: T; error?: string; ok: boolean }> {
    try {
        const res = await fetch(url, options);
        const data = await res.json();
        if (!res.ok) {
            const errorMsg = data?.error || options?.errorMessage || `خطأ ${res.status}`;
            showToast(errorMsg, 'error');
            return { error: errorMsg, ok: false };
        }
        return { data, ok: true };
    } catch (error: any) {
        const msg = options?.errorMessage || error?.message || 'فشل الاتصال بالخادم';
        showToast(msg, 'error');
        return { error: msg, ok: false };
    }
}

// ── Form validation ──
export interface ValidationRule {
    field: string;
    label: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
}

export function validateForm(data: Record<string, any>, rules: ValidationRule[]): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    for (const rule of rules) {
        const value = data[rule.field];
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            errors[rule.field] = `${rule.label} مطلوب`;
            continue;
        }
        if (value && rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
            errors[rule.field] = `${rule.label} يجب أن يكون ${rule.minLength} أحرف على الأقل`;
        }
        if (value && rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
            errors[rule.field] = `${rule.label} يجب ألا يتجاوز ${rule.maxLength} حرف`;
        }
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors[rule.field] = `${rule.label} غير صالح`;
        }
        if (rule.custom) {
            const err = rule.custom(value);
            if (err) errors[rule.field] = err;
        }
    }
    return { valid: Object.keys(errors).length === 0, errors };
}
