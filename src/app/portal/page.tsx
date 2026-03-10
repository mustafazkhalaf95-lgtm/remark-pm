'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/hooks';

const bg = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' };

const STATUS_LABELS: Record<string, { ar: string; color: string }> = {
    new_request: { ar: 'طلب جديد', color: '#6366f1' },
    concept_writing: { ar: 'كتابة المفهوم', color: '#8b5cf6' },
    concept_approval: { ar: 'بانتظار الموافقة', color: '#f59e0b' },
    creative_execution: { ar: 'قيد التنفيذ', color: '#06b6d4' },
    review_revisions: { ar: 'مراجعة', color: '#ec4899' },
    approved_ready: { ar: 'جاهز', color: '#22c55e' },
    pending: { ar: 'معلّق', color: '#f59e0b' },
    in_progress: { ar: 'قيد العمل', color: '#06b6d4' },
    completed: { ar: 'مكتمل', color: '#22c55e' },
    draft: { ar: 'مسودة', color: '#94a3b8' },
    published: { ar: 'منشور', color: '#22c55e' },
    scheduled: { ar: 'مجدول', color: '#6366f1' },
};

const TABS = [
    { id: 'overview', label: 'نظرة عامة', icon: '📊' },
    { id: 'projects', label: 'المشاريع', icon: '📋' },
    { id: 'approvals', label: 'الموافقات', icon: '✅' },
    { id: 'feedback', label: 'الملاحظات', icon: '💬' },
    { id: 'invoices', label: 'الفواتير', icon: '💰' },
    { id: 'access', label: 'إدارة الوصول', icon: '🔑' },
];

