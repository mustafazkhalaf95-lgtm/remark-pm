"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ROLES } from "@/lib/roles";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import CrystalOrb from "@/components/CrystalOrb";
import { useLanguage } from "@/context/LanguageContext";

interface FormState {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    yearsExperience: string;
    portfolioUrl: string;
    whyJoin: string;
    strongestSkill: string;
    expectedSalary: string;
    role: string;
    workType: string;
}

const INITIAL: FormState = {
    fullName: "",
    phone: "+964 ",
    email: "",
    city: "",
    yearsExperience: "",
    portfolioUrl: "",
    whyJoin: "",
    strongestSkill: "",
    expectedSalary: "",
    role: "",
    workType: "",
};

type Status = "idle" | "loading" | "success" | "error";

export default function ApplyForm() {
    const params = useSearchParams();
    const router = useRouter();
    const preRole = params.get("role") ?? "";
    const { t, dir } = useLanguage();

    const [form, setForm] = useState<FormState>({ ...INITIAL, role: preRole });
    const [cv, setCv] = useState<File | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const shownTips = useRef<Set<string>>(new Set());

    // --- Interactive Assistant Helper ---
    const triggerAssistant = (key: string, textEn: string, textAr: string) => {
        const langKey = `${dir}-${key}`;
        if (shownTips.current.has(langKey)) return;
        shownTips.current.add(langKey);

        const message = dir === "rtl" ? textAr : textEn;
        window.dispatchEvent(
            new CustomEvent("assistant-message", {
                detail: { text: message, delay: 600 }
            })
        );
    };

    const firstName = form.fullName.trim().split(" ")[0];
    const nameEn = firstName ? `, ${firstName}` : "";
    const nameAr = firstName ? ` يا ${firstName}` : "";

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");

        // Demo mode: if Supabase is not configured, skip DB and redirect to success
        if (!supabase) {
            setStatus("success");
            router.push("/success");
            return;
        }

        try {
            let cvUrl = "";

            if (cv) {
                const ext = cv.name.split(".").pop();
                const filename = `${Date.now()}_${form.fullName.replace(/\s+/g, "_")}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("cvs")
                    .upload(filename, cv, { contentType: "application/pdf", upsert: false });

                if (uploadError) throw new Error("CV upload failed: " + uploadError.message);

                const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(filename);
                cvUrl = urlData.publicUrl;
            }

            const { error: dbError } = await supabase.from("applications").insert({
                role: form.role,
                full_name: form.fullName,
                phone: form.phone,
                email: form.email,
                city: form.city,
                years_experience: parseInt(form.yearsExperience, 10) || 0,
                portfolio_url: form.portfolioUrl,
                why_join: form.whyJoin,
                strongest_skill: form.strongestSkill,
                expected_salary: form.expectedSalary,
                work_type: form.workType,
                cv_url: cvUrl,
            });

            if (dbError) throw new Error("Database error: " + dbError.message);

            setStatus("success");
            router.push("/success");
        } catch (err: unknown) {
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        }
    }
    const selectedRoleObj = ROLES.find((r) => r.id === form.role);
    const selectedRoleTitle = selectedRoleObj
        ? (t.roles[selectedRoleObj.id] as any)?.title || selectedRoleObj.title
        : t.applySubtitle;

    return (
        <div className="animate-fade-in-up" dir={dir}>
            <div className="flex flex-col lg:flex-row gap-12 items-start">

                {/* Left Column: Sticky Context */}
                <div className="w-full lg:w-[35%] lg:sticky lg:top-32 space-y-8 relative">
                    <div className="text-center lg:text-start">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gradient mb-4">
                            {t.applyTitle}
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed">
                            {selectedRoleTitle}
                        </p>
                    </div>

                    {/* Decorative Hexa Circle behind context */}
                    <div className="hidden lg:flex justify-center items-center h-64 opacity-60 pointer-events-none mt-10">
                        <CrystalOrb size={200} />
                    </div>

                    <p className="hidden lg:block text-white/30 text-xs text-center mt-auto">
                        {t.confidential}
                    </p>
                </div>

                {/* Right Column: The Form */}
                <div className="w-full lg:w-[65%]">
                    <GlassCard className="p-8 md:p-10 !rounded-[2.5rem]">
                        <form onSubmit={handleSubmit} className="space-y-12">

                            {/* Section 1: Personal Info */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-4 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-sm font-bold">1</span>
                                    {t.fieldFullName ? "Personal Information" : "المعلومات الشخصية"}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-glass" htmlFor="fullName">
                                            {t.fieldFullName} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            required
                                            placeholder={t.fieldFullNamePlaceholder}
                                            value={form.fullName}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "fullName",
                                                "Let's start with your name! What should we call you? 📝",
                                                "دعنا نبدأ باسمك! كيف تحب أن نناديك؟ 📝"
                                            )}
                                            className="input-glass"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-glass" htmlFor="phone">
                                            {t.fieldPhone} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            required
                                            placeholder={t.fieldPhonePlaceholder}
                                            value={form.phone}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "phone",
                                                `Great to meet you${nameEn}! We'll use this to contact you if you're shortlisted. 📱`,
                                                `تشرفنا بمعرفتك${nameAr}! سنستخدم رقمك للتواصل معك إذا ترشحت. 📱`
                                            )}
                                            className="input-glass"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-glass" htmlFor="email">
                                            {t.fieldEmail} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder={t.fieldEmailPlaceholder}
                                            value={form.email}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "email",
                                                `We'll send updates about your application here${nameEn}. 📧`,
                                                `سنرسل لك تحديثات عن طلبك على هذا الإيميل${nameAr}. 📧`
                                            )}
                                            className="input-glass"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-glass" htmlFor="city">
                                            {t.fieldCity} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="city"
                                            name="city"
                                            type="text"
                                            required
                                            placeholder={t.fieldCityPlaceholder}
                                            value={form.city}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "city",
                                                `Where are you based${nameEn}? Reminder: our work is fully remote! 🌍`,
                                                `من أي مدينة تتابعنا${nameAr}؟ للتذكير: عملنا عن بُعد بالكامل! 🌍`
                                            )}
                                            className="input-glass"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Role & Experience */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-4 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-sm font-bold">2</span>
                                    {t.fieldRole ? "Experience & Skills" : "الخبرة والمهارات"}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-glass" htmlFor="role">
                                            {t.fieldRole} <span className="text-violet-400">*</span>
                                        </label>
                                        <select
                                            id="role"
                                            name="role"
                                            required
                                            value={form.role}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "role",
                                                `Great choice${nameEn}! Need details? Just ask! 🚀`,
                                                `اختيار رائع${nameAr}! تحتاج تفاصيل أكثر؟ اسألني! 🚀`
                                            )}
                                            className="input-glass"
                                        >
                                            <option value="">{t.fieldRolePlaceholder}</option>
                                            {ROLES.map((r) => {
                                                const localized = t.roles[r.id] ?? { title: r.title };
                                                return (
                                                    <option key={r.id} value={r.id}>
                                                        {localized.title}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-glass" htmlFor="workType">
                                            {t.fieldWorkType} <span className="text-violet-400">*</span>
                                        </label>
                                        <input type="hidden" name="workType" required value={form.workType} />
                                        <div className="flex bg-white/[0.03] border border-white/10 rounded-xl p-1 gap-1">
                                            {["Remote", "Hybrid", "On-site"].map((type) => {
                                                const isSelected = form.workType === type;
                                                const label =
                                                    type === "Remote" ? t.workTypeRemote
                                                        : type === "Hybrid" ? t.workTypeHybrid
                                                            : t.workTypeOnSite;

                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(f => ({ ...f, workType: type }));
                                                            triggerAssistant(
                                                                "workType",
                                                                `What suits you best${nameEn}? We offer remote, hybrid, and on-site! 🏢🏠`,
                                                                `ما الذي يناسبك أكثر${nameAr}؟ نوفر خيارات العمل عن بُعد، الهجين، والمكتبي! 🏢🏠`
                                                            );
                                                        }}
                                                        className={`flex flex-1 flex-col items-center justify-center gap-2 py-3 px-2 rounded-lg text-sm font-medium transition-all duration-300
                                                                ${isSelected
                                                                ? "bg-violet-500/20 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/50"
                                                                : "text-white/50 hover:text-white/80 hover:bg-white/5"
                                                            }`}
                                                    >
                                                        {type === "Remote" && (
                                                            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                        {type === "Hybrid" && (
                                                            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                        )}
                                                        {type === "On-site" && (
                                                            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        )}
                                                        <span>{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-glass" htmlFor="yearsExperience">
                                            {t.fieldYearsExp} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="yearsExperience"
                                            name="yearsExperience"
                                            type="number"
                                            min="0"
                                            max="40"
                                            required
                                            placeholder={t.fieldYearsExpPlaceholder}
                                            value={form.yearsExperience}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "exp",
                                                `Your experience matters${nameEn}. Don't hesitate to count your freelance years too! ⏳`,
                                                `خبرتك تهمنا${nameAr}. لا تتردد في احتساب سنوات عملك الحر أيضاً! ⏳`
                                            )}
                                            className="input-glass"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-glass" htmlFor="expectedSalary">
                                            {t.fieldSalary} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="expectedSalary"
                                            name="expectedSalary"
                                            type="text"
                                            required
                                            placeholder={t.fieldSalaryPlaceholder}
                                            value={form.expectedSalary}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "salary",
                                                `We value transparency${nameEn}! Be honest here. 💎`,
                                                `نُقدر الشفافية عالياً${nameAr}، كن صريحاً معنا! 💎`
                                            )}
                                            className="input-glass"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-glass" htmlFor="strongestSkill">
                                            {t.fieldSkill} <span className="text-violet-400">*</span>
                                        </label>
                                        <input
                                            id="strongestSkill"
                                            name="strongestSkill"
                                            type="text"
                                            required
                                            placeholder={t.fieldSkillPlaceholder}
                                            value={form.strongestSkill}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "skill",
                                                `What makes you stand out${nameEn}? Tell us your superpower! ⚡`,
                                                `ما الذي يجعلك مميزاً${nameAr}؟ أخبرنا بمهارتك الخارقة! ⚡`
                                            )}
                                            className="input-glass"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-glass" htmlFor="portfolioUrl">
                                            {t.fieldPortfolio}
                                        </label>
                                        <input
                                            id="portfolioUrl"
                                            name="portfolioUrl"
                                            type="url"
                                            placeholder={t.fieldPortfolioPlaceholder}
                                            value={form.portfolioUrl}
                                            onChange={handleChange}
                                            onFocus={() => triggerAssistant(
                                                "portfolio",
                                                `Show us your magic${nameEn}! A link to your previous work is highly recommended. 🔗`,
                                                `أرنا إبداعاتك${nameAr}! وجود رابط لأعمالك السابقة يزيد جداً من فرصك. 🔗`
                                            )}
                                            className="input-glass"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Pitch & CV */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-4 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-sm font-bold">3</span>
                                    {t.fieldWhyJoin ? "The Pitch & CV" : "رسالتك وسيرتك الذاتية"}
                                </h3>

                                <div>
                                    <label className="label-glass" htmlFor="whyJoin">
                                        {t.fieldWhyJoin} <span className="text-violet-400">*</span>
                                    </label>
                                    <textarea
                                        id="whyJoin"
                                        name="whyJoin"
                                        required
                                        rows={4}
                                        placeholder={t.fieldWhyJoinPlaceholder}
                                        value={form.whyJoin}
                                        onChange={handleChange}
                                        onFocus={() => triggerAssistant(
                                            "pitch",
                                            `Your time to shine${nameEn}! Be creative! ✨`,
                                            `هذه فرصتك للتألق والإبداع${nameAr}! ✨`
                                        )}
                                        className="input-glass resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="label-glass" htmlFor="cv">
                                        {t.fieldCv} <span className="text-violet-400">*</span>
                                    </label>
                                    <div
                                        className="relative w-full px-6 py-10 rounded-xl border-2 border-dashed border-white/[0.15] bg-white/[0.02] backdrop-blur-sm cursor-pointer
                                          hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 group flex flex-col items-center justify-center text-center overflow-hidden"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <input
                                            ref={fileRef}
                                            id="cv"
                                            name="cv"
                                            type="file"
                                            accept=".pdf"
                                            required
                                            className="hidden"
                                            onChange={(e) => setCv(e.target.files?.[0] ?? null)}
                                        />

                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/50 group-hover:text-violet-300 group-hover:scale-110 transition-all duration-300">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-base font-medium text-white/70 group-hover:text-white transition-colors">
                                            {cv ? cv.name : t.fieldCvUpload}
                                        </span>
                                        <span className="text-sm text-white/30 mt-1">
                                            PDF up to 5MB
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Error message */}
                            {status === "error" && (
                                <div className="flex items-start gap-3 p-5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm animate-fade-in-up">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                                    </svg>
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <p className="text-white/40 text-sm order-2 md:order-1 lg:hidden text-center">
                                    {t.confidential}
                                </p>
                                <div className="w-full md:w-auto order-1 md:order-2">
                                    <GlassButton
                                        type="submit"
                                        loading={status === "loading" || status === "success"}
                                        className="py-3 px-10 text-base w-full md:w-auto"
                                    >
                                        {status === "loading" || status === "success" ? t.submittingBtn : t.submitBtn}
                                    </GlassButton>
                                </div>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
