'use client';
/* ══════════════════════════════════════════════════════════
   Remark PM — Confirmation Dialog
   Used for destructive actions (delete, archive, reject).
   ══════════════════════════════════════════════════════════ */

import { useState } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    confirmLabel?: string;
    confirmLabelAr?: string;
    cancelLabel?: string;
    cancelLabelAr?: string;
    variant?: 'danger' | 'warning' | 'info';
    lang?: 'ar' | 'en';
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    titleAr,
    message,
    messageAr,
    confirmLabel = 'Confirm',
    confirmLabelAr = 'تأكيد',
    cancelLabel = 'Cancel',
    cancelLabelAr = 'إلغاء',
    variant = 'danger',
    lang = 'ar',
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const displayTitle = lang === 'ar' && titleAr ? titleAr : title;
    const displayMessage = lang === 'ar' && messageAr ? messageAr : message;
    const displayConfirm = lang === 'ar' ? confirmLabelAr : confirmLabel;
    const displayCancel = lang === 'ar' ? cancelLabelAr : cancelLabel;

    const variantStyles = {
        danger: {
            icon: '⚠️',
            buttonBg: 'bg-red-600 hover:bg-red-500',
            borderColor: 'border-red-500/20',
        },
        warning: {
            icon: '⚡',
            buttonBg: 'bg-amber-600 hover:bg-amber-500',
            borderColor: 'border-amber-500/20',
        },
        info: {
            icon: 'ℹ️',
            buttonBg: 'bg-blue-600 hover:bg-blue-500',
            borderColor: 'border-blue-500/20',
        },
    };

    const style = variantStyles[variant];

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className={`relative w-full max-w-md mx-4 bg-[#1a1b2e]/95 border ${style.borderColor} backdrop-blur-2xl rounded-2xl p-6 shadow-2xl`}>
                <div className="text-center mb-4">
                    <span className="text-4xl block mb-3">{style.icon}</span>
                    <h3 className="text-lg font-bold text-white mb-2">{displayTitle}</h3>
                    <p className="text-sm text-white/60">{displayMessage}</p>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
                    >
                        {displayCancel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-xl ${style.buttonBg} text-white text-sm font-semibold transition-all disabled:opacity-50`}
                    >
                        {loading ? '...' : displayConfirm}
                    </button>
                </div>
            </div>
        </div>
    );
}
