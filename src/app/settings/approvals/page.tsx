'use client';
import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/hooks';
import s from '../settings.module.css';

const WORKFLOWS: Record<string, string> = {
    marketing_plan: '📋 خطة تسويق',
    creative_concept: '🎨 مفهوم إبداعي',
    production_review: '🎬 مراجعة إنتاج',
    final_delivery: '📦 تسليم نهائي',
    publishing: '📢 نشر',
};

const SCOPES: Record<string, string> = {
    concept_preliminary: 'موافقة أولية على المفهوم',
    concept_final: 'موافقة نهائية على المفهوم',
    export: 'موافقة على التصدير',
    publishing: 'موافقة على النشر',
    unblock: 'إلغاء حظر سير العمل',
    revision: 'طلب مراجعة',
};

export default function ApprovalsSettings() {
    const [data, setData] = useState<any>({ policies: [], authorities: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [tab, setTab] = useState<'policies' | 'authorities'>('policies');
    const [toast, setToast] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'policy' | 'authority'>('policy');
    const [deleteName, setDeleteName] = useState('');

    const load = () => { fetch(apiUrl('/api/settings/approvals')).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); };
    useEffect(load, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const handleSave = async () => {
        try {
            const body = tab === 'policies' ? { ...editItem, type: 'policy' } : { ...editItem, type: 'authority' };
            const method = editItem?.id ? 'PUT' : 'POST';
            const res = await fetch(apiUrl('/api/settings/approvals'), { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) { showToast('✅ تم الحفظ'); setShowModal(false); load(); }
            else showToast('❌ خطأ');
        } catch { showToast('❌ خطأ'); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(apiUrl(`/api/settings/approvals?id=${deleteId}&type=${deleteType}`), { method: 'DELETE' });
            if (res.ok) { showToast('✅ تم الحذف'); load(); }
            else showToast('❌ خطأ');
        } catch { showToast('❌ خطأ'); }
        setDeleteId(null);
    };

    if (loading) return <div className={s.loading}><div className={s.spinner} /><br />جاري التحميل...</div>;

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>✅ مصفوفة الموافقات</h1>
                <p className={s.pageSubtitle}>تحديد من يوافق على ماذا في كل مرحلة من سير العمل</p>
            </div>

            <div className={s.tabs}>
                <button className={tab === 'policies' ? s.tabActive : s.tab} onClick={() => setTab('policies')}>📜 سياسات الموافقة</button>
                <button className={tab === 'authorities' ? s.tabActive : s.tab} onClick={() => setTab('authorities')}>👤 صلاحيات الأفراد</button>
            </div>

            {tab === 'policies' && (
                <>
                    <div style={{ marginBottom: 16 }}>
                        <button className={s.btnPrimary} onClick={() => { setEditItem({ name: '', nameAr: '', workflow: 'creative_concept', stage: '', description: '', descriptionAr: '', minApprovals: 1 }); setShowModal(true); }}>+ سياسة جديدة</button>
                    </div>
                    <div className={s.card}>
                        <div className={s.tableWrap}>
                            <table className={s.table}>
                                <thead><tr><th>السياسة</th><th>سير العمل</th><th>المرحلة</th><th>الحد الأدنى</th><th>الحالة</th><th>إجراء</th></tr></thead>
                                <tbody>
                                    {(data.policies || []).map((p: any) => (
                                        <tr key={p.id}>
                                            <td><strong>{p.nameAr || p.name}</strong><br /><span style={{ fontSize: 11, color: 'rgba(226,232,240,.4)' }}>{p.descriptionAr || p.description}</span></td>
                                            <td><span className={s.badgePurple}>{WORKFLOWS[p.workflow] || p.workflow}</span></td>
                                            <td style={{ fontSize: 12 }}>{p.stage || '—'}</td>
                                            <td>{p.minApprovals}</td>
                                            <td><span className={p.isActive ? s.badgeGreen : s.badgeRed}>{p.isActive ? 'نشط' : 'متوقف'}</span></td>
                                            <td><div style={{ display: 'flex', gap: 4 }}><button className={`${s.btnSecondary} ${s.btnSmall}`} onClick={() => { setEditItem(p); setShowModal(true); }}>✏️</button><button className={`${s.btnDanger} ${s.btnSmall}`} onClick={() => { setDeleteId(p.id); setDeleteType('policy'); setDeleteName(p.nameAr || p.name); }}>🗑️</button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {tab === 'authorities' && (
                <>
                    <div className={s.card}>
                        <div className={s.cardTitle}>صلاحيات الموافقة للأفراد</div>
                        <div className={s.cardSubtitle} style={{ marginBottom: 16 }}>من يمتلك صلاحية الموافقة في كل مرحلة</div>
                        <div className={s.tableWrap}>
                            <table className={s.table}>
                                <thead><tr><th>المستخدم</th><th>النطاق</th><th>المستوى</th></tr></thead>
                                <tbody>
                                    {(data.authorities || []).map((a: any) => (
                                        <tr key={a.id}>
                                            <td>{a.user?.profile?.fullNameAr || a.user?.email || '—'}</td>
                                            <td><span className={s.badgeBlue}>{SCOPES[a.scope] || a.scope}</span></td>
                                            <td><span className={a.level === 2 ? s.badgeAmber : s.badgeGray}>{a.level === 2 ? 'إلزامي' : 'اختياري'}</span></td>
                                        </tr>
                                    ))}
                                    {(data.authorities || []).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: 'rgba(226,232,240,.3)' }}>لم يتم تعيين صلاحيات موافقة بعد</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {showModal && editItem && (
                <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editItem.id ? '✏️ تعديل' : '➕ إضافة'}</h2>
                        <div className={s.formGrid}>
                            <div className={s.formGroup}><label className={s.formLabel}>الاسم</label><input className={s.formInput} value={editItem.nameAr || editItem.name || ''} onChange={e => setEditItem({ ...editItem, nameAr: e.target.value, name: e.target.value })} /></div>
                            <div className={s.formGroup}>
                                <label className={s.formLabel}>سير العمل</label>
                                <select className={s.formSelect} value={editItem.workflow || ''} onChange={e => setEditItem({ ...editItem, workflow: e.target.value })}>
                                    {Object.entries(WORKFLOWS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div className={s.formGroup}><label className={s.formLabel}>المرحلة</label><input className={s.formInput} value={editItem.stage || ''} onChange={e => setEditItem({ ...editItem, stage: e.target.value })} /></div>
                            <div className={s.formGroup}><label className={s.formLabel}>الحد الأدنى للموافقات</label><input className={s.formInput} type="number" min="1" value={editItem.minApprovals || 1} onChange={e => setEditItem({ ...editItem, minApprovals: parseInt(e.target.value) })} /></div>
                        </div>
                        <div className={s.formGroup}><label className={s.formLabel}>الوصف</label><textarea className={s.formTextarea} value={editItem.descriptionAr || ''} onChange={e => setEditItem({ ...editItem, descriptionAr: e.target.value })} /></div>
                        <div className={s.formActions}>
                            <button className={s.btnPrimary} onClick={handleSave}>💾 حفظ</button>
                            <button className={s.btnSecondary} onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className={s.confirmOverlay} onClick={() => setDeleteId(null)}>
                    <div className={s.confirmDialog} onClick={e => e.stopPropagation()}>
                        <div className={s.confirmIcon}>⚠️</div>
                        <div className={s.confirmTitle}>حذف {deleteType === 'policy' ? 'السياسة' : 'الصلاحية'}</div>
                        <div className={s.confirmText}>هل أنت متأكد من حذف <strong>{deleteName}</strong>؟</div>
                        <div className={s.confirmActions}>
                            <button className={s.btnDangerFull} onClick={handleDelete}>🗑️ نعم، احذف</button>
                            <button className={s.btnSecondary} onClick={() => setDeleteId(null)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className={toast.includes('✅') ? s.toastSuccess : s.toastError}>{toast}</div>}
        </div>
    );
}
