'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/hooks';
import s from './settings.module.css';

export default function SettingsOverview() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(apiUrl('/api/settings')).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className={s.loading}><div className={s.spinner} /><br />جاري التحميل...</div>;
    if (!data) return <div className={s.emptyState}><div className={s.emptyIcon}>⚠️</div><div className={s.emptyText}>لا توجد بيانات</div></div>;

    const stats = [
        { icon: '🏗️', label: 'الأقسام', value: data.departments?.length || 0, color: s.statIconBlue, href: '/settings/departments' },
        { icon: '👥', label: 'المستخدمون', value: data.userCount || 0, color: s.statIconPurple, href: '/settings/users' },
        { icon: '💼', label: 'المناصب', value: data.positionCount || 0, color: s.statIconGreen, href: '/settings/positions' },
        { icon: '🔐', label: 'الأدوار', value: data.roleCount || 0, color: s.statIconAmber, href: '/settings/roles' },
        { icon: '🧑‍💼', label: 'العملاء', value: data.clientCount || 0, color: s.statIconCyan, href: '#' },
        { icon: '🏢', label: 'المنظمة', value: data.org?.name || '—', color: s.statIconRed, href: '/settings/organization' },
    ];

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>⚙️ إعدادات المنصة</h1>
                <p className={s.pageSubtitle}>إدارة الإعدادات العامة، المستخدمين، الأدوار، والصلاحيات</p>
            </div>

            <div className={s.statsGrid}>
                {stats.map((st, i) => (
                    <Link key={i} href={st.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className={s.statCard}>
                            <div className={`${s.statIcon} ${st.color}`}>{st.icon}</div>
                            <div>
                                <div className={s.statValue}>{st.value}</div>
                                <div className={s.statLabel}>{st.label}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className={s.card}>
                <div className={s.cardHeader}>
                    <div>
                        <div className={s.cardTitle}>الأقسام النشطة</div>
                        <div className={s.cardSubtitle}>الأقسام المسجلة في النظام</div>
                    </div>
                    <Link href="/settings/departments" className={s.btnSecondary}>عرض الكل ←</Link>
                </div>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead><tr><th>القسم</th><th>الأعضاء</th><th>الحالة</th></tr></thead>
                        <tbody>
                            {(data.departments || []).map((d: any) => (
                                <tr key={d.id}>
                                    <td><span style={{ marginLeft: 8 }}>{d.icon}</span> {d.nameAr || d.name}</td>
                                    <td>{d._count?.userDepartments || 0}</td>
                                    <td><span className={d.isActive ? s.badgeGreen : s.badgeRed}>{d.isActive ? 'نشط' : 'متوقف'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