export default function PortalPage() {
    const [tab, setTab] = useState('overview');
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [projects, setProjects] = useState<{ creative: any[]; production: any[]; publishing: any[] }>({ creative: [], production: [], publishing: [] });
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [portalUsers, setPortalUsers] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ entityType: 'creative_request', entityId: '', content: '', rating: 5 });
    const [accessForm, setAccessForm] = useState({ email: '', name: '', permissions: 'view' });

    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch(apiUrl('/api/clients?status=active'));
            if (res.ok) {
                const data = await res.json();
                setClients(data.items || []);
                if (!selectedClient && data.items?.length) setSelectedClient(data.items[0].id);
            }
        } catch { /* fallback */ }
    }, [selectedClient]);

    const fetchData = useCallback(async () => {
        if (!selectedClient) return;
        setLoading(true);
        try {
            const [crRes, pjRes, piRes, fbRes, paRes, invRes] = await Promise.all([
                fetch(apiUrl(`/api/creative-requests?clientId=${selectedClient}`)),
                fetch(apiUrl(`/api/production-jobs?clientId=${selectedClient}`)),
                fetch(apiUrl(`/api/publishing-items?clientId=${selectedClient}`)),
                fetch(apiUrl(`/api/portal/feedback?clientId=${selectedClient}`)),
                fetch(apiUrl(`/api/portal/auth?clientId=${selectedClient}`)),
                fetch(apiUrl(`/api/invoices?clientId=${selectedClient}`)),
            ]);
            if (crRes.ok) { const d = await crRes.json(); setProjects(p => ({ ...p, creative: d.items || [] })); }
            if (pjRes.ok) { const d = await pjRes.json(); setProjects(p => ({ ...p, production: d.items || [] })); }
            if (piRes.ok) { const d = await piRes.json(); setProjects(p => ({ ...p, publishing: d.items || [] })); }
            if (fbRes.ok) setFeedbacks(await fbRes.json().then(d => d.items || []));
            if (paRes.ok) setPortalUsers(await paRes.json().then(d => d.items || []));
            if (invRes.ok) setInvoices(await invRes.json().then(d => d.items || []));
        } catch { /* fallback */ }
        setLoading(false);
    }, [selectedClient]);

    useEffect(() => { fetchClients(); }, [fetchClients]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const submitFeedback = async () => {
        if (!selectedClient) return;
        await fetch(apiUrl('/api/portal/feedback'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...feedbackForm, clientId: selectedClient }),
        });
        setShowFeedbackModal(false);
        fetchData();
    };

    const grantAccess = async () => {
        if (!selectedClient) return;
        await fetch(apiUrl('/api/portal/auth'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...accessForm, clientId: selectedClient }),
        });
        setShowAccessModal(false);
        fetchData();
    };

    const allProjects = [...projects.creative.map(p => ({ ...p, board: 'creative' })), ...projects.production.map(p => ({ ...p, board: 'production' })), ...projects.publishing.map(p => ({ ...p, board: 'publishing' }))];
    const pendingApprovals = allProjects.filter(p => ['concept_approval', 'review_revisions', 'review'].includes(p.status));

    return (
        <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>🌐 بوابة العملاء</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>إدارة وصول العملاء ومتابعة المشاريع والموافقات</p>
                </div>
                {/* Client Selector */}
                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>)}
                </select>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                        background: tab === t.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                        color: tab === t.id ? '#818cf8' : 'rgba(255,255,255,0.5)', fontWeight: tab === t.id ? 700 : 500,
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ ...glass, padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>جاري التحميل...</div>
            ) : (
                <>
                    {/* Overview Tab */}
                    {tab === 'overview' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                                {[
                                    { label: 'المشاريع الإبداعية', value: projects.creative.length, color: '#8b5cf6', icon: '🎨' },
                                    { label: 'الإنتاج', value: projects.production.length, color: '#f59e0b', icon: '🎬' },
                                    { label: 'المنشورات', value: projects.publishing.length, color: '#22c55e', icon: '📢' },
                                    { label: 'بانتظار الموافقة', value: pendingApprovals.length, color: '#ef4444', icon: '⏳' },
                                    { label: 'الملاحظات', value: feedbacks.length, color: '#06b6d4', icon: '💬' },
                                    { label: 'الفواتير', value: invoices.length, color: '#ec4899', icon: '💰' },
                                ].map((kpi, i) => (
                                    <div key={i} style={{ ...glass, padding: 18 }}>
                                        <div style={{ fontSize: 22, marginBottom: 6 }}>{kpi.icon}</div>
                                        <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{kpi.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ ...glass, padding: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⏳ بانتظار موافقة العميل</h3>
                                    {pendingApprovals.slice(0, 5).map((p, i) => (
                                        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 13 }}>{p.titleAr || p.title}</span>
                                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: `${STATUS_LABELS[p.status]?.color || '#6366f1'}22`, color: STATUS_LABELS[p.status]?.color || '#6366f1' }}>
                                                {STATUS_LABELS[p.status]?.ar || p.status}
                                            </span>
                                        </div>
                                    ))}
                                    {pendingApprovals.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد موافقات معلّقة</p>}
                                </div>
                                <div style={{ ...glass, padding: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💬 آخر الملاحظات</h3>
                                    {feedbacks.slice(0, 5).map((f: any, i: number) => (
                                        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: 13 }}>{f.content}</div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                                {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= (f.rating || 0) ? '#f59e0b' : 'rgba(255,255,255,0.1)', fontSize: 12 }}>★</span>)}
                                            </div>
                                        </div>
                                    ))}
                                    {feedbacks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد ملاحظات</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Projects Tab */}
                    {tab === 'projects' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                            {allProjects.map((p, i) => (
                                <div key={i} style={{ ...glass, padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700 }}>{p.titleAr || p.title}</span>
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: p.board === 'creative' ? 'rgba(139,92,246,0.15)' : p.board === 'production' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: p.board === 'creative' ? '#8b5cf6' : p.board === 'production' ? '#f59e0b' : '#22c55e' }}>
                                            {p.board === 'creative' ? 'إبداعي' : p.board === 'production' ? 'إنتاج' : 'نشر'}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${STATUS_LABELS[p.status]?.color || '#6366f1'}22`, color: STATUS_LABELS[p.status]?.color || '#6366f1' }}>
                                        {STATUS_LABELS[p.status]?.ar || p.status}
                                    </span>
                                    {p.dueDate && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>الموعد: {new Date(p.dueDate).toLocaleDateString('ar')}</div>}
                                </div>
                            ))}
                            {allProjects.length === 0 && <div style={{ ...glass, padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>لا توجد مشاريع لهذا العميل</div>}
                        </div>
                    )}

                    {/* Approvals Tab */}
                    {tab === 'approvals' && (
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>بانتظار الموافقة</h3>
                            {pendingApprovals.map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.titleAr || p.title}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.board === 'creative' ? '🎨 إبداعي' : p.board === 'production' ? '🎬 إنتاج' : '📢 نشر'}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'none', cursor: 'pointer', fontSize: 12 }}>موافقة ✓</button>
                                        <button onClick={() => { setFeedbackForm({ ...feedbackForm, entityType: p.board === 'creative' ? 'creative_request' : p.board === 'production' ? 'production_job' : 'publishing_item', entityId: p.id }); setShowFeedbackModal(true); }} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'none', cursor: 'pointer', fontSize: 12 }}>ملاحظة 💬</button>
                                    </div>
                                </div>
                            ))}
                            {pendingApprovals.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>لا توجد موافقات معلّقة</p>}
                        </div>
                    )}

                    {/* Feedback Tab */}
                    {tab === 'feedback' && (
                        <div style={{ ...glass, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>ملاحظات العميل</h3>
                                <button onClick={() => setShowFeedbackModal(true)} style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: 'none', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>+ ملاحظة جديدة</button>
                            </div>
                            {feedbacks.map((f: any, i: number) => (
                                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{f.entityType} • {new Date(f.createdAt).toLocaleDateString('ar')}</span>
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= (f.rating || 0) ? '#f59e0b' : 'rgba(255,255,255,0.1)', fontSize: 14 }}>★</span>)}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, margin: 0, color: 'rgba(255,255,255,0.7)' }}>{f.content}</p>
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, marginTop: 6, display: 'inline-block', background: f.status === 'resolved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: f.status === 'resolved' ? '#22c55e' : '#f59e0b' }}>
                                        {f.status === 'new' ? 'جديد' : f.status === 'acknowledged' ? 'تمت المراجعة' : 'تم الحل'}
                                    </span>
                                </div>
                            ))}
                            {feedbacks.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>لا توجد ملاحظات</p>}
                        </div>
                    )}

                    {/* Invoices Tab */}
                    {tab === 'invoices' && (
                        <div style={{ ...glass, padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>فواتير العميل</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {['رقم الفاتورة', 'المبلغ', 'الحالة', 'تاريخ الإصدار', 'تاريخ الاستحقاق'].map(h => (
                                            <th key={h} style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv: any) => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600 }}>{inv.number}</td>
                                            <td style={{ padding: '10px 8px', fontSize: 13 }}>${inv.total?.toLocaleString()}</td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: inv.status === 'paid' ? 'rgba(34,197,94,0.15)' : inv.status === 'overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: inv.status === 'paid' ? '#22c55e' : inv.status === 'overdue' ? '#ef4444' : '#f59e0b' }}>
                                                    {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'overdue' ? 'متأخرة' : inv.status === 'sent' ? 'مرسلة' : 'مسودة'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 8px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{new Date(inv.issueDate).toLocaleDateString('ar')}</td>
                                            <td style={{ padding: '10px 8px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{new Date(inv.dueDate).toLocaleDateString('ar')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {invoices.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>لا توجد فواتير</p>}
                        </div>
                    )}

                    {/* Access Management Tab */}
                    {tab === 'access' && (
                        <div style={{ ...glass, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔑 إدارة وصول العميل</h3>
                                <button onClick={() => setShowAccessModal(true)} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'none', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>+ منح وصول</button>
                            </div>
                            {portalUsers.map((pu: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{pu.name || pu.email}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{pu.email}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{pu.permissions}</span>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: pu.isActive ? '#22c55e' : '#ef4444' }} />
                                    </div>
                                </div>
                            ))}
                            {portalUsers.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>لا يوجد وصول ممنوح لهذا العميل</p>}
                        </div>
                    )}
                </>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowFeedbackModal(false)}>
                    <div style={{ ...glass, padding: 28, width: 440, background: 'rgba(15,15,26,0.95)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>💬 إضافة ملاحظة</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>التقييم</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} onClick={() => setFeedbackForm({ ...feedbackForm, rating: s })} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: s <= feedbackForm.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}>★</button>
                                ))}
                            </div>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الملاحظة</label>
                            <textarea value={feedbackForm.content} onChange={e => setFeedbackForm({ ...feedbackForm, content: e.target.value })} rows={4} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'none' }} placeholder="اكتب ملاحظتك هنا..." />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={submitFeedback} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>إرسال</button>
                            <button onClick={() => setShowFeedbackModal(false)} style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Access Modal */}
            {showAccessModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAccessModal(false)}>
                    <div style={{ ...glass, padding: 28, width: 440, background: 'rgba(15,15,26,0.95)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🔑 منح وصول للعميل</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>البريد الإلكتروني</label>
                            <input type="email" dir="ltr" value={accessForm.email} onChange={e => setAccessForm({ ...accessForm, email: e.target.value })} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} placeholder="client@example.com" />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الاسم</label>
                            <input value={accessForm.name} onChange={e => setAccessForm({ ...accessForm, name: e.target.value })} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} placeholder="اسم المستخدم" />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الصلاحيات</label>
                            <select value={accessForm.permissions} onChange={e => setAccessForm({ ...accessForm, permissions: e.target.value })} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}>
                                <option value="view">عرض فقط</option>
                                <option value="approve">عرض + موافقة</option>
                                <option value="comment">عرض + تعليق</option>
                                <option value="files">عرض + ملفات</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={grantAccess} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>منح الوصول</button>
                            <button onClick={() => setShowAccessModal(false)} style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
