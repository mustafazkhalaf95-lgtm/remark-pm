'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSettings } from '@/lib/useSettings';
import { apiUrl } from '@/lib/hooks';

// ─── Translations ───
const T = {
    ar: {
        title: 'المالية',
        subtitle: 'لوحة التحكم المالية',
        tabs: { overview: 'نظرة عامة', invoices: 'الفواتير', expenses: 'المصاريف', budgets: 'الميزانيات' },
        kpi: {
            revenue: 'إجمالي الإيرادات',
            expenses: 'المصاريف',
            profit: 'صافي الربح',
            pending: 'فواتير معلّقة',
            budgets: 'ميزانيات نشطة',
        },
        invoice: {
            number: 'رقم الفاتورة',
            client: 'العميل',
            amount: 'المبلغ',
            status: 'الحالة',
            dueDate: 'تاريخ الاستحقاق',
            create: 'فاتورة جديدة',
            edit: 'تعديل الفاتورة',
            items: 'البنود',
            description: 'الوصف',
            quantity: 'الكمية',
            rate: 'السعر',
            addItem: 'إضافة بند',
            subtotal: 'المجموع الفرعي',
            tax: 'الضريبة %',
            discount: 'الخصم',
            total: 'الإجمالي',
            notes: 'ملاحظات',
            filter: 'تصفية حسب الحالة',
            all: 'الكل',
            draft: 'مسودة',
            sent: 'مرسلة',
            paid: 'مدفوعة',
            overdue: 'متأخرة',
            cancelled: 'ملغاة',
            delete: 'حذف',
            save: 'حفظ',
            cancel: 'إلغاء',
            recordPayment: 'تسجيل دفعة',
            paymentAmount: 'مبلغ الدفعة',
            paymentMethod: 'طريقة الدفع',
            paymentRef: 'رقم المرجع',
            bankTransfer: 'تحويل بنكي',
            cash: 'نقداً',
            card: 'بطاقة',
            cheque: 'شيك',
            other: 'أخرى',
            markSent: 'تحويل إلى مرسلة',
            noInvoices: 'لا توجد فواتير',
            payments: 'الدفعات',
            paidAmount: 'المبلغ المدفوع',
            remaining: 'المتبقي',
            currency: 'العملة',
        },
        expense: {
            create: 'مصروف جديد',
            edit: 'تعديل المصروف',
            category: 'الفئة',
            description: 'الوصف',
            amount: 'المبلغ',
            date: 'التاريخ',
            status: 'الحالة',
            noExpenses: 'لا توجد مصاريف',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            total: 'الإجمالي',
            categories: {
                salaries: 'الرواتب',
                software: 'البرمجيات',
                equipment: 'المعدات',
                travel: 'السفر',
                marketing: 'التسويق',
                office: 'المكتب',
                freelancer: 'مستقل',
                other: 'أخرى',
            },
            pending: 'معلّق',
            approved: 'موافق عليه',
            rejected: 'مرفوض',
        },
        budget: {
            create: 'ميزانية جديدة',
            edit: 'تعديل الميزانية',
            name: 'الاسم',
            allocated: 'المخصص',
            spent: 'المصروف',
            remaining: 'المتبقي',
            period: 'الفترة',
            status: 'الحالة',
            noBudgets: 'لا توجد ميزانيات',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            monthly: 'شهري',
            quarterly: 'ربع سنوي',
            yearly: 'سنوي',
            project: 'مشروع',
            active: 'نشطة',
            closed: 'مغلقة',
            exceeded: 'تجاوزت',
            startDate: 'تاريخ البداية',
            endDate: 'تاريخ النهاية',
            warning: 'تحذير: تجاوز 80%',
        },
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        noClient: 'بدون عميل',
    },
    en: {
        title: 'Finance',
        subtitle: 'Financial Dashboard',
        tabs: { overview: 'Overview', invoices: 'Invoices', expenses: 'Expenses', budgets: 'Budgets' },
        kpi: {
            revenue: 'Total Revenue',
            expenses: 'Expenses',
            profit: 'Net Profit',
            pending: 'Pending Invoices',
            budgets: 'Active Budgets',
        },
        invoice: {
            number: 'Invoice #',
            client: 'Client',
            amount: 'Amount',
            status: 'Status',
            dueDate: 'Due Date',
            create: 'New Invoice',
            edit: 'Edit Invoice',
            items: 'Items',
            description: 'Description',
            quantity: 'Qty',
            rate: 'Rate',
            addItem: 'Add Item',
            subtotal: 'Subtotal',
            tax: 'Tax %',
            discount: 'Discount',
            total: 'Total',
            notes: 'Notes',
            filter: 'Filter by Status',
            all: 'All',
            draft: 'Draft',
            sent: 'Sent',
            paid: 'Paid',
            overdue: 'Overdue',
            cancelled: 'Cancelled',
            delete: 'Delete',
            save: 'Save',
            cancel: 'Cancel',
            recordPayment: 'Record Payment',
            paymentAmount: 'Payment Amount',
            paymentMethod: 'Payment Method',
            paymentRef: 'Reference #',
            bankTransfer: 'Bank Transfer',
            cash: 'Cash',
            card: 'Card',
            cheque: 'Cheque',
            other: 'Other',
            markSent: 'Mark as Sent',
            noInvoices: 'No invoices found',
            payments: 'Payments',
            paidAmount: 'Paid Amount',
            remaining: 'Remaining',
            currency: 'Currency',
        },
        expense: {
            create: 'New Expense',
            edit: 'Edit Expense',
            category: 'Category',
            description: 'Description',
            amount: 'Amount',
            date: 'Date',
            status: 'Status',
            noExpenses: 'No expenses found',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            total: 'Total',
            categories: {
                salaries: 'Salaries',
                software: 'Software',
                equipment: 'Equipment',
                travel: 'Travel',
                marketing: 'Marketing',
                office: 'Office',
                freelancer: 'Freelancer',
                other: 'Other',
            },
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
        },
        budget: {
            create: 'New Budget',
            edit: 'Edit Budget',
            name: 'Name',
            allocated: 'Allocated',
            spent: 'Spent',
            remaining: 'Remaining',
            period: 'Period',
            status: 'Status',
            noBudgets: 'No budgets found',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            yearly: 'Yearly',
            project: 'Project',
            active: 'Active',
            closed: 'Closed',
            exceeded: 'Exceeded',
            startDate: 'Start Date',
            endDate: 'End Date',
            warning: 'Warning: over 80%',
        },
        loading: 'Loading...',
        error: 'An error occurred',
        noClient: 'No client',
    },
};

