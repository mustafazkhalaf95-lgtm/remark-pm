"use client";

import Link from "next/link";
import GlowBackground from "@/components/GlowBackground";
import CrystalOrb from "@/components/CrystalOrb";
import GlassButton from "@/components/GlassButton";
import { useLanguage } from "@/context/LanguageContext";
import { type OrbAnimState } from "@/lib/animationConfig";
import { useState } from "react";

export default function SuccessPage() {
    const { t, dir } = useLanguage();
    const [orbState, setOrbState] = useState<OrbAnimState>("idle");

    return (
        <main className="relative min-h-screen flex flex-col pt-32 md:pt-44 pb-20 md:pb-28" dir={dir}>
            <GlowBackground />

            {/* Content (Centered) */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-10 md:mt-20">
                {/* Crystal Orb */}
                <div className="flex justify-center mb-10 relative" style={{ minHeight: 250, width: "100%" }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CrystalOrb size={220} onStateChange={setOrbState} />
                    </div>
                </div>

                <div className="animate-fade-in-up mt-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gradient">
                        {t.successTitle}
                    </h1>

                    <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed mb-10">
                        {t.successMsg}
                    </p>

                    <Link href="/">
                        <GlassButton variant="primary">
                            {t.successBackBtn}
                        </GlassButton>
                    </Link>
                </div>
            </section>
        </main>
    );
}
