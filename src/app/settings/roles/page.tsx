'use client';
import { useState, useEffect } from 'react';
import s from '../settings.module.css';

export default function RolesSettings() {
    const [data, setData] = useState<any>({ roles: [], permissions: [] });
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [editPerms, setEditPerms] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [newRole, setNewRole] = useState<any>(null);
    const [toast, setToast] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState('');

    const load = () => { fetch('/api/settings/roles').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); };
    useEffect(load, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const selectRole = (role: any) => {
        setSelectedRole(role);
        const permIds = new Set<string>((role.permissions || []).map((rp: any) => rp.permissionId || rp.permission?.id));
        setEditPerms(permIds);
    };

    const togglePerm = (permId: string) => {
        setEditPerms(prev => {
            const next = new Set(prev);
            if (next.has(permId)) next.delete(permId); else next.add(permId);
            return next;
        });
    };

    const savePerms = async () => {
        if (!selectedRole) return;
        try {
            const res = await fetch('/api/settings/roles', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedRole.id, name: selectedRole.name, nameAr: selectedRole.nameAr, description: selectedRole.description, descriptionAr: selectedRole.descriptionAr, scope: selectedRole.scope, permissionIds: Array.from(editPerms) }),
            });
            if (res.ok) { showToast('✅ تم حفظ الصلاحيات'); load(); }
            else showToast('❌ خطأ');
        } catch { showToast('❌ خطأ'); }
    };

    const createRole = async () => {
        if (!newRole) return;
        try {
            const res = await fetch('/api/settings/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRole) });
            if (res.ok) { showToast('✅ تم إنشاء الدور'); setShowModal(false); load(); }
            else showToast('❌ خطأ');
        } catch { showToast('❌ خطأ'); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/settings/roles?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) { showToast('✅ تم حذف الدور'); setSelectedRole(null); load(); }
            else { const err = await res.json(); showToast(`❌ ${err.error || 'خطأ'}`); }
        } catch { showToast('❌ خطأ'); }
        setDeleteId(null);
    };

    if (loading) return <div className={s.loading}><div className={s.spinner} /><br />جاري التحميل...</div>;

    const permsByModule = (data.permissions || []).reduce((acc: Record<string, any[]>, p: any) => {
        const mod = p.module || 'other';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(p);
        return acc;
    }, {});

    const moduleLabels: Record<string, string> = { settings: '⚙️ الإعدادات', marketing: '📋 التسويق', creative: '🎨 الإبداعي', production: '🎬 الإنتاج', publishing: '📢 النشر', clients: '🧑‍💼 العملاء', reports: '📊 التقارير', approvals: '✅ الموافقات' };

    return (
        <div>
            <div className={s.pageHeader}>
                <h1 className={s.pageTitle}>🔐 الأدوار والصلاحيات</h1>
                <p className={s.pageSubtitle}>تعريف ما يمكن لكل دور الوصول إليه والقيام به</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button className={s.btnPrimary} onClick={() => { setNewRole({ name: '', nameAr: '', description: '', descriptionAr: '', scope: 'department' }); setShowModal(true); }}>+ دور جديد</button>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
                {/* Role List */}
                <div style={{ width: 260, flexShrink: 0 }}>
                    <div className={s.card} style={{ padding: 8 }}>
                        {(data.roles || []).map((r: any) => (
                            <div key={r.id} className={selectedRole?.id === r.id ? s.navItemActive : s.navItem} style={{ marginBottom: 2, position: 'relative' }}>
                                <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => selectRole(r)}>
                                    <span style={{ fontSize: 13 }}>{r.isSystem ? '🔒' : '🔓'}</span>
                                    <div>
                                        <div style={{ fontSize: 13 }}>{r.nameAr || r.name}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(226,232,240,.4)' }}>{r._count?.userRoles || 0} مستخدم • {r.scope === 'platform' ? 'منصة' : 'قسم'}</div>
                                    </div>
                                </div>
                                {!r.isSystem && <button className={`${s.btnDanger} ${s.btnSmall}`} onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); setDeleteName(r.nameAr || r.name); }} style={{ padding: '2px 6px', fontSize: 10 }}>🗑️</button>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permissions Grid */}
                <div style={{ flex: 1 }}>
                    {selectedRole ? (
                        <div className={s.card}>
                            <div className={s.cardHeader}>
                                <div>
                                    <div className={s.cardTitle}>صلاحيات: {selectedRole.nameAr || selectedRole.name}</div>
                                    <div className={s.cardSubtitle}>{selectedRole.descriptionAr || selectedRole.description}</div>
                                </div>
                                <button className={s.btnPrimary} onClick={savePerms}>💾 حفظ التغييرات</button>
                            </div>

                            {Object.entries(permsByModule).map(([mod, perms]) => (
                                <div key={mod}>
                                    <div className={s.categoryLabel}>{moduleLabels[mod] || mod}</div>
                                    <div className={s.permGrid}>
                                        {(perms as any[]).map((p: any) => (
                                            <div key={p.id} className={editPerms.has(p.id) ? s.permItemActive : s.permItem} onClick={() => togglePerm(p.id)}>
                                                <div className={editPerms.has(p.id) ? s.permCheckActive : s.permCheck}>{editPerms.has(p.id) ? '✓' : ''}</div>
                                                <div>
                                                    <div className={s.permLabel}>{p.nameAr || p.name}</div>
                                                    <div className={s.permModule}>{p.code}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={s.card}><div className={s.emptyState}><div className={s.emptyIcon}>🔐</div><div className={s.emptyText}>اختر دوراً لعرض وتعديل صلاحياته</div></div></div>
                    )}
                </div>
            </div>

            {showModal && newRole && (
                <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>➕ إنشاء دور جديد</h2>
                        <div className={s.formGrid}>
                            <div className={s.formGroup}><label className={s.formLabel}>الاسم (إنجليزي)</label><input className={s.formInput} value={newRole.name} onChange={e => setNewRole({ ...newRole, name: e.target.value })} /></div>
                            <div className={s.formGroup}><label className={s.formLabel}>الاسم (عربي)</label><input className={s.formInput} value={newRole.nameAr} onChange={e => setNewRole({ ...newRole, nameAr: e.target.value })} /></div>
                            <div className={s.formGroup}>
                                <label className={s.formLabel}>النطاق</label>
                                <select className={s.formSelect} value={newRole.scope} onChange={e => setNewRole({ ...newRole, scope: e.target.value })}>
                                    <option value="department">قسم</option>
                                    <option value="platform">منصة</option>
                                    <option value="project">مشروع</option>
                                </select>
                            </div>
                        </div>
                        <div className={s.formGroup}><label className={s.formLabel}>الوصف</label><textarea className={s.formTextarea} value={newRole.descriptionAr} onChange={e => setNewRole({ ...newRole, descriptionAr: e.target.value })} /></div>
                        <div className={s.formActions}>
                            <button className={s.btnPrimary} onClick={createRole}>💾 إنشاء</button>
                            <button className={s.btnSecondary} onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className={s.confirmOverlay} onClick={() => setDeleteId(null)}>
                    <div className={s.confirmDialog} onClick={e => e.stopPropagation()}>
                        <div className={s.confirmIcon}>⚠️</div>
                        <div className={s.confirmTitle}>حذف الدور</div>
                        <div className={s.confirmText}>هل أنت متأكد من حذف <strong>{deleteName}</strong>؟<br />سيتم إلغاء تعيين جميع المستخدمين من هذا الدور.</div>
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
