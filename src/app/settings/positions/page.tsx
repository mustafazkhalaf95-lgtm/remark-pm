'use client';
import { useState, useEffect } from 'react';
import s from '../settings.module.css';

const CATEGORIES: Record<string, string> = {
    executive: '🏢 تنفيذي',
    client: '🧑‍💼 العملاء',
    marketing: '📋 التسويق',
    creative: '🎨 الإبداعي',
    production: '🎬 الإنتاج',
    publishing: '📢 النشر',
    admin: '⚙️ النظام',
};

const LEVELS = ['موظف', 'منسق', 'مدير', 'مدير عام', 'تنفيذي'];

export default function PositionsSettings() {
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editPos, setEditPos] = useState<any>(null);
    const [toast, setToast] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState('');

    const load = () => { fetch('/api/settings/positions').then(r => r.json()).then(d => { setPositions(d); setLoading(false); }).catch(() => setLoading(false)); };
    useEffect(load, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const handleSave = async () => {
        const method = editPos?.id ? 'PUT' : 'POST';
        try {
            const res = await fetch('/api/settings/positions', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editPos) });
            if (res.ok) { showToast('✅ تم الحفظ'); setShowModal(false); load(); }
            else showToast('❌ خطأ');
        } catch { showToast('❌ خطأ'); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/settings/positions?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) { showToast('✅ تم حذف المنصب'); load(); }
            else { const err = await res.json(); showToast(`❌ ${err.error || 'خطأ'}`); }
        } catch { showToast('❌ خطأ'); }
        setDeleteId(null);
    };

    if (loading) return <div className={s.loading}><div className={s.spinner} /><br />جاري التحميل...</div>;

    const grouped = Object.keys(CATEGORIES).reduce((acc: Record<string, any[]>, cat) => {
        acc[cat] = positions.filter(p => p.category === cat);
        return acc;
    }, {});

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>💼 كتالوج المناصب</h1>
                <p className={s.pageSubtitle}>المسميات الوظيفية والمستويات التنظيمية — المنصب ≠ الدور</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button className={s.btnPrimary} onClick={() => { setEditPos({ title: '', titleAr: '', category: 'staff', level: 0, description: '', descriptionAr: '' }); setShowModal(true); }}>+ إضافة منصب</button>
            </div>

            {Object.entries(grouped).map(([cat, items]) => items.length > 0 && (
                <div key={cat} className={s.card}>
                    <div className={s.cardHeader}>
                        <div className={s.cardTitle}>{CATEGORIES[cat]}</div>
                        <span className={s.badgeGray}>{items.length}</span>
                    </div>
                    <div className={s.tableWrap}>
                        <table className={s.table}>
                            <thead><tr><th>المنصب</th><th>المستوى</th><th>الموظفون</th><th>إجراء</th></tr></thead>
                            <tbody>
                                {items.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div><strong>{p.titleAr || p.title}</strong></div>
                                            {p.titleAr && <div style={{ fontSize: 11, color: 'rgba(226,232,240,.4)' }}>{p.title}</div>}
                                        </td>
                                        <td><span className={s.badgeBlue}>{LEVELS[p.level] || p.level}</span></td>
                                        <td>{p._count?.profiles || 0}</td>
                                        <td><div style={{ display: 'flex', gap: 4 }}><button className={`${s.btnSecondary} ${s.btnSmall}`} onClick={() => { setEditPos(p); setShowModal(true); }}>✏️</button><button className={`${s.btnDanger} ${s.btnSmall}`} onClick={() => { setDeleteId(p.id); setDeleteName(p.titleAr || p.title); }}>🗑️</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {showModal && editPos && (
                <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editPos.id ? '✏️ تعديل منصب' : '➕ إضافة منصب جديد'}</h2>
                        <div className={s.formGrid}>
                            <div className={s.formGroup}><label className={s.formLabel}>المسمى (إنجليزي)</label><input className={s.formInput} value={editPos.title} onChange={e => setEditPos({ ...editPos, title: e.target.value })} /></div>
                            <div className={s.formGroup}><label className={s.formLabel}>المسمى (عربي)</label><input className={s.formInput} value={editPos.titleAr} onChange={e => setEditPos({ ...editPos, titleAr: e.target.value })} /></div>
                            <div className={s.formGroup}>
                                <label className={s.formLabel}>الفئة</label>
                                <select className={s.formSelect} value={editPos.category} onChange={e => setEditPos({ ...editPos, category: e.target.value })}>
                                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div className={s.formGroup}>
                                <label className={s.formLabel}>المستوى</label>
                                <select className={s.formSelect} value={editPos.level} onChange={e => setEditPos({ ...editPos, level: parseInt(e.target.value) })}>
                                    {LEVELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className={s.formGroup}><label className={s.formLabel}>الوصف</label><textarea className={s.formTextarea} value={editPos.descriptionAr || ''} onChange={e => setEditPos({ ...editPos, descriptionAr: e.target.value })} /></div>
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
                        <div className={s.confirmTitle}>حذف المنصب</div>
                        <div className={s.confirmText}>هل أنت متأكد من حذف <strong>{deleteName}</strong>؟<br />سيتم إلغاء ربط الموظفين من هذا المنصب.</div>
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
