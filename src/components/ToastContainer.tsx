'use client';
import { useState, useEffect } from 'react';
import { getToasts, dismissToast, subscribeToasts } from '@/lib/errorUtils';

export default function ToastContainer() {
    const [, setTick] = useState(0);
    useEffect(() => subscribeToasts(() => setTick(t => t + 1)), []);

    const toasts = getToasts();
    if (toasts.length === 0) return null;

    const icons: Record<string, string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors: Record<string, string> = {
        success: 'linear-gradient(135deg, #22c55e, #16a34a)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
        info: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    };

    return (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
            {toasts.map(toast => (
                <div key={toast.id} style={{
                    background: colors[toast.type], color: 'white', padding: '12px 24px', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, fontWeight: 500, pointerEvents: 'auto', cursor: 'pointer',
                    animation: 'slideDown 0.3s ease', minWidth: 250, maxWidth: 500
                }} onClick={() => dismissToast(toast.id)}>
                    <span style={{ fontSize: 18 }}>{icons[toast.type]}</span>
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <span style={{ opacity: 0.7, fontSize: 12 }}>✕</span>
                </div>
            ))}
            <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
}