// ─── Types ───
interface InvoiceItem { id?: string; description: string; descriptionAr: string; quantity: number; rate: number; amount: number; sortOrder: number; }
interface Payment { id: string; amount: number; method: string; reference: string; notes: string; paidAt: string; }
interface Invoice {
    id: string; number: string; clientId: string; status: string; issueDate: string; dueDate: string;
    subtotal: number; taxRate: number; taxAmount: number; discount: number; total: number; currency: string;
    notes: string; notesAr: string;
    client?: { id: string; name: string; nameAr: string; avatar: string };
    items: InvoiceItem[]; payments: Payment[];
}
interface Expense {
    id: string; category: string; description: string; descriptionAr: string; amount: number;
    currency: string; date: string; status: string; clientId?: string;
}
interface Budget {
    id: string; clientId?: string; name: string; nameAr: string; allocated: number; spent: number;
    period: string; startDate?: string; endDate?: string; status: string;
    remaining: number; percentUsed: number;
}
interface Client { id: string; name: string; nameAr: string; avatar: string; }

// ─── Constants ───
const STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8', sent: '#f59e0b', paid: '#22c55e', overdue: '#ef4444', cancelled: '#6b7280', viewed: '#3b82f6',
};
const EXPENSE_ICONS: Record<string, string> = {
    salaries: '💰', software: '💻', equipment: '🔧', travel: '✈️', marketing: '📢', office: '🏢', freelancer: '👤', other: '📦',
};
const EXPENSE_CATEGORIES = ['salaries', 'software', 'equipment', 'travel', 'marketing', 'office', 'freelancer', 'other'];
const PERIOD_OPTIONS = ['monthly', 'quarterly', 'yearly', 'project'];
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'card', 'cheque', 'other'];

// ─── Styles ───
const BG = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
const GLASS: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
};
const GLASS_LIGHT: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
};
const ACCENT = '#6366f1';
const BTN: React.CSSProperties = {
    background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px',
    cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
};
const BTN_GHOST: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
};
const BTN_DANGER: React.CSSProperties = {
    background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const INPUT: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
    color: '#e2e8f0', padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none',
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: 'pointer' };
const MODAL_OVERLAY: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};
const MODAL_BOX: React.CSSProperties = {
    ...GLASS, background: 'rgba(20,20,40,0.95)', padding: 28, width: '90%', maxWidth: 600,
    maxHeight: '85vh', overflowY: 'auto', position: 'relative',
};
const BADGE = (color: string): React.CSSProperties => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    color, background: `${color}18`, border: `1px solid ${color}30`,
});

function formatCurrency(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}
function formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-CA');
}

