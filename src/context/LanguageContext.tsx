"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

type Lang = "ar" | "en";
type Dir = "rtl" | "ltr";

const translations = {
    dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
    marketing: { ar: "التسويق", en: "Marketing" },
    creative: { ar: "الإبداع", en: "Creative" },
    production: { ar: "الإنتاج", en: "Production" },
    publishing: { ar: "النشر", en: "Publishing" },
    chat: { ar: "المحادثات", en: "Chat" },
    briefs: { ar: "البريفات", en: "Briefs" },
    automations: { ar: "الأتمتة", en: "Automations" },
    settings: { ar: "الإعدادات", en: "Settings" },
    search: { ar: "بحث", en: "Search" },
    notifications: { ar: "الإشعارات", en: "Notifications" },
    navAllRoles: { ar: "جميع الأدوار", en: "All Roles" },
    navOpenApp: { ar: "فتح التطبيق", en: "Open App" },
} as const;

type TranslationKeys = keyof typeof translations;
type TranslationsObj = { [K in TranslationKeys]: string };

interface LanguageContextType {
    lang: Lang;
    dir: Dir;
    toggle: () => void;
    t: TranslationsObj;
}

const defaultT: TranslationsObj = Object.fromEntries(
    Object.entries(translations).map(([k, v]) => [k, v.ar])
) as TranslationsObj;

const LanguageContext = createContext<LanguageContextType>({
    lang: "ar",
    dir: "rtl",
    toggle: () => { },
    t: defaultT,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>("ar");

    const toggle = useCallback(() => {
        setLang((prev) => (prev === "ar" ? "en" : "ar"));
    }, []);

    const dir: Dir = lang === "ar" ? "rtl" : "ltr";

    const t = useMemo(() => {
        return Object.fromEntries(
            Object.entries(translations).map(([k, v]) => [k, v[lang]])
        ) as TranslationsObj;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, dir, toggle, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export default LanguageContext;
