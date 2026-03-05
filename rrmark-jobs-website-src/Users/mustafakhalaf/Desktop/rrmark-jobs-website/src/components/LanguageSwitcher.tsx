"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
    const { lang, toggle } = useLanguage();

    return (
        <button
            onClick={toggle}
            aria-label="Toggle language"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
            <span className={`text-xs font-bold tracking-wider transition-colors duration-300 ${lang === 'en' ? 'text-violet-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-white/30 group-hover:text-white/50'}`}>EN</span>
            <div className="w-px h-3 bg-white/20 rounded-full" />
            <span className={`text-xs font-bold tracking-wider transition-colors duration-300 ${lang === 'ar' ? 'text-violet-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-white/30 group-hover:text-white/50'}`}>عربي</span>
        </button>
    );
}
