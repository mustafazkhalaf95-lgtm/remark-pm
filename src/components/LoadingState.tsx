'use client';
/* ══════════════════════════════════════════════════════════
   Remark PM — Loading States
   Skeleton loaders and spinners for async content.
   ══════════════════════════════════════════════════════════ */

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
    return (
        <div className={`${sizeClasses[size]} border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin`} />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
            <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
            <div className="h-3 bg-white/5 rounded w-full mb-2" />
            <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 bg-white/5 rounded-full" />
                <div className="h-6 w-12 bg-white/5 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonBoard({ columns = 4 }: { columns?: number }) {
    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(250px, 1fr))` }}>
            {Array.from({ length: columns }).map((_, col) => (
                <div key={col} className="space-y-3">
                    <div className="h-8 bg-white/5 rounded-xl animate-pulse" />
                    {Array.from({ length: 3 }).map((_, row) => (
                        <SkeletonCard key={row} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2 animate-pulse">
            <div className="h-10 bg-white/5 rounded-xl" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-12 bg-white/[0.02] rounded-xl" />
            ))}
        </div>
    );
}

export function LoadingOverlay({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            {message && <p className="text-sm text-white/40 mt-4">{message}</p>}
        </div>
    );
}

export function ErrorBanner({
    message,
    messageAr,
    onRetry,
    onDismiss,
    lang = 'ar',
}: {
    message: string;
    messageAr?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    lang?: 'ar' | 'en';
}) {
    const displayMessage = lang === 'ar' && messageAr ? messageAr : message;

    return (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-sm text-red-400">{displayMessage}</span>
            </div>
            <div className="flex gap-2">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                        {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="px-2 py-1 text-red-400/60 text-xs hover:text-red-400 transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
