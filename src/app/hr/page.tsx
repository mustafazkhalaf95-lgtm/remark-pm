'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/hooks';

const TABS = [
    { id: 'overview', label: 'نظرة عامة', labelEn: 'Overview', icon: '📊' },
    { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: '🏖️' },
    { id: 'reviews', label: 'التقييمات', labelEn: 'Reviews', icon: '⭐' },
    { id: 'directory', label: 'الفريق', labelEn: 'Directory', icon: '👥' },
];

const LEAVE_TYPES = [
    { value: 'annual', label: 'سنوية', labelEn: 'Annual', color: '#22c55e' },
    { value: 'sick', label: 'مرضية', labelEn: 'Sick', color: '#ef4444' },
    { value: 'personal', label: 'شخصية', labelEn: 'Personal', color: '#f59e0b' },
    { value: 'unpaid', label: 'بدون راتب', labelEn: 'Unpaid', color: '#94a3b8' },
    { value: 'remote', label: 'عمل عن بعد', labelEn: 'Remote', color: '#06b6d4' },
];

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444', cancelled: '#94a3b8',
    draft: '#94a3b8', submitted: '#6366f1', acknowledged: '#22c55e',
};

const bg = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' };

export default function HRPage() {
    const [tab, setTab] = useState('overview');
    const [leaves, setLeaves] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ type: 'annual', startDate: '', endDate: '', days: 1, reason: '' });
    const [reviewForm, setReviewForm] = useState({ userId: '', period: '', rating: 3, strengths: '', improvements: '', goals: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [lRes, rRes, uRes] = await Promise.all([
                fetch(apiUrl('/api/hr/leaves')), fetch(apiUrl('/api/hr/reviews')), fetch(apiUrl('/api/settings/users')),
            ]);
            if (lRes.ok) setLeaves(await lRes.json().then(d => d.items || d));
            if (rRes.ok) setReviews(await rRes.json().then(d => d.items || d));
            if (uRes.ok) setUsers(await uRes.json().then(d => d.items || d));
        } catch { /* fallback */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const submitLeave = async () => {
        const res = await fetch(apiUrl('/api/hr/leaves'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveForm),
        });
        if (res.ok) { setShowLeaveModal(false); fetchData(); setLeaveForm({ type: 'annual', startDate: '', endDate: '', days: 1, reason: '' }); }
    };

    const submitReview = async () => {
        const res = await fetch(apiUrl('/api/hr/reviews'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewForm),
        });
        if (res.ok) { setShowReviewModal(false); fetchData(); }
    };

    const approveLeave = async (id: string, decision: string) => {
        await fetch(apiUrl(`/api/hr/leaves/${id}`), {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: decision }),
        });
        fetchData();
    };

    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const avgRating = reviews.length ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0';

    return (
        <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>👥 الموارد البشرية</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>إدارة الفريق والإجازات والتقييمات</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowLeaveModal(true)} style={{ ...glass, padding: '10px 20px', color: '#22c55e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        + طلب إجازة
                    </button>
                    <button onClick={() => setShowReviewModal(true)} style={{ ...glass, padding: '10px 20px', color: '#8b5cf6', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        + تقييم أداء
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '8px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                        background: tab === t.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                        color: tab === t.id ? '#818cf8' : 'rgba(255,255,255,0.5)',
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && (
                <div>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                        {[
                            { label: 'أعضاء الفريق', value: users.length, icon: '👥', color: '#6366f1' },
                            { label: 'إجازات معلّقة', value: pendingLeaves, icon: '⏳', color: '#f59e0b' },
                            { label: 'إجازات مقبولة', value: approvedLeaves, icon: '✅', color: '#22c55e' },
                            { label: 'متوسط التقييم', value: avgRating + '/5', icon: '⭐', color: '#8b5cf6' },
                            { label: 'تقييمات هذا الربع', value: reviews.length, icon: '📋', color: '#06b6d4' },
                        ].map((kpi, i) => (
                            <div key={i} style={{ ...glass, padding: 20 }}>
                                <div style={{ fontSize: 24, marginBottom: 8 }}>{kpi.icon}</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{kpi.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏖️ آخر طلبات الإجازة</h3>
                            {leaves.slice(0, 5).map((l: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{l.user?.profile?.fullNameAr || l.userId?.slice(0, 8)}</span>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>
                                            {LEAVE_TYPES.find(t => t.value === l.type)?.label || l.type}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[l.status] || '#94a3b8'}22`, color: STATUS_COLORS[l.status] || '#94a3b8' }}>
                                        {l.status === 'pending' ? 'معلّق' : l.status === 'approved' ? 'مقبول' : l.status === 'rejected' ? 'مرفوض' : l.status}
                                    </span>
                                </div>
                            ))}
                            {leaves.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد طلبات إجازة</p>}
                        </div>
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⭐ آخر التقييمات</h3>
                            {reviews.slice(0, 5).map((r: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{r.user?.profile?.fullNameAr || r.userId?.slice(0, 8)}</span>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>{r.period}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <span key={s} style={{ color: s <= (r.rating || 0) ? '#f59e0b' : 'rgba(255,255,255,0.1)', fontSize: 14 }}>★</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {reviews.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد تقييمات</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Leaves Tab */}
            {tab === 'leaves' && (
                <div style={{ ...glass, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>طلبات الإجازات</h3>
                        <button onClick={() => setShowLeaveModal(true)} style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'none', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
                            + طلب جديد
                        </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                {['الموظف', 'النوع', 'من', 'إلى', 'الأيام', 'السبب', 'الحالة', 'إجراء'].map(h => (
                                    <th key={h} style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((l: any) => (
                                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '10px 8px', fontSize: 13 }}>{l.user?.profile?.fullNameAr || '—'}</td>
                                    <td style={{ padding: '10px 8px', fontSize: 13 }}>
                                        <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, background: `${LEAVE_TYPES.find(t => t.value === l.type)?.color || '#6366f1'}22`, color: LEAVE_TYPES.find(t => t.value === l.type)?.color || '#6366f1' }}>
                                            {LEAVE_TYPES.find(t => t.value === l.type)?.label || l.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 8px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{l.startDate?.split('T')[0]}</td>
                                    <td style={{ padding: '10px 8px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{l.endDate?.split('T')[0]}</td>
                                    <td style={{ padding: '10px 8px', fontSize: 13 }}>{l.days}</td>
                                    <td style={{ padding: '10px 8px', fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</td>
                                    <td style={{ padding: '10px 8px' }}>
                                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[l.status]}22`, color: STATUS_COLORS[l.status] }}>
                                            {l.status === 'pending' ? 'معلّق' : l.status === 'approved' ? 'مقبول' : l.status === 'rejected' ? 'مرفوض' : 'ملغى'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 8px' }}>
                                        {l.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button onClick={() => approveLeave(l.id, 'approved')} style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>قبول</button>
                                                <button onClick={() => approveLeave(l.id, 'rejected')} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>رفض</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leaves.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40, fontSize: 14 }}>لا توجد طلبات إجازة</p>}
                </div>
            )}

            {/* Reviews Tab */}
            {tab === 'reviews' && (
                <div style={{ ...glass, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>تقييمات الأداء</h3>
                        <button onClick={() => setShowReviewModal(true)} style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: 'none', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
                            + تقييم جديد
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                        {reviews.map((r: any) => (
                            <div key={r.id} style={{ ...glass, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.user?.profile?.fullNameAr || '—'}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.period}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <span key={s} style={{ color: s <= (r.rating || 0) ? '#f59e0b' : 'rgba(255,255,255,0.1)', fontSize: 18 }}>★</span>
                                        ))}
                                    </div>
                                </div>
                                {r.strengths && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}><b style={{ color: '#22c55e' }}>نقاط القوة:</b> {r.strengths}</div>}
                                {r.improvements && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}><b style={{ color: '#f59e0b' }}>التحسينات:</b> {r.improvements}</div>}
                                {r.goals && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}><b style={{ color: '#6366f1' }}>الأهداف:</b> {r.goals}</div>}
                                <div style={{ marginTop: 8 }}>
                                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[r.status]}22`, color: STATUS_COLORS[r.status] }}>
                                        {r.status === 'draft' ? 'مسودة' : r.status === 'submitted' ? 'مرسل' : 'مقروء'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {reviews.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40, fontSize: 14 }}>لا توجد تقييمات</p>}
                </div>
            )}

            {/* Directory Tab */}
            {tab === 'directory' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {users.map((u: any) => (
                        <div key={u.id} style={{ ...glass, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#818cf8' }}>
                                    {(u.profile?.fullNameAr || u.email || '?')[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{u.profile?.fullNameAr || u.profile?.fullName || u.email}</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{u.profile?.position?.titleAr || u.profile?.position?.title || '—'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11 }}>
                                <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                    {u.userDepartments?.[0]?.department?.nameAr || '—'}
                                </span>
                                <span style={{ padding: '2px 8px', borderRadius: 8, background: u.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: u.status === 'active' ? '#22c55e' : '#ef4444' }}>
                                    {u.status === 'active' ? 'نشط' : 'غير نشط'}
                                </span>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                        </div>
                    ))}
                    {users.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>لا يوجد أعضاء</p>}
                </div>
            )}

            {/* Leave Request Modal */}
            {showLeaveModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowLeaveModal(false)}>
                    <div style={{ ...glass, padding: 28, width: 440, background: 'rgba(15,15,26,0.95)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🏖️ طلب إجازة</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>نوع الإجازة</label>
                            <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}>
                                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>من</label>
                                    <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>إلى</label>
                                    <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                            </div>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>عدد الأيام</label>
                            <input type="number" min={0.5} step={0.5} value={leaveForm.days} onChange={e => setLeaveForm({ ...leaveForm, days: parseFloat(e.target.value) })} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>السبب</label>
                            <textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={3} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'none' }} placeholder="سبب الإجازة..." />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={submitLeave} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>إرسال الطلب</button>
                            <button onClick={() => setShowLeaveModal(false)} style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13 }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReviewModal(false)}>
                    <div style={{ ...glass, padding: 28, width: 480, background: 'rgba(15,15,26,0.95)', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>⭐ تقييم أداء</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الموظف</label>
                            <select value={reviewForm.userId} onChange={e => setReviewForm({ ...reviewForm, userId: e.target.value })} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}>
                                <option value="">اختر الموظف...</option>
                                {users.map((u: any) => <option key={u.id} value={u.id}>{u.profile?.fullNameAr || u.email}</option>)}
                            </select>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الفترة</label>
                            <input value={reviewForm.period} onChange={e => setReviewForm({ ...reviewForm, period: e.target.value })} placeholder="مثال: Q1-2026" style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>التقييم</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: s <= reviewForm.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}>★</button>
                                ))}
                            </div>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>نقاط القوة</label>
                            <textarea value={reviewForm.strengths} onChange={e => setReviewForm({ ...reviewForm, strengths: e.target.value })} rows={2} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'none' }} />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>مجالات التحسين</label>
                            <textarea value={reviewForm.improvements} onChange={e => setReviewForm({ ...reviewForm, improvements: e.target.value })} rows={2} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'none' }} />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الأهداف القادمة</label>
                            <textarea value={reviewForm.goals} onChange={e => setReviewForm({ ...reviewForm, goals: e.target.value })} rows={2} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={submitReview} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>حفظ التقييم</button>
                            <button onClick={() => setShowReviewModal(false)} style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13 }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
