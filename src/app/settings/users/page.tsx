'use client';
import { useState, useMemo } from 'react';
import s from '../settings.module.css';
import { TEAM, DEPT_LABELS, ROLE_LABELS, DEPARTMENTS, ROLES, type TeamMember, type Role, type Department } from '@/lib/teamStore';

export default function UsersSettings() {
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const filtered = useMemo(() => {
        if (!search) return TEAM;
        const q = search.toLowerCase();
        return TEAM.filter(m => m.name.includes(q) || m.nameEn.toLowerCase().includes(q) || m.position.includes(q) || m.positionEn.toLowerCase().includes(q));
    }, [search]);

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>👥 إدارة الفريق — الفريق الحقيقي</h1>
                <p className={s.pageSubtitle}>13 عضو فريق حقيقي مع أدوار متعددة ومسؤوليات ثانوية</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                <div className={s.searchBox} style={{ flex: 1, marginBottom: 0 }}>
                    <input className={s.searchInput} placeholder="🔍 بحث بالاسم أو المنصب..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className={s.card} style={{ padding: 0 }}>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead><tr><th>العضو</th><th>المنصب</th><th>الأدوار</th><th>القسم</th><th>المسؤوليات الثانوية</th></tr></thead>
                        <tbody>
                            {filtered.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div className={s.profileCard}>
                                            <div className={s.avatar} style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}88)` }}>{m.avatar}</div>
                                            <div className={s.profileInfo}>
                                                <span className={s.profileName}>{m.name}</span>
                                                <span className={s.profileEmail}>{m.nameEn}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 12 }}>{m.position}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {m.roles.map(r => (
                                                <span key={r} className={s.badgePurple} style={{ fontSize: 10 }}>{ROLE_LABELS[r]?.ar || r}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12 }}>{DEPT_LABELS[m.department]?.icon} {DEPT_LABELS[m.department]?.ar}</span>
                                    </td>
                                    <td style={{ fontSize: 11, color: '#64748b' }}>
                                        {m.secondaryResponsibilities.length > 0
                                            ? m.secondaryResponsibilities.join('، ')
                                            : '—'}
                                    </td>
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
                    {DEPARTMENTS.map(dept => {
                        const members = TEAM.filter(m => m.department === dept);
                        const info = DEPT_LABELS[dept];
                        return (
                            <div key={dept} className={s.card} style={{ padding: 16 }}>
                                <div style={{ fontSize: 24, marginBottom: 6 }}>{info.icon}</div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{info.ar}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{info.en}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: info.color }}>{members.length}</div>
                                <div style={{ marginTop: 8 }}>
                                    {members.map(m => (
                                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '2px 0' }}>
                                            <span>{m.avatar}</span><span>{m.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {toast && <div className={toast.includes('✅') ? s.toastSuccess : s.toastError}>{toast}</div>}
        </div>
    );
}
