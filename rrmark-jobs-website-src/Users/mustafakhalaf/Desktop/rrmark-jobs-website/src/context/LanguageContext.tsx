"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { translations, Lang, Translations } from "@/lib/i18n";

interface LanguageContextValue {
    lang: Lang;
    dir: "ltr" | "rtl";
    t: Translations;
    toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Lang>("en");

    // Read from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("remark_lang") as Lang | null;
        if (stored === "ar" || stored === "en") {
            setLang(stored);
        }
    }, []);

    // Sync html dir/lang when language changes
    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }, [lang]);

    const toggle = useCallback(() => {
        setLang((prev) => {
            const next: Lang = prev === "en" ? "ar" : "en";
            localStorage.setItem("remark_lang", next);
            return next;
        });
    }, []);

    const value: LanguageContextValue = {
        lang,
        dir: lang === "ar" ? "rtl" : "ltr",
        t: translations[lang] as Translations,
        toggle,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
}
