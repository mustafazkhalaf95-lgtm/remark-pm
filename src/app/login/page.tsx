'use client';
/* ══════════════════════════════════════════════════════════
   Remark PM — Login Page
   Glassmorphism design with bilingual support.
   ══════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const router = useRouter();

    const t = {
        ar: {
            title: 'Remark Creative',
            subtitle: 'نظام إدارة المشاريع الإبداعية',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            login: 'تسجيل الدخول',
            logging: 'جارٍ تسجيل الدخول...',
            error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            welcome: 'مرحباً بك في ريمارك',
        },
        en: {
            title: 'Remark Creative',
            subtitle: 'Creative Project Management System',
            email: 'Email',
            password: 'Password',
            login: 'Sign In',
            logging: 'Signing in...',
            error: 'Invalid email or password',
            welcome: 'Welcome to Remark',
        },
    };

    const text = t[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;

        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(text.error);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError(text.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={{
                background: 'linear-gradient(135deg, #0a0b14 0%, #1a1b2e 50%, #0d0e1b 100%)',
            }}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
                    style={{
                        background: 'radial-gradient(circle, #7c3aed, transparent)',
                        top: '-10%',
                        right: '-5%',
                    }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
                    style={{
                        background: 'radial-gradient(circle, #a855f7, transparent)',
                        bottom: '-10%',
                        left: '-5%',
                    }}
                />
            </div>

            {/* Language Toggle */}
            <button
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="absolute top-6 left-6 z-10 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-all"
            >
                {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                            <span className="text-3xl">🎨</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            {text.title}
                        </h1>
                        <p className="text-white/40 text-sm">{text.subtitle}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1.5">
                                {text.email}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all text-sm"
                                placeholder="name@remark.com"
                                required
                                autoComplete="email"
                                dir="ltr"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1.5">
                                {text.password}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all text-sm"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                dir="ltr"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !email.trim() || !password.trim()}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
                        >
                            {loading ? text.logging : text.login}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-white/20 text-[10px]">
                            &copy; 2026 Remark Creative Agency
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
