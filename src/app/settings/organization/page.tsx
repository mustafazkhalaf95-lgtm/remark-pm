'use client';
import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/hooks';
import s from '../settings.module.css';

export default function OrganizationSettings() {
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetch(apiUrl('/api/settings/organization')).then(r => r.json()).then(d => { setOrg(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(apiUrl('/api/settings/organization'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(org) });
            if (res.ok) showToast('✅ تم الحفظ بنجاح');
            else showToast('❌ خطأ في الحفظ');
        } catch { showToast('❌ خطأ في الاتصال'); }
        setSaving(false);
    };

    if (loading) return <div className={s.loading}><div className={s.spinner} /><br />جاري التحميل...</div>;
    if (!org) return <div className={s.emptyState}><div className={s.emptyIcon}>⚠️</div></div>;

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>🏢 إعدادات المنظمة</h1>
                <p className={s.pageSubtitle}>معلومات الشركة الأساسية وإعدادات النظام</p>
            </div>

            <div className={s.card}>
                <div className={s.cardTitle}>معلومات الشركة</div>
                <div className={s.formGrid} style={{ marginTop: 16 }}>
                    <div className={s.formGroup}>
                        <label className={s.formLabel}>اسم الشركة (إنجليزي)</label>
                        <input className={s.formInput} value={org.name || ''} onChange={e => setOrg({ ...org, name: e.target.value })} />
                    </div>
                    <div className={s.formGroup}>
                        <label className={s.formLabel}>اسم الشركة (عربي)</label>
                        <input className={s.formInput} value={org.nameAr || ''} onChange={e => setOrg({ ...org, nameAr: e.target.value })} />
                    </div>
                    <div className={s.formGroup}>
                        <label className={s.formLabel}>المنطقة الزمنية</label>
                        <select className={s.formSelect} value={org.timezone || ''} onChange={e => setOrg({ ...org, timezone: e.target.value })}>
                            <option value="Asia/Baghdad">Asia/Baghdad (GMT+3)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                            <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                            <option value="Europe/London">Europe/London (GMT+0)</option>
                        </select>
                    </div>
                    <div className={s.formGroup}>
                        <label className={s.formLabel}>اللغة الافتراضية</label>
                        <select className={s.formSelect} value={org.language || 'ar'} onChange={e => setOrg({ ...org, language: e.target.value })}>
                            <option value="ar">العربية</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div className={s.formGroup}>
                        <label className={s.formLabel}>أيام العمل</label>
                        <select className={s.formSelect} value={org.workWeek || 'sun-thu'} onChange={e => setOrg({ ...org, workWeek: e.target.value })}>
                            <option value="sun-thu">الأحد - الخميس</option>
                            <option value="mon-fri">الإثنين - الجمعة</option>
                            <option value="sat-thu">السبت - الخميس</option>
                        </select>
                    </div>
                    <div className={s.formGroup}>
                        <label className={s.formLabel}>شعار الشركة (رابط)</label>
                        <input className={s.formInput} value={org.logo || ''} onChange={e => setOrg({ ...org, logo: e.target.value })} placeholder="https://..." />
                    </div>
                </div>
                <div className={s.formActions}>
                    <button className={s.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}</button>
                </div>
            </div>

            {toast && <div className={toast.includes('✅') ? s.toastSuccess : s.toastError}>{toast}</div>}
        </div>
    );
}
