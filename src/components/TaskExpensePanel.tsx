'use client';
/* ══════════════════════════════════════════════════════════
   TaskExpensePanel — Expense list & add form for task cards.
   Account managers create expenses; COO approves them.
   ══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser, useHasRole } from '@/lib/hooks/useSession';
import { apiUrl } from '@/lib/hooks/useFetch';

interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    createdBy: string;
    approvedBy?: string;
    createdAt: string;
}

interface TaskExpensePanelProps {
    taskType: string; // 'creative_request' | 'production_job' | 'publishing_item' | 'marketing_task'
    taskId: string;
    clientId?: string;
    campaignId?: string;
}

const CATEGORIES = [
    { value: 'freelancer', label: 'مستقل', labelEn: 'Freelancer' },
    { value: 'software', label: 'برمجيات', labelEn: 'Software' },
    { value: 'equipment', label: 'معدات', labelEn: 'Equipment' },
    { value: 'travel', label: 'سفر', labelEn: 'Travel' },
    { value: 'marketing', label: 'تسويق', labelEn: 'Marketing' },
    { value: 'other', label: 'أخرى', labelEn: 'Other' },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    approved: { label: 'معتمد', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function TaskExpensePanel({ taskType, taskId, clientId, campaignId }: TaskExpensePanelProps) {
    const { user } = useCurrentUser();
    const isCOO = useHasRole(['coo', 'ceo', 'admin']);
    const canCreate = useHasRole(['account_manager', 'coo', 'ceo', 'admin']);

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ category: 'other', description: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchExpenses = useCallback(async () => {
        try {
            const url = apiUrl(`/api/expenses?taskType=${taskType}&taskId=${taskId}&take=50`);
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.data || data.items || []);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [taskType, taskId]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const handleCreate = async () => {
        if (!form.description.trim() || !form.amount) return;
        setSubmitting(true);
        try {
            const res = await fetch(apiUrl('/api/expenses'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: form.category,
                    description: form.description,
                    amount: parseFloat(form.amount),
                    taskType,
                    taskId,
                    clientId: clientId || null,
                    campaignId: campaignId || null,
                    status: 'pending',
                }),
            });
            if (res.ok) {
                setForm({ category: 'other', description: '', amount: '' });
                setShowForm(false);
                fetchExpenses();
            }
        } catch { /* silent */ }
        finally { setSubmitting(false); }
    };

    const handleApproval = async (expenseId: string, newStatus: 'approved' | 'rejected') => {
        try {
            await fetch(apiUrl(`/api/expenses/${expenseId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchExpenses();
        } catch { /* silent */ }
    };

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const approved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

    return (
        <div style={{
            marginTop: 12,
            padding: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>💰</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                        المصاريف
                    </span>
                    {expenses.length > 0 && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 6 }}>
                            {expenses.length}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {total > 0 && (
                        <span style={{ fontSize: 11, color: approved > 0 ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                            ${approved.toLocaleString()} / ${total.toLocaleString()}
                        </span>
                    )}
                    {canCreate && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{
                                padding: '4px 10px', borderRadius: 8,
                                background: showForm ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                                color: showForm ? '#f87171' : '#a5b4fc',
                                fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                            }}
                        >
                            {showForm ? 'إلغاء' : '+ إضافة'}
                        </button>
                    )}
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div style={{
                    padding: 12, marginBottom: 10, borderRadius: 10,
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        style={{
                            padding: '6px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontSize: 12,
                        }}
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <input
                        placeholder="الوصف..."
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        style={{
                            padding: '6px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontSize: 12, width: '100%',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="number"
                            placeholder="المبلغ ($)"
                            value={form.amount}
                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            style={{
                                flex: 1, padding: '6px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: 12,
                            }}
                        />
                        <button
                            onClick={handleCreate}
                            disabled={submitting || !form.description.trim() || !form.amount}
                            style={{
                                padding: '6px 16px', borderRadius: 8,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                opacity: submitting || !form.description.trim() || !form.amount ? 0.5 : 1,
                            }}
                        >
                            {submitting ? '...' : 'إضافة'}
                        </button>
                    </div>
                </div>
            )}

            {/* Expense List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 8, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                    جارٍ التحميل...
                </div>
            ) : expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 8, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    لا توجد مصاريف بعد
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {expenses.map(exp => {
                        const statusInfo = STATUS_LABELS[exp.status] || STATUS_LABELS.pending;
                        return (
                            <div key={exp.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {exp.description}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                                        {CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                                        ${exp.amount.toLocaleString()}
                                    </span>
                                    <span style={{
                                        fontSize: 10, padding: '2px 6px', borderRadius: 6,
                                        background: statusInfo.bg, color: statusInfo.color, fontWeight: 600,
                                    }}>
                                        {statusInfo.label}
                                    </span>
                                    {/* Approval buttons for COO on pending expenses */}
                                    {isCOO && exp.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                onClick={() => handleApproval(exp.id, 'approved')}
                                                style={{
                                                    padding: '2px 8px', borderRadius: 6,
                                                    background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                                                    fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                                                }}
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => handleApproval(exp.id, 'rejected')}
                                                style={{
                                                    padding: '2px 8px', borderRadius: 6,
                                                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                                    fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