// ─── Main Component ───
export default function FinancePage() {
    const { theme, lang, toggleTheme, toggleLang } = useSettings();
    const t = T[lang];
    const isRTL = lang === 'ar';

    // ── State ──
    const [tab, setTab] = useState<'overview' | 'invoices' | 'expenses' | 'budgets'>('overview');
    const [loading, setLoading] = useState(true);

    // Data
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Filters
    const [invoiceFilter, setInvoiceFilter] = useState('all');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

    // Modals
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

    // Form states
    const [invForm, setInvForm] = useState({ clientId: '', dueDate: '', taxRate: 0, discount: 0, currency: 'USD', notes: '', notesAr: '', items: [{ description: '', descriptionAr: '', quantity: 1, rate: 0 }] as { description: string; descriptionAr: string; quantity: number; rate: number }[] });
    const [expForm, setExpForm] = useState({ category: 'other', description: '', descriptionAr: '', amount: 0, date: new Date().toISOString().split('T')[0], clientId: '', status: 'pending' });
    const [budForm, setBudForm] = useState({ name: '', nameAr: '', allocated: 0, period: 'monthly', clientId: '', startDate: '', endDate: '', status: 'active' });
    const [payForm, setPayForm] = useState({ amount: 0, method: 'bank_transfer', reference: '', notes: '' });

    // ── Fetch Data ──
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, expRes, budRes, cliRes] = await Promise.all([
                fetch(apiUrl('/api/invoices?take=100')).then(r => r.json()),
                fetch(apiUrl('/api/expenses?take=100')).then(r => r.json()),
                fetch(apiUrl('/api/budgets?take=100')).then(r => r.json()),
                fetch(apiUrl('/api/clients?take=100')).then(r => r.json()),
            ]);
            setInvoices(invRes.data || []);
            setExpenses(expRes.data || []);
            setBudgets(budRes.data || []);
            setClients(cliRes.data || []);
        } catch (e) {
            console.error('Failed to fetch finance data', e);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── KPIs ──
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.filter(e => e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
    const activeBudgets = budgets.filter(b => b.status === 'active').length;

    // ── Filtered Data ──
    const filteredInvoices = invoiceFilter === 'all' ? invoices : invoices.filter(i => i.status === invoiceFilter);
    const filteredExpenses = expenseCategoryFilter === 'all' ? expenses : expenses.filter(e => e.category === expenseCategoryFilter);

    // Expense summary by category
    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
        category: cat,
        total: expenses.filter(e => e.category === cat && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0),
    })).filter(c => c.total > 0);

    // ── Invoice CRUD ──
    const openNewInvoice = () => {
        setEditingInvoice(null);
        setInvForm({ clientId: clients[0]?.id || '', dueDate: '', taxRate: 0, discount: 0, currency: 'USD', notes: '', notesAr: '', items: [{ description: '', descriptionAr: '', quantity: 1, rate: 0 }] });
        setShowInvoiceModal(true);
    };
    const openEditInvoice = (inv: Invoice) => {
        setEditingInvoice(inv);
        setInvForm({
            clientId: inv.clientId,
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
            taxRate: inv.taxRate,
            discount: inv.discount,
            currency: inv.currency,
            notes: inv.notes,
            notesAr: inv.notesAr,
            items: inv.items.map(it => ({ description: it.description, descriptionAr: it.descriptionAr, quantity: it.quantity, rate: it.rate })),
        });
        setShowInvoiceModal(true);
    };
    const saveInvoice = async () => {
        const payload = {
            clientId: invForm.clientId,
            dueDate: invForm.dueDate,
            taxRate: invForm.taxRate,
            discount: invForm.discount,
            currency: invForm.currency,
            notes: invForm.notes,
            notesAr: invForm.notesAr,
            items: invForm.items.filter(it => it.description || it.rate),
        };
        if (editingInvoice) {
            await fetch(apiUrl(`/api/invoices/${editingInvoice.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetch(apiUrl('/api/invoices'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        setShowInvoiceModal(false);
        fetchData();
    };
    const deleteInvoice = async (id: string) => {
        await fetch(apiUrl(`/api/invoices/${id}`), { method: 'DELETE' });
        fetchData();
    };
    const markInvoiceSent = async (inv: Invoice) => {
        await fetch(apiUrl(`/api/invoices/${inv.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'sent' }) });
        fetchData();
    };

    // ── Payment ──
    const openPayment = (inv: Invoice) => {
        setPaymentInvoice(inv);
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        setPayForm({ amount: inv.total - paid, method: 'bank_transfer', reference: '', notes: '' });
        setShowPaymentModal(true);
    };
    const savePayment = async () => {
        if (!paymentInvoice) return;
        await fetch(apiUrl(`/api/invoices/${paymentInvoice.id}/payment`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payForm) });
        setShowPaymentModal(false);
        fetchData();
    };

    // ── Expense CRUD ──
    const openNewExpense = () => {
        setEditingExpense(null);
        setExpForm({ category: 'other', description: '', descriptionAr: '', amount: 0, date: new Date().toISOString().split('T')[0], clientId: '', status: 'pending' });
        setShowExpenseModal(true);
    };
    const openEditExpense = (exp: Expense) => {
        setEditingExpense(exp);
        setExpForm({
            category: exp.category,
            description: exp.description,
            descriptionAr: exp.descriptionAr,
            amount: exp.amount,
            date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
            clientId: exp.clientId || '',
            status: exp.status,
        });
        setShowExpenseModal(true);
    };
    const saveExpense = async () => {
        const payload = { ...expForm, amount: Number(expForm.amount) };
        if (editingExpense) {
            await fetch(apiUrl(`/api/expenses/${editingExpense.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetch(apiUrl('/api/expenses'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        setShowExpenseModal(false);
        fetchData();
    };
    const deleteExpense = async (id: string) => {
        await fetch(apiUrl(`/api/expenses/${id}`), { method: 'DELETE' });
        fetchData();
    };

    // ── Budget CRUD ──
    const openNewBudget = () => {
        setEditingBudget(null);
        setBudForm({ name: '', nameAr: '', allocated: 0, period: 'monthly', clientId: '', startDate: '', endDate: '', status: 'active' });
        setShowBudgetModal(true);
    };
    const openEditBudget = (bud: Budget) => {
        setEditingBudget(bud);
        setBudForm({
            name: bud.name,
            nameAr: bud.nameAr,
            allocated: bud.allocated,
            period: bud.period,
            clientId: bud.clientId || '',
            startDate: bud.startDate ? new Date(bud.startDate).toISOString().split('T')[0] : '',
            endDate: bud.endDate ? new Date(bud.endDate).toISOString().split('T')[0] : '',
            status: bud.status,
        });
        setShowBudgetModal(true);
    };
    const saveBudget = async () => {
        const payload = { ...budForm, allocated: Number(budForm.allocated) };
        if (editingBudget) {
            await fetch(apiUrl(`/api/budgets/${editingBudget.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetch(apiUrl('/api/budgets'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        setShowBudgetModal(false);
        fetchData();
    };
    const deleteBudget = async (id: string) => {
        await fetch(apiUrl(`/api/budgets/${id}`), { method: 'DELETE' });
        fetchData();
    };

    // ── Invoice form item helpers ──
    const addInvItem = () => setInvForm(f => ({ ...f, items: [...f.items, { description: '', descriptionAr: '', quantity: 1, rate: 0 }] }));
    const removeInvItem = (i: number) => setInvForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
    const updateInvItem = (i: number, field: string, val: any) => setInvForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));
    const invSubtotal = invForm.items.reduce((s, it) => s + it.quantity * it.rate, 0);
    const invTax = invForm.taxRate ? invSubtotal * (invForm.taxRate / 100) : 0;
    const invTotal = invSubtotal + invTax - (invForm.discount || 0);

    // ── Helpers ──
    const clientName = (cId: string | undefined, inv?: Invoice) => {
        if (inv?.client) return isRTL && inv.client.nameAr ? inv.client.nameAr : inv.client.name;
        const c = clients.find(c => c.id === cId);
        return c ? (isRTL && c.nameAr ? c.nameAr : c.name) : t.noClient;
    };
    const statusLabel = (status: string) => {
        const map: Record<string, string> = isRTL
            ? { draft: 'مسودة', sent: 'مرسلة', paid: 'مدفوعة', overdue: 'متأخرة', cancelled: 'ملغاة', viewed: 'شوهدت' }
            : { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled', viewed: 'Viewed' };
        return map[status] || status;
    };
    const expCatLabel = (cat: string) => (t.expense.categories as any)[cat] || cat;
    const periodLabel = (p: string) => {
        const map: Record<string, string> = { monthly: t.budget.monthly, quarterly: t.budget.quarterly, yearly: t.budget.yearly, project: t.budget.project };
        return map[p] || p;
    };
    const budStatusLabel = (s: string) => {
        const map: Record<string, string> = { active: t.budget.active, closed: t.budget.closed, exceeded: t.budget.exceeded };
        return map[s] || s;
    };
    const payMethodLabel = (m: string) => {
        const map: Record<string, string> = { bank_transfer: t.invoice.bankTransfer, cash: t.invoice.cash, card: t.invoice.card, cheque: t.invoice.cheque, other: t.invoice.other };
        return map[m] || m;
    };

    // ── Render ──
    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: BG, color: '#e2e8f0', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            {/* Header */}
            <header style={{ ...GLASS, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff' }}>R</div>
                    <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Remark</span>
                    <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>{t.title}</h1>
                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{t.subtitle}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link href="/" style={{ ...BTN_GHOST, textDecoration: 'none', fontSize: 12 }}>{isRTL ? '📋 التسويق' : '📋 Marketing'}</Link>
                    <Link href="/creative" style={{ ...BTN_GHOST, textDecoration: 'none', fontSize: 12 }}>{isRTL ? '🎨 الإبداعي' : '🎨 Creative'}</Link>
                    <button style={{ ...BTN_GHOST, fontSize: 16, padding: '6px 10px' }} onClick={toggleTheme}>🌙</button>
                    <button style={{ ...BTN_GHOST, fontSize: 16, padding: '6px 10px' }} onClick={toggleLang}>🌐</button>
                </div>
            </header>

            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24, ...GLASS_LIGHT, padding: 4, width: 'fit-content' }}>
                    {(['overview', 'invoices', 'expenses', 'budgets'] as const).map(tb => (
                        <button key={tb} onClick={() => setTab(tb)} style={{
                            background: tab === tb ? ACCENT : 'transparent', color: tab === tb ? '#fff' : '#94a3b8',
                            border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                        }}>
                            {t.tabs[tb]}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>{t.loading}</div>
                ) : (
                    <>
                        {/* ═══ KPI Cards ═══ */}
                        {(tab === 'overview' || tab === 'invoices') && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                                {[
                                    { label: t.kpi.revenue, value: formatCurrency(totalRevenue), color: '#22c55e', icon: '💰' },
                                    { label: t.kpi.expenses, value: formatCurrency(totalExpenses), color: '#ef4444', icon: '📉' },
                                    { label: t.kpi.profit, value: formatCurrency(netProfit), color: netProfit >= 0 ? '#22c55e' : '#ef4444', icon: '📊' },
                                    { label: t.kpi.pending, value: String(pendingInvoices), color: '#f59e0b', icon: '⏳' },
                                    { label: t.kpi.budgets, value: String(activeBudgets), color: ACCENT, icon: '📋' },
                                ].map((kpi, i) => (
                                    <div key={i} style={{ ...GLASS, padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ fontSize: 28 }}>{kpi.icon}</div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{kpi.label}</div>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ═══ OVERVIEW TAB ═══ */}
                        {tab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {/* Recent Invoices */}
                                <div style={{ ...GLASS, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.tabs.invoices}</h3>
                                        <button style={BTN} onClick={openNewInvoice}>{t.invoice.create}</button>
                                    </div>
                                    {invoices.slice(0, 5).map(inv => (
                                        <div key={inv.id} style={{ ...GLASS_LIGHT, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setTab('invoices'); }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.number}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{clientName(inv.clientId, inv)}</div>
                                            </div>
                                            <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(inv.total, inv.currency)}</div>
                                                <span style={BADGE(STATUS_COLORS[inv.status] || '#94a3b8')}>{statusLabel(inv.status)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {invoices.length === 0 && <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>{t.invoice.noInvoices}</div>}
                                </div>

                                {/* Expense by Category */}
                                <div style={{ ...GLASS, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.tabs.expenses}</h3>
                                        <button style={BTN} onClick={openNewExpense}>{t.expense.create}</button>
                                    </div>
                                    {expenseByCategory.map(ec => (
                                        <div key={ec.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 18 }}>{EXPENSE_ICONS[ec.category]}</span>
                                                <span style={{ fontSize: 13 }}>{expCatLabel(ec.category)}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b' }}>{formatCurrency(ec.total)}</span>
                                        </div>
                                    ))}
                                    {expenseByCategory.length === 0 && <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>{t.expense.noExpenses}</div>}
                                </div>

                                {/* Budget Tracker */}
                                <div style={{ ...GLASS, padding: 20, gridColumn: '1 / -1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.tabs.budgets}</h3>
                                        <button style={BTN} onClick={openNewBudget}>{t.budget.create}</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                                        {budgets.filter(b => b.status === 'active').map(bud => {
                                            const pct = bud.percentUsed;
                                            const barColor = pct > 90 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
                                            return (
                                                <div key={bud.id} style={{ ...GLASS_LIGHT, padding: 16 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{isRTL && bud.nameAr ? bud.nameAr : bud.name}</span>
                                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{periodLabel(bud.period)}</span>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 8 }}>
                                                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 6, transition: 'width 0.3s' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                                                        <span>{formatCurrency(bud.spent)} / {formatCurrency(bud.allocated)}</span>
                                                        <span style={{ color: barColor, fontWeight: 700 }}>{pct}%</span>
                                                    </div>
                                                    {pct > 80 && <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{t.budget.warning}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {budgets.filter(b => b.status === 'active').length === 0 && <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>{t.budget.noBudgets}</div>}
                                </div>
                            </div>
                        )}

                        {/* ═══ INVOICES TAB ═══ */}
                        {tab === 'invoices' && (
                            <div style={{ ...GLASS, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', gap: 4, ...GLASS_LIGHT, padding: 3 }}>
                                        {['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(st => (
                                            <button key={st} onClick={() => setInvoiceFilter(st)} style={{
                                                background: invoiceFilter === st ? (STATUS_COLORS[st] || ACCENT) : 'transparent',
                                                color: invoiceFilter === st ? '#fff' : '#94a3b8',
                                                border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                                            }}>
                                                {st === 'all' ? t.invoice.all : statusLabel(st)}
                                            </button>
                                        ))}
                                    </div>
                                    <button style={BTN} onClick={openNewInvoice}>{t.invoice.create}</button>
                                </div>

                                {/* Invoice Table */}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: '#94a3b8', fontWeight: 600 }}>{t.invoice.number}</th>
                                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: '#94a3b8', fontWeight: 600 }}>{t.invoice.client}</th>
                                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: '#94a3b8', fontWeight: 600 }}>{t.invoice.amount}</th>
                                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: '#94a3b8', fontWeight: 600 }}>{t.invoice.status}</th>
                                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: '#94a3b8', fontWeight: 600 }}>{t.invoice.dueDate}</th>
                                                <th style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 600 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInvoices.map(inv => {
                                                const paid = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                                                return (
                                                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td style={{ padding: '12px', fontWeight: 600 }}>{inv.number}</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <span style={{ marginInlineEnd: 6 }}>{inv.client?.avatar}</span>
                                                            {clientName(inv.clientId, inv)}
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            <div style={{ fontWeight: 600 }}>{formatCurrency(inv.total, inv.currency)}</div>
                                                            {paid > 0 && paid < inv.total && <div style={{ fontSize: 10, color: '#22c55e' }}>{t.invoice.paidAmount}: {formatCurrency(paid, inv.currency)}</div>}
                                                        </td>
                                                        <td style={{ padding: '12px' }}><span style={BADGE(STATUS_COLORS[inv.status] || '#94a3b8')}>{statusLabel(inv.status)}</span></td>
                                                        <td style={{ padding: '12px', fontSize: 12, color: '#94a3b8' }}>{formatDate(inv.dueDate)}</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                                <button style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11 }} onClick={() => openEditInvoice(inv)}>
                                                                    {t.invoice.edit}
                                                                </button>
                                                                {inv.status === 'draft' && (
                                                                    <button style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }} onClick={() => markInvoiceSent(inv)}>
                                                                        {t.invoice.markSent}
                                                                    </button>
                                                                )}
                                                                {(inv.status === 'sent' || inv.status === 'overdue') && (
                                                                    <button style={{ ...BTN, padding: '4px 10px', fontSize: 11 }} onClick={() => openPayment(inv)}>
                                                                        {t.invoice.recordPayment}
                                                                    </button>
                                                                )}
                                                                {inv.status === 'draft' && (
                                                                    <button style={{ ...BTN_DANGER, padding: '4px 10px', fontSize: 11 }} onClick={() => deleteInvoice(inv.id)}>
                                                                        {t.invoice.delete}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredInvoices.length === 0 && <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 40 }}>{t.invoice.noInvoices}</div>}
                            </div>
                        )}

                        {/* ═══ EXPENSES TAB ═══ */}
                        {tab === 'expenses' && (
                            <div>
                                {/* Category summary bar */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                                    {expenseByCategory.map(ec => (
                                        <div key={ec.category} style={{ ...GLASS, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: expenseCategoryFilter === ec.category ? 1 : 0.7 }} onClick={() => setExpenseCategoryFilter(expenseCategoryFilter === ec.category ? 'all' : ec.category)}>
                                            <span style={{ fontSize: 20 }}>{EXPENSE_ICONS[ec.category]}</span>
                                            <div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{expCatLabel(ec.category)}</div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b' }}>{formatCurrency(ec.total)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ ...GLASS, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.tabs.expenses}</h3>
                                        <button style={BTN} onClick={openNewExpense}>{t.expense.create}</button>
                                    </div>
                                    {filteredExpenses.map(exp => (
                                        <div key={exp.id} style={{ ...GLASS_LIGHT, padding: '14px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 22 }}>{EXPENSE_ICONS[exp.category] || '📦'}</span>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{isRTL && exp.descriptionAr ? exp.descriptionAr : exp.description}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{expCatLabel(exp.category)} &middot; {formatDate(exp.date)}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(exp.amount, exp.currency)}</div>
                                                    <span style={BADGE(exp.status === 'approved' ? '#22c55e' : exp.status === 'rejected' ? '#ef4444' : '#f59e0b')}>
                                                        {exp.status === 'approved' ? t.expense.approved : exp.status === 'rejected' ? t.expense.rejected : t.expense.pending}
                                                    </span>
                                                </div>
                                                <button style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11 }} onClick={() => openEditExpense(exp)}>{t.expense.edit}</button>
                                                <button style={{ ...BTN_DANGER, padding: '4px 10px', fontSize: 11 }} onClick={() => deleteExpense(exp.id)}>{t.expense.delete}</button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredExpenses.length === 0 && <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 40 }}>{t.expense.noExpenses}</div>}
                                </div>
                            </div>
                        )}

                        {/* ═══ BUDGETS TAB ═══ */}
                        {tab === 'budgets' && (
                            <div style={{ ...GLASS, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.tabs.budgets}</h3>
                                    <button style={BTN} onClick={openNewBudget}>{t.budget.create}</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                    {budgets.map(bud => {
                                        const pct = bud.percentUsed;
                                        const barColor = pct > 90 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
                                        const budStatusColor = bud.status === 'active' ? '#22c55e' : bud.status === 'exceeded' ? '#ef4444' : '#94a3b8';
                                        return (
                                            <div key={bud.id} style={{ ...GLASS_LIGHT, padding: 18 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{isRTL && bud.nameAr ? bud.nameAr : bud.name}</div>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <span style={BADGE(budStatusColor)}>{budStatusLabel(bud.status)}</span>
                                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{periodLabel(bud.period)}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11 }} onClick={() => openEditBudget(bud)}>{t.budget.edit}</button>
                                                        <button style={{ ...BTN_DANGER, padding: '4px 10px', fontSize: 11 }} onClick={() => deleteBudget(bud.id)}>{t.budget.delete}</button>
                                                    </div>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 12, overflow: 'hidden', marginBottom: 10 }}>
                                                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 6, transition: 'width 0.3s' }} />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                                                    <div>
                                                        <div style={{ color: '#94a3b8', marginBottom: 2 }}>{t.budget.allocated}</div>
                                                        <div style={{ fontWeight: 700 }}>{formatCurrency(bud.allocated)}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#94a3b8', marginBottom: 2 }}>{t.budget.spent}</div>
                                                        <div style={{ fontWeight: 700, color: barColor }}>{formatCurrency(bud.spent)}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#94a3b8', marginBottom: 2 }}>{t.budget.remaining}</div>
                                                        <div style={{ fontWeight: 700, color: bud.remaining >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(bud.remaining)}</div>
                                                    </div>
                                                </div>

                                                {pct > 80 && <div style={{ marginTop: 10, fontSize: 11, color: '#f59e0b', fontWeight: 600, background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: 8 }}>{t.budget.warning} ({pct}%)</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {budgets.length === 0 && <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 40 }}>{t.budget.noBudgets}</div>}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* ═══ MODALS ═══ */}

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div style={MODAL_OVERLAY} onClick={() => setShowInvoiceModal(false)}>
                    <div style={MODAL_BOX} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>{editingInvoice ? t.invoice.edit : t.invoice.create}</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.client}</label>
                                <select style={SELECT} value={invForm.clientId} onChange={e => setInvForm(f => ({ ...f, clientId: e.target.value }))}>
                                    <option value="">—</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.avatar} {isRTL && c.nameAr ? c.nameAr : c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.dueDate}</label>
                                <input type="date" style={INPUT} value={invForm.dueDate} onChange={e => setInvForm(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.currency}</label>
                                <select style={SELECT} value={invForm.currency} onChange={e => setInvForm(f => ({ ...f, currency: e.target.value }))}>
                                    {['USD', 'IQD', 'SAR', 'AED', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.tax}</label>
                                <input type="number" style={INPUT} value={invForm.taxRate} onChange={e => setInvForm(f => ({ ...f, taxRate: Number(e.target.value) }))} />
                            </div>
                        </div>

                        {/* Items */}
                        <h4 style={{ margin: '16px 0 10px', fontSize: 14, fontWeight: 600 }}>{t.invoice.items}</h4>
                        {invForm.items.map((item, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                                <div>
                                    {i === 0 && <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>{t.invoice.description}</label>}
                                    <input style={INPUT} placeholder={t.invoice.description} value={item.description} onChange={e => updateInvItem(i, 'description', e.target.value)} />
                                </div>
                                <div>
                                    {i === 0 && <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>{t.invoice.quantity}</label>}
                                    <input type="number" style={INPUT} value={item.quantity} onChange={e => updateInvItem(i, 'quantity', Number(e.target.value))} />
                                </div>
                                <div>
                                    {i === 0 && <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>{t.invoice.rate}</label>}
                                    <input type="number" style={INPUT} value={item.rate} onChange={e => updateInvItem(i, 'rate', Number(e.target.value))} />
                                </div>
                                <button style={{ ...BTN_DANGER, padding: '8px 12px' }} onClick={() => removeInvItem(i)}>✕</button>
                            </div>
                        ))}
                        <button style={{ ...BTN_GHOST, marginBottom: 16 }} onClick={addInvItem}>{t.invoice.addItem}</button>

                        {/* Totals */}
                        <div style={{ ...GLASS_LIGHT, padding: 14, marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                                <span style={{ color: '#94a3b8' }}>{t.invoice.subtotal}</span>
                                <span>{formatCurrency(invSubtotal, invForm.currency)}</span>
                            </div>
                            {invForm.taxRate > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                                    <span style={{ color: '#94a3b8' }}>{t.invoice.tax} ({invForm.taxRate}%)</span>
                                    <span>{formatCurrency(invTax, invForm.currency)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                                <span style={{ color: '#94a3b8' }}>{t.invoice.discount}</span>
                                <input type="number" style={{ ...INPUT, width: 120, textAlign: 'right' as const, padding: '4px 8px' }} value={invForm.discount} onChange={e => setInvForm(f => ({ ...f, discount: Number(e.target.value) }))} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, fontWeight: 700, fontSize: 16 }}>
                                <span>{t.invoice.total}</span>
                                <span style={{ color: ACCENT }}>{formatCurrency(invTotal, invForm.currency)}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.notes}</label>
                            <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical' as const }} value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button style={BTN_GHOST} onClick={() => setShowInvoiceModal(false)}>{t.invoice.cancel}</button>
                            <button style={BTN} onClick={saveInvoice}>{t.invoice.save}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && paymentInvoice && (
                <div style={MODAL_OVERLAY} onClick={() => setShowPaymentModal(false)}>
                    <div style={{ ...MODAL_BOX, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{t.invoice.recordPayment}</h2>
                        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8' }}>{paymentInvoice.number} — {formatCurrency(paymentInvoice.total, paymentInvoice.currency)}</p>

                        <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.paymentAmount}</label>
                                <input type="number" style={INPUT} value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.paymentMethod}</label>
                                <select style={SELECT} value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{payMethodLabel(m)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.paymentRef}</label>
                                <input style={INPUT} value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.notes}</label>
                                <textarea style={{ ...INPUT, minHeight: 50, resize: 'vertical' as const }} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button style={BTN_GHOST} onClick={() => setShowPaymentModal(false)}>{t.invoice.cancel}</button>
                            <button style={BTN} onClick={savePayment}>{t.invoice.save}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div style={MODAL_OVERLAY} onClick={() => setShowExpenseModal(false)}>
                    <div style={{ ...MODAL_BOX, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>{editingExpense ? t.expense.edit : t.expense.create}</h2>

                        <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.expense.category}</label>
                                <select style={SELECT} value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{EXPENSE_ICONS[c]} {expCatLabel(c)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.expense.description}</label>
                                <input style={INPUT} value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.expense.amount}</label>
                                    <input type="number" style={INPUT} value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: Number(e.target.value) }))} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.expense.date}</label>
                                    <input type="date" style={INPUT} value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.client}</label>
                                <select style={SELECT} value={expForm.clientId} onChange={e => setExpForm(f => ({ ...f, clientId: e.target.value }))}>
                                    <option value="">— {t.noClient} —</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.avatar} {isRTL && c.nameAr ? c.nameAr : c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.expense.status}</label>
                                <select style={SELECT} value={expForm.status} onChange={e => setExpForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="pending">{t.expense.pending}</option>
                                    <option value="approved">{t.expense.approved}</option>
                                    <option value="rejected">{t.expense.rejected}</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button style={BTN_GHOST} onClick={() => setShowExpenseModal(false)}>{t.expense.cancel}</button>
                            <button style={BTN} onClick={saveExpense}>{t.expense.save}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Budget Modal */}
            {showBudgetModal && (
                <div style={MODAL_OVERLAY} onClick={() => setShowBudgetModal(false)}>
                    <div style={{ ...MODAL_BOX, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>{editingBudget ? t.budget.edit : t.budget.create}</h2>

                        <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.name}</label>
                                <input style={INPUT} value={budForm.name} onChange={e => setBudForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.name} ({isRTL ? 'EN' : 'AR'})</label>
                                <input style={INPUT} value={budForm.nameAr} onChange={e => setBudForm(f => ({ ...f, nameAr: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.allocated}</label>
                                    <input type="number" style={INPUT} value={budForm.allocated} onChange={e => setBudForm(f => ({ ...f, allocated: Number(e.target.value) }))} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.period}</label>
                                    <select style={SELECT} value={budForm.period} onChange={e => setBudForm(f => ({ ...f, period: e.target.value }))}>
                                        {PERIOD_OPTIONS.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.invoice.client}</label>
                                <select style={SELECT} value={budForm.clientId} onChange={e => setBudForm(f => ({ ...f, clientId: e.target.value }))}>
                                    <option value="">— {t.noClient} —</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.avatar} {isRTL && c.nameAr ? c.nameAr : c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.startDate}</label>
                                    <input type="date" style={INPUT} value={budForm.startDate} onChange={e => setBudForm(f => ({ ...f, startDate: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.endDate}</label>
                                    <input type="date" style={INPUT} value={budForm.endDate} onChange={e => setBudForm(f => ({ ...f, endDate: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>{t.budget.status}</label>
                                <select style={SELECT} value={budForm.status} onChange={e => setBudForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="active">{t.budget.active}</option>
                                    <option value="closed">{t.budget.closed}</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button style={BTN_GHOST} onClick={() => setShowBudgetModal(false)}>{t.budget.cancel}</button>
                            <button style={BTN} onClick={saveBudget}>{t.budget.save}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
