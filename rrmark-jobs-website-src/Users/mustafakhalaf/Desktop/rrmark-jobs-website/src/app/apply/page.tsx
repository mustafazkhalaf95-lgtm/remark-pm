"use client";

import { Suspense } from "react";
import ApplyForm from "./ApplyForm";
import GlowBackground from "@/components/GlowBackground";
import { useLanguage } from "@/context/LanguageContext";

export default function ApplyPage() {
    const { t, dir } = useLanguage();

    return (
        <main className="relative min-h-screen" dir={dir}>
            <GlowBackground />

            {/* Content flex aligned with the new Hero layout */}
            <div className="max-w-5xl mx-auto px-6 pt-32 pb-20 md:pt-44 md:pb-28">
                <Suspense fallback={<div className="text-white/50 text-center py-20">Loading form…</div>}>
                    <ApplyForm />
                </Suspense>
            </div>
        </main>
    );
}
