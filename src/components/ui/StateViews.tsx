'use client';
/* ══════════════════════════════════════════════════════════
   Remark PM — Shared State Views
   Loading, Error, Empty, and Success states with
   glassmorphism design matching the app theme.
   ══════════════════════════════════════════════════════════ */

import { useSettings } from '@/lib/useSettings';

const glass = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 32,
    textAlign: 'center' as const,
};

export function LoadingState({ message }: { message?: string }) {
    const { lang } = useSettings();
    return (
        <div style={{ ...glass, margin: '40px auto', maxWidth: 400 }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
                {message || (lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
    const { lang } = useSettings();
    return (
        <div style={{ ...glass, margin: '40px auto', maxWidth: 500, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
            <p style={{ color: '#ef4444', fontSize: 15, marginBottom: 12 }}>{error}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14,
                    }}
                >
                    {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
            )}
        </div>
    );
}

export function EmptyState({ icon, title, titleEn, subtitle, subtitleEn, action }: {
    icon?: string;
    title: string;
    titleEn?: string;
    subtitle?: string;
    subtitleEn?: string;
    action?: { label: string; labelEn?: string; onClick: () => void };
}) {
    const { lang } = useSettings();
    return (
        <div style={{ ...glass, margin: '40px auto', maxWidth: 500 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{icon || '📭'}</div>
            <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>
                {lang === 'ar' ? title : (titleEn || title)}
            </h3>
            {(subtitle || subtitleEn) && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>
                    {lang === 'ar' ? subtitle : (subtitleEn || subtitle)}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer',
                        fontSize: 14, fontWeight: 600,
                    }}
                >
                    {lang === 'ar' ? action.label : (action.labelEn || action.label)}
                </button>
            )}
        </div>
    );
}

export function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: 'rgba(34,197,94,0.15)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12,
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
            color: '#22c55e', fontSize: 14, animation: 'slideUp 0.3s ease-out',
        }}>
            <span>✅</span>
            <span>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 16 }}>×</button>
            <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
}

export function ConfirmDialog({ title, titleEn, message, messageEn, onConfirm, onCancel, danger }: {
    title: string;
    titleEn?: string;
    message: string;
    messageEn?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}) {
    const { lang } = useSettings();
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onCancel}>
            <div style={{
                ...glass, maxWidth: 420, textAlign: 'right',
                border: danger ? '1px solid rgba(239,68,68,0.3)' : glass.border,
            }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>
                    {lang === 'ar' ? title : (titleEn || title)}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                    {lang === 'ar' ? message : (messageEn || message)}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14,
                    }}>
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button onClick={onConfirm} style={{
                        background: danger ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)',
                        color: danger ? '#ef4444' : '#a5b4fc',
                        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                        borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    }}>
                        {lang === 'ar' ? 'تأكيد' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
