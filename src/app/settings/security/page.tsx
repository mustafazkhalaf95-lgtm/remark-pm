'use client';
import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/hooks';
import s from '../settings.module.css';

export default function SecuritySettings() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');

    const load = (p: number = 1, cat: string = '') => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), limit: '20' });
        if (cat) params.set('category', cat);
        fetch(apiUrl(`/api/settings/audit?${params}`)).then(r => r.json()).then(d => {
            setLogs(d.logs || []);
            setTotal(d.total || 0);
            setPage(p);
            setLoading(false);
        }).catch(() => setLoading(false));
    };
    useEffect(() => load(), []);

    const categories: Record<string, string> = { '': 'الكل', system: '⚙️ النظام', user: '👤 المستخدمين', role: '🔐 الأدوار', department: '🏗️ الأقسام', settings: '📋 الإعدادات', security: '🛡️ الأمان' };

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>🛡️ الأمان وسجل التدقيق</h1>
                <p className={s.pageSubtitle}>سجل التغييرات في الإعدادات والصلاحيات والأمان</p>
            </div>

            {/* Security Overview Cards */}
            <div className={s.statsGrid}>
                <div className={s.statCard}>
                    <div className={`${s.statIcon} ${s.statIconGreen}`}>🔒</div>
                    <div><div className={s.statValue}>RBAC</div><div className={s.statLabel}>نظام صلاحيات قائم على الأدوار</div></div>
                </div>
                <div className={s.statCard}>
                    <div className={`${s.statIcon} ${s.statIconBlue}`}>🛡️</div>
                    <div><div className={s.statValue}>CSRF</div><div className={s.statLabel}>حماية من هجمات التزوير</div></div>
                </div>
                <div className={s.statCard}>
                    <div className={`${s.statIcon} ${s.statIconAmber}`}>⏱️</div>
                    <div><div className={s.statValue}>Rate</div><div className={s.statLabel}>تحديد المعدل مفعّل</div></div>
                </div>
                <div className={s.statCard}>
                    <div className={`${s.statIcon} ${s.statIconPurple}`}>📋</div>
                    <div><div className={s.statValue}>{total}</div><div className={s.statLabel}>سجلات التدقيق</div></div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className={s.card}>
                <div className={s.cardHeader}>
                    <div className={s.cardTitle}>📋 سجل التدقيق</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {Object.entries(categories).map(([k, v]) => (
                            <button key={k} className={category === k ? s.tabActive : s.tab} onClick={() => { setCategory(k); load(1, k); }} style={{ padding: '4px 10px', fontSize: 11 }}>{v}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className={s.loading}><div className={s.spinner} /></div>
                ) : logs.length === 0 ? (
                    <div className={s.emptyState}>
                        <div className={s.emptyIcon}>📋</div>
                        <div className={s.emptyText}>لا توجد سجلات تدقيق بعد</div>
                        <div style={{ fontSize: 12, color: 'rgba(226,232,240,.3)', marginTop: 8 }}>ستظهر السجلات تلقائياً مع استخدام النظام</div>
                    </div>
                ) : (
                    <>
                        <div className={s.tableWrap}>
                            <table className={s.table}>
                                <thead><tr><th>التاريخ</th><th>المستخدم</th><th>الإجراء</th><th>الفئة</th><th>التفاصيل</th></tr></thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleDateString('ar-IQ')} {new Date(log.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{log.user?.profile?.fullNameAr || log.user?.email || '—'}</td>
                                            <td><span className={s.badgeBlue}>{log.action}</span></td>
                                            <td style={{ fontSize: 12 }}>{categories[log.category] || log.category}</td>
                                            <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {total > 20 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                                <button className={s.btnSecondary} disabled={page <= 1} onClick={() => load(page - 1, category)}>← السابق</button>
                                <span style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(226,232,240,.5)' }}>{page} / {Math.ceil(total / 20)}</span>
                                <button className={s.btnSecondary} disabled={page >= Math.ceil(total / 20)} onClick={() => load(page + 1, category)}>التالي →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
