'use client';
/* ══════════════════════════════════════════════════════════
   Remark PM — Empty State Component
   Shown when a board or list has no items.
   ══════════════════════════════════════════════════════════ */

interface EmptyStateProps {
    icon?: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    action?: {
        label: string;
        labelAr?: string;
        onClick: () => void;
    };
    lang?: 'ar' | 'en';
}

export default function EmptyState({
    icon = '📋',
    title,
    titleAr,
    description,
    descriptionAr,
    action,
    lang = 'ar',
}: EmptyStateProps) {
    const displayTitle = lang === 'ar' && titleAr ? titleAr : title;
    const displayDesc = lang === 'ar' && descriptionAr ? descriptionAr : description;
    const actionLabel = lang === 'ar' && action?.labelAr ? action.labelAr : action?.label;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="text-5xl mb-4 block">{icon}</span>
            <h3 className="text-lg font-bold text-white/80 mb-2">{displayTitle}</h3>
            {displayDesc && (
                <p className="text-sm text-white/40 mb-6 max-w-md">{displayDesc}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
