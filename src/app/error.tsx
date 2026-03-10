'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: 24,
        }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                حدث خطأ غير متوقع
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, maxWidth: 400 }}>
                نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
            </p>
            <button
                onClick={reset}
                style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                إعادة المحاولة
            </button>
        </div>
    );
}
