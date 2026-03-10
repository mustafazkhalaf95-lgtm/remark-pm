import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
            padding: 24,
        }}>
            <div style={{
                fontSize: 64,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 8,
            }}>
                404
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                الصفحة غير موجودة
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
                الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            </p>
            <Link
                href="/"
                style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                }}
            >
                العودة للرئيسية
            </Link>
        </div>
    );
}
