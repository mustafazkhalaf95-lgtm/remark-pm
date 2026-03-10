'use client';
import { useState, useMemo } from 'react';
import s from '../settings.module.css';
import { useUsers } from '@/lib/hooks';

export default function UsersSettings() {
    const { users, loading, error } = useUsers();
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState('');

    const filtered = useMemo(() => {
        if (!search) return users;
        const q = search.toLowerCase();
        return users.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.nameAr || '').includes(q) ||
            (u.position || '').toLowerCase().includes(q) ||
            (u.positionAr || '').includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }, [search, users]);

    // Group users by department
    const departments = useMemo(() => {
        const deptMap = new Map<string, typeof users>();
        for (const u of users) {
            const dept = u.department || 'Other';
            if (!deptMap.has(dept)) deptMap.set(dept, []);
            deptMap.get(dept)!.push(u);
        }
        return Array.from(deptMap.entries());
    }, [users]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>⏳ جاري التحميل...</div>;
    if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>❌ خطأ: {error}</div>;

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>👥 إدارة الفريق</h1>
                <p className={s.pageSubtitle}>{users.length} عضو فريق</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                <div className={s.searchBox} style={{ flex: 1, marginBottom: 0 }}>
                    <input className={s.searchInput} placeholder="🔍 بحث بالاسم أو المنصب..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className={s.card} style={{ padding: 0 }}>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead><tr><th>العضو</th><th>المنصب</th><th>الدور</th><th>القسم</th><th>البريد</th></tr></thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className={s.profileCard}>
                                            <div className={s.avatar} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf688)' }}>{u.avatar || '👤'}</div>
                                            <div className={s.profileInfo}>
                                                <span className={s.profileName}>{u.nameAr || u.name}</span>
                                                <span className={s.profileEmail}>{u.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 12 }}>{u.positionAr || u.position || '—'}</td>
                                    <td>
                                        <span className={s.badgePurple} style={{ fontSize: 10 }}>{u.roleAr || u.role}</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12 }}>{u.departmentAr || u.department || '—'}</span>
                                    </td>
                                    <td style={{ fontSize: 11, color: '#64748b' }}>{u.email}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'rgba(226,232,240,.3)' }}>لا توجد نتائج</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Department Summary */}
            <div style={{ marginTop: 24 }}>
                <h2 className={s.pageTitle} style={{ fontSize: 16 }}>📊 ملخص الأقسام</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                    {departments.map(([dept, members]) => (
                        <div key={dept} className={s.card} style={{ padding: 16 }}>
                            <div style={{ fontSize: 24, marginBottom: 6 }}>👥</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{dept}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1', marginTop: 4 }}>{members.length}</div>
                            <div style={{ marginTop: 8 }}>
                                {members.map(m => (
                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '2px 0' }}>
                                        <span>{m.avatar || '👤'}</span><span>{m.nameAr || m.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {toast && <div className={toast.includes('✅') ? s.toastSuccess : s.toastError}>{toast}</div>}
        </div>
    );
}
