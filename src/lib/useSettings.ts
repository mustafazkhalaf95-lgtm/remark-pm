'use client';
/* Remark — Shared UI Settings Hook — Persisted theme, language, and per-tab user */
import { useState, useEffect, useCallback } from 'react';
import { getActiveUserId, setActiveUser, getMember, TEAM, type TeamMember } from './teamStore';

const THEME_KEY = 'remark_pm_theme';
const LANG_KEY = 'remark_pm_lang';

export type Theme = 'light' | 'dark';
export type Lang = 'ar' | 'en';

/** Read persisted theme or default to dark */
function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem(THEME_KEY) as Theme) || 'dark';
}

/** Read persisted language or default to ar */
function getStoredLang(): Lang {
    if (typeof window === 'undefined') return 'ar';
    return (localStorage.getItem(LANG_KEY) as Lang) || 'ar';
}

/** Get user ID from URL ?user= param, or fall back to localStorage active user */
function getUserFromURL(): string {
    if (typeof window === 'undefined') return getActiveUserId();
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('user');
    if (urlUser && getMember(urlUser)) return urlUser;
    return getActiveUserId();
}

/** Apply theme class to <html> */
function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Shared hook for theme, language, and user — persisted across all pages.
 * Usage: const { theme, lang, user, toggleTheme, toggleLang, switchUser } = useSettings();
 */
export function useSettings() {
    const [theme, _setTheme] = useState<Theme>(getStoredTheme);
    const [lang, _setLang] = useState<Lang>(getStoredLang);
    const [userId, _setUserId] = useState<string>(getUserFromURL);

    // Apply theme on mount and changes
    useEffect(() => { applyTheme(theme); }, [theme]);

    // Listen for storage changes from other tabs
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === THEME_KEY && e.newValue) { const t = e.newValue as Theme; _setTheme(t); applyTheme(t); }
            if (e.key === LANG_KEY && e.newValue) _setLang(e.newValue as Lang);
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const toggleTheme = useCallback(() => {
        _setTheme(prev => {
            const next: Theme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem(THEME_KEY, next);
            applyTheme(next);
            return next;
        });
    }, []);

    const toggleLang = useCallback(() => {
        _setLang(prev => {
            const next: Lang = prev === 'ar' ? 'en' : 'ar';
            localStorage.setItem(LANG_KEY, next);
            return next;
        });
    }, []);

    const switchUser = useCallback((id: string) => {
        setActiveUser(id);
        _setUserId(id);
        // Update URL param without reload
        const url = new URL(window.location.href);
        url.searchParams.set('user', id);
        window.history.replaceState({}, '', url.toString());
    }, []);

    const user: TeamMember = getMember(userId) || TEAM[0];

    return { theme, lang, user, userId, toggleTheme, toggleLang, switchUser };
}
