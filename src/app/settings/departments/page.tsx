'use client';
import { useState, useEffect } from 'react';
import s from '../settings.module.css';

export default function DepartmentsSettings() {
    const [depts, setDepts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editDept, setEditDept] = useState<any>(null);
    const [toast, setToast] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState('');

    const load = () => { fetch('/api/settings/departments').then(r => r.json()).then(d => { setDepts(d); setLoading(false); }).catch(() => setLoading(false)); };
    useEffect(load, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const handleSave = async () => {
        const method = editDept?.id ? 'PUT' : 'POST';
        try {
            const res = await fetch('/api/settings/departments', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDept) });
            if (res.ok) { showToast('✅ تم الحفظ'); setShowModal(false); load(); }
            else showToast('❌ خطأ');
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/settings/departments?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) { showToast('✅ تم حذف القسم'); load(); }
            else { const err = await res.json(); showToast(`❌ ${err.error || 'خطأ'}`); }
        } catch { showToast('❌ خطأ'); }
        setDeleteId(null);
    };

    if (loading) return <div className={s.loading}><div className={s.spinner} /><br />جاري التحميل...</div>;

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>🏗️ إدارة الأقسام</h1>
                <p className={s.pageSubtitle}>أقسام المنظمة ومسؤوليها</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                <button className={s.btnPrimary} onClick={() => { setEditDept({ name: '', nameAr: '', slug: '', description: '', descriptionAr: '', color: '#6366f1', icon: '📋' }); setShowModal(true); }}>+ إضافة قسم</button>
            </div>

            <div className={s.card}>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead><tr><th>القسم</th><th>الوصف</th><th>الأعضاء</th><th>الحالة</th><th>إجراء</th></tr></thead>
                        <tbody>
                            {depts.map(d => (
                                <tr key={d.id}>
                                    <td><span style={{ marginLeft: 6 }}>{d.icon}</span> {d.nameAr || d.name}</td>
                                    <td style={{ color: 'rgba(226,232,240,.5)', fontSize: 12 }}>{d.descriptionAr || d.description || '—'}</td>
                                    <td>{d._count?.userDepartments || 0}</td>
                                    <td><span className={d.isActive ? s.badgeGreen : s.badgeRed}>{d.isActive ? 'نشط' : 'متوقف'}</span></td>
                                    <td><div style={{ display: 'flex', gap: 4 }}><button className={`${s.btnSecondary} ${s.btnSmall}`} onClick={() => { setEditDept(d); setShowModal(true); }}>✏️</button><button className={`${s.btnDanger} ${s.btnSmall}`} onClick={() => { setDeleteId(d.id); setDeleteName(d.nameAr || d.name); }}>🗑️</button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && editDept && (
                <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editDept.id ? '✏️ تعديل القسم' : '➕ إضافة قسم جديد'}</h2>
                        <div className={s.formGrid}>
                            <div className={s.formGroup}><label className={s.formLabel}>الاسم (إنجليزي)</label><input className={s.formInput} value={editDept.name} onChange={e => setEditDept({ ...editDept, name: e.target.value })} /></div>
                            <div className={s.formGroup}><label className={s.formLabel}>الاسم (عربي)</label><input className={s.formInput} value={editDept.nameAr} onChange={e => setEditDept({ ...editDept, nameAr: e.target.value })} /></div>
                            {!editDept.id && <div className={s.formGroup}><label className={s.formLabel}>المعرف (slug)</label><input className={s.formInput} value={editDept.slug} onChange={e => setEditDept({ ...editDept, slug: e.target.value })} placeholder="e.g. marketing" /></div>}
                            <div className={s.formGroup}><label className={s.formLabel}>الأيقونة</label><input className={s.formInput} value={editDept.icon} onChange={e => setEditDept({ ...editDept, icon: e.target.value })} /></div>
                            <div className={s.formGroup}><label className={s.formLabel}>اللون</label><input type="color" className={s.formInput} value={editDept.color} onChange={e => setEditDept({ ...editDept, color: e.target.value })} style={{ height: 40, padding: 4 }} /></div>
                        </div>
                        <div className={s.formGroup}><label className={s.formLabel}>الوصف (عربي)</label><textarea className={s.formTextarea} value={editDept.descriptionAr || ''} onChange={e => setEditDept({ ...editDept, descriptionAr: e.target.value })} /></div>
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
                        <div className={s.confirmTitle}>حذف القسم</div>
                        <div className={s.confirmText}>هل أنت متأكد من حذف <strong>{deleteName}</strong>؟<br />سيتم إلغاء ربط جميع الأعضاء.</div>
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
