'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    enabled: boolean;
}

const ROLES = [
    { value: 'CEO', label: 'المدير التنفيذي', labelEn: 'CEO', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { value: 'COO', label: 'مدير العمليات', labelEn: 'COO', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
    { value: 'CREATIVE_MANAGER', label: 'مدير الإبداع', labelEn: 'Creative Manager', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    { value: 'PRODUCTION_MANAGER', label: 'مدير الإنتاج', labelEn: 'Production Manager', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    { value: 'ACCOUNT_MANAGER', label: 'أكاونت منجر', labelEn: 'Account Manager', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { value: 'MARKETING', label: 'تسويق', labelEn: 'Marketing', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { value: 'DESIGNER', label: 'مصمم', labelEn: 'Designer', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    { value: 'COPYWRITER', label: 'كاتب محتوى', labelEn: 'Copywriter', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    { value: 'MEMBER', label: 'عضو', labelEn: 'Member', color: '#71717a', bg: 'rgba(113,113,122,0.15)' },
];

function getRoleInfo(role: string) {
    return ROLES.find(r => r.value === role) || ROLES[ROLES.length - 1];
}

function getRoleIcon(role: string) {
    if (role === 'CEO') return '👑';
    if (role === 'COO') return '⭐';
    if (role.includes('MANAGER')) return '⚙️';
    if (role === 'DESIGNER') return '🎨';
    if (role === 'COPYWRITER') return '✍️';
    if (role === 'MARKETING') return '📢';
    return '👤';
}

export default function AccessPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const currentUserId = (session?.user as any)?.id;

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editRole, setEditRole] = useState('');
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    // New user form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('MEMBER');
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('فشل في تحميل المستخدمين');
            const data = await res.json();
            setUsers(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async () => {
        if (!newName || !newEmail || !newPassword) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'خطأ في الإنشاء');
            }
            setShowAddModal(false);
            setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('MEMBER');
            fetchUsers();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleEnabled = async (user: User) => {
        try {
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, enabled: !user.enabled }),
            });
            fetchUsers();
        } catch { }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`هل أنت متأكد من حذف ${user.name}؟`)) return;
        try {
            await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' });
            fetchUsers();
        } catch { }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, role: newRole }),
            });
            setEditingUser(null);
            fetchUsers();
        } catch { }
    };

    if (userRole !== 'CEO') {
        return (
            <AppLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 48 }}>🔒</span>
                        <p style={{ fontSize: 18, marginTop: 16 }}>هذه الصفحة متاحة فقط للمدير التنفيذي</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>🔐</span> إدارة الوصول
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>{users.length} أعضاء</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent-gradient)', color: '#fff',
                            border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            boxShadow: '0 4px 15px var(--accent-glow)',
                            transition: 'transform 0.2s',
                            fontFamily: 'var(--font-ar)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        ＋ إضافة عضو
                    </button>
                </div>

                {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>جاري التحميل...</p>}
                {error && <p style={{ color: 'var(--red)', textAlign: 'center' }}>{error}</p>}

                {/* User List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {users.map(user => {
                        const roleInfo = getRoleInfo(user.role);
                        const isYou = user.id === currentUserId;
                        return (
                            <div key={user.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 20px', borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                backdropFilter: 'blur(12px)',
                                transition: 'all 0.2s',
                                opacity: user.enabled === false ? 0.5 : 1,
                            }}>
                                {/* Left: Avatar + Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%',
                                        background: roleInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 22, border: `2px solid ${roleInfo.color}`,
                                    }}>
                                        {getRoleIcon(user.role)}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{user.name}</span>
                                            {isYou && (
                                                <span style={{
                                                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                                                    background: 'var(--accent-glow)', color: 'var(--accent)',
                                                    fontWeight: 700,
                                                }}>أنت</span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            @{user.email.split('@')[0]} · انضم {new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Role + Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {editingUser === user.id ? (
                                        <select
                                            value={editRole}
                                            onChange={e => {
                                                setEditRole(e.target.value);
                                                handleRoleChange(user.id, e.target.value);
                                            }}
                                            onBlur={() => setEditingUser(null)}
                                            autoFocus
                                            style={{
                                                padding: '6px 12px', borderRadius: 8,
                                                background: 'var(--bg-glass)', color: 'var(--text-primary)',
                                                border: '1px solid var(--border)', fontSize: 13,
                                                fontFamily: 'var(--font-ar)',
                                            }}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => { if (!isYou) { setEditingUser(user.id); setEditRole(user.role); } }}
                                            style={{
                                                padding: '6px 16px', borderRadius: 20,
                                                background: roleInfo.bg, color: roleInfo.color,
                                                border: `1px solid ${roleInfo.color}40`,
                                                fontWeight: 700, fontSize: 12, cursor: isYou ? 'default' : 'pointer',
                                                fontFamily: 'var(--font-ar)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {roleInfo.label}
                                        </button>
                                    )}

                                    {!isYou && (
                                        <>
                                            <button
                                                onClick={() => handleToggleEnabled(user)}
                                                style={{
                                                    padding: '6px 14px', borderRadius: 8,
                                                    background: user.enabled === false ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                                                    color: user.enabled === false ? '#22c55e' : '#f59e0b',
                                                    border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                                    fontFamily: 'var(--font-ar)',
                                                }}
                                            >
                                                {user.enabled === false ? 'تفعيل' : 'تعطيل'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                style={{
                                                    padding: '6px 14px', borderRadius: 8,
                                                    background: 'rgba(220,38,38,0.12)', color: '#dc2626',
                                                    border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                                    fontFamily: 'var(--font-ar)',
                                                }}
                                            >
                                                حذف
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
                    backdropFilter: 'blur(8px)',
                }} onClick={() => setShowAddModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--bg-glass-solid)', borderRadius: 'var(--radius-lg)',
                        padding: 32, width: 420, maxWidth: '90vw',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                    }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px', textAlign: 'center' }}>
                            ＋ إضافة عضو جديد
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <input
                                placeholder="الاسم الكامل"
                                value={newName} onChange={e => setNewName(e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="البريد الإلكتروني"
                                type="email" dir="ltr"
                                value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="كلمة المرور"
                                type="password"
                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                style={inputStyle}
                            />
                            <select
                                value={newRole} onChange={e => setNewRole(e.target.value)}
                                style={inputStyle}
                            >
                                {ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label} ({r.labelEn})</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button
                                    onClick={handleCreate}
                                    disabled={submitting || !newName || !newEmail || !newPassword}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--accent-gradient)', color: '#fff',
                                        border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                        opacity: submitting ? 0.6 : 1,
                                        fontFamily: 'var(--font-ar)',
                                    }}
                                >
                                    {submitting ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        padding: '12px 20px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-glass)', color: 'var(--text-secondary)',
                                        border: '1px solid var(--border)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                        fontFamily: 'var(--font-ar)',
                                    }}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

const inputStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-glass)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    fontSize: 14,
    fontFamily: 'var(--font-ar)',
    outline: 'none',
};
