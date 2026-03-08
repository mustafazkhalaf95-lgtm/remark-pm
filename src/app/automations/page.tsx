'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';

interface AutomationRule {
    id: string;
    name: string;
    description?: string;
    trigger: string;
    triggerConfig: string;
    actions: string;
    enabled: boolean;
    createdAt: string;
}

const TRIGGER_ICONS: Record<string, string> = { FIELD_CHANGE: '🔄', CARD_MOVE: '📋', CARD_CREATE: '➕', DUE_DATE: '⏰', SCHEDULE: '📅' };
const TRIGGER_LABELS: Record<string, string> = { FIELD_CHANGE: 'تغيير حقل', CARD_MOVE: 'نقل بطاقة', CARD_CREATE: 'إنشاء بطاقة', DUE_DATE: 'تاريخ الاستحقاق', SCHEDULE: 'جدول زمني' };
const ACTION_ICONS: Record<string, string> = { MIRROR: '🪞', NOTIFY: '🔔', MOVE: '📤', ASSIGN: '👤', SET_FIELD: '🏷️', CREATE_PHASES: '🔗', ADVANCE_PHASE: '⏭️' };
const ACTION_LABELS: Record<string, string> = { MIRROR: 'نسخ مرآة', NOTIFY: 'إرسال إشعار', MOVE: 'نقل لقائمة', ASSIGN: 'تعيين مسؤول', SET_FIELD: 'تعيين حقل', CREATE_PHASES: 'إنشاء مراحل', ADVANCE_PHASE: 'تقديم مرحلة' };

export default function AutomationsPage() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [expandedRule, setExpandedRule] = useState<string | null>(null);
    const [showNewRule, setShowNewRule] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', description: '', trigger: 'FIELD_CHANGE', triggerConfig: '{}', actions: '[]' });

    useEffect(() => {
        fetch('/api/automations').then(r => r.json()).then(data => {
            setRules(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    }, []);

    const toggleRule = async (id: string, enabled: boolean) => {
        await fetch(`/api/automations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled }),
        });
        setRules(rules.map(r => r.id === id ? { ...r, enabled } : r));
    };

    const deleteRule = async (id: string) => {
        if (!confirm('هل تريد حذف هذه القاعدة؟')) return;
        await fetch(`/api/automations/${id}`, { method: 'DELETE' });
        setRules(rules.filter(r => r.id !== id));
    };

    const seedRules = async () => {
        setSeeding(true);
        const res = await fetch('/api/automations/seed', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            const rulesRes = await fetch('/api/automations');
            setRules(await rulesRes.json());
        }
        setSeeding(false);
    };

    const createRule = async () => {
        if (!newRule.name) return;
        try {
            const res = await fetch('/api/automations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newRule.name,
                    description: newRule.description,
                    trigger: newRule.trigger,
                    triggerConfig: JSON.parse(newRule.triggerConfig),
                    actions: JSON.parse(newRule.actions),
                }),
            });
            if (res.ok) {
                const rule = await res.json();
                setRules([...rules, rule]);
                setShowNewRule(false);
                setNewRule({ name: '', description: '', trigger: 'FIELD_CHANGE', triggerConfig: '{}', actions: '[]' });
            }
        } catch (e) { alert('خطأ في JSON'); }
    };

    const parseJson = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };

    return (
        <AppLayout>
            <div className="p-6 overflow-y-auto h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg shadow-lg">⚡</span>
                            نظام الأتمتة
                        </h1>
                        <p className="text-sm text-white/40 mt-1">قواعد تلقائية مبنية على سير عمل Placker</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={seedRules} disabled={seeding}
                            className="px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-bold hover:bg-violet-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
                            {seeding ? <span className="w-4 h-4 border-t-2 border-violet-400 rounded-full animate-spin" /> : '🔄'}
                            إعادة تحميل قواعد Placker
                        </button>
                        <button onClick={() => setShowNewRule(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all flex items-center gap-2">
                            + قاعدة جديدة
                        </button>
                    </div>
                </div>

                {/* Workflow Pipeline Visualization */}
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-6">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">📊 خط سير العمل — Placker Pipeline</div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                        {[
                            { label: 'بريف', icon: '📝', color: 'from-blue-500 to-cyan-500', desc: 'إنشاء البريف' },
                            { label: 'تعيين المحتوى', icon: '🏷️', color: 'from-cyan-500 to-teal-500', desc: 'فيديو / تصميم' },
                            { label: 'الإنتاج', icon: '🎬', color: 'from-teal-500 to-emerald-500', desc: 'تصوير / تصميم / مونتاج' },
                            { label: 'مراجعة داخلية', icon: '👁️', color: 'from-emerald-500 to-green-500', desc: 'Creative Review' },
                            { label: 'مراجعة CEO/COO', icon: '👑', color: 'from-amber-500 to-orange-500', desc: 'مراجعة إدارية' },
                            { label: 'موافقة العميل', icon: '✅', color: 'from-green-500 to-lime-500', desc: 'Final Review' },
                            { label: 'النشر', icon: '📅', color: 'from-violet-500 to-purple-500', desc: 'Publish & Schedule' },
                        ].map((step, i, arr) => (
                            <div key={i} className="flex items-center gap-1 flex-shrink-0">
                                <div className="relative group">
                                    <div className={`w-32 h-20 rounded-xl bg-gradient-to-br ${step.color} bg-opacity-20 border border-white/10 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all cursor-pointer`}
                                        style={{ background: `linear-gradient(135deg, var(--tw-gradient-from) / 0.15, var(--tw-gradient-to) / 0.15)` }}>
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-sm shadow-lg`}>{step.icon}</div>
                                        <div className="text-[10px] font-bold text-white/80 text-center leading-tight">{step.label}</div>
                                    </div>
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-white/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{step.desc}</div>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="flex items-center gap-0.5 text-white/20 flex-shrink-0">
                                        <div className="w-3 h-px bg-white/20" />
                                        <span className="text-[10px]">→</span>
                                        <div className="w-3 h-px bg-white/20" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'إجمالي القواعد', value: rules.length, icon: '📊', color: 'violet' },
                        { label: 'مُفعّلة', value: rules.filter(r => r.enabled).length, icon: '✅', color: 'emerald' },
                        { label: 'معطّلة', value: rules.filter(r => !r.enabled).length, icon: '⏸️', color: 'red' },
                        { label: 'أنواع المشغلات', value: new Set(rules.map(r => r.trigger)).size, icon: '⚡', color: 'amber' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{stat.icon}</div>
                                <div>
                                    <div className={`text-xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                                    <div className="text-[10px] text-white/40">{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* New Rule Form */}
                {showNewRule && (
                    <div className="bg-white/[0.03] border border-violet-500/20 rounded-2xl p-6 mb-6 animate-fade-in-up">
                        <div className="text-sm font-bold text-white mb-4">➕ قاعدة أتمتة جديدة</div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">الاسم</label>
                                <input className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                                    value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="اسم القاعدة" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">نوع المشغل</label>
                                <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                                    value={newRule.trigger} onChange={e => setNewRule({ ...newRule, trigger: e.target.value })}>
                                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-[#121323]">{v}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">الوصف</label>
                            <input className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                                value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })} placeholder="وصف القاعدة" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">إعدادات المشغل (JSON)</label>
                                <textarea className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-emerald-300 font-mono placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" rows={4} dir="ltr"
                                    value={newRule.triggerConfig} onChange={e => setNewRule({ ...newRule, triggerConfig: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">الإجراءات (JSON)</label>
                                <textarea className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-emerald-300 font-mono placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" rows={4} dir="ltr"
                                    value={newRule.actions} onChange={e => setNewRule({ ...newRule, actions: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={createRule} className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold transition-all">إنشاء القاعدة</button>
                            <button onClick={() => setShowNewRule(false)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white transition-all">إلغاء</button>
                        </div>
                    </div>
                )}

                {/* Rules List */}
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-white/30">
                        <div className="w-6 h-6 border-t-2 border-violet-400 rounded-full animate-spin mr-3" />
                        <span>جاري التحميل...</span>
                    </div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-20 text-white/30">
                        <div className="text-6xl mb-4">⚡</div>
                        <div className="text-lg font-bold mb-2">لا توجد قواعد أتمتة</div>
                        <div className="text-sm mb-6">اضغط "إعادة تحميل قواعد Placker" لإضافة القواعد التلقائية</div>
                        <button onClick={seedRules} disabled={seeding}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg transition-all">
                            {seeding ? '⏳ جاري التحميل...' : '🔄 تحميل قواعد Placker'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rules.map(rule => {
                            const config = parseJson(rule.triggerConfig);
                            const actions = parseJson(rule.actions);
                            const isExpanded = expandedRule === rule.id;
                            const actionsArr = Array.isArray(actions) ? actions : [];

                            return (
                                <div key={rule.id}
                                    className={`bg-white/[0.03] border rounded-2xl transition-all ${rule.enabled ? 'border-white/5 hover:border-violet-500/20' : 'border-white/[0.02] opacity-60'}`}>
                                    {/* Rule Header */}
                                    <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpandedRule(isExpanded ? null : rule.id)}>
                                        {/* Toggle */}
                                        <button onClick={e => { e.stopPropagation(); toggleRule(rule.id, !rule.enabled); }}
                                            className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${rule.enabled ? 'bg-violet-500' : 'bg-white/10'}`}>
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${rule.enabled ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>

                                        {/* Trigger icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${rule.enabled ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/5 border border-white/10'}`}>
                                            {TRIGGER_ICONS[rule.trigger] || '⚡'}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white/90 text-sm truncate">{rule.name}</div>
                                            <div className="text-xs text-white/40 mt-0.5 truncate">{rule.description || '—'}</div>
                                        </div>

                                        {/* Trigger badge */}
                                        <div className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold flex-shrink-0">
                                            {TRIGGER_LABELS[rule.trigger] || rule.trigger}
                                        </div>

                                        {/* Action badges */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            {actionsArr.map((a: any, i: number) => (
                                                <span key={i} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs" title={ACTION_LABELS[a.type] || a.type}>
                                                    {ACTION_ICONS[a.type] || '⚙️'}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Expand */}
                                        <span className={`text-white/30 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                                            {/* Trigger Config */}
                                            <div>
                                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">إعدادات المشغل</div>
                                                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-3">
                                                    {Object.entries(config).map(([key, val]) => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <span className="text-[10px] text-white/30 font-mono">{key}:</span>
                                                            <span className="text-xs text-amber-400 font-mono">{String(val)}</span>
                                                        </div>
                                                    ))}
                                                    {Object.keys(config).length === 0 && <span className="text-xs text-white/20 italic">لا توجد شروط إضافية</span>}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div>
                                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">الإجراءات ({actionsArr.length})</div>
                                                <div className="space-y-2">
                                                    {actionsArr.map((action: any, i: number) => (
                                                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm flex-shrink-0">
                                                                {ACTION_ICONS[action.type] || '⚙️'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-bold text-white/80">{ACTION_LABELS[action.type] || action.type}</div>
                                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                                    {Object.entries(action).filter(([k]) => k !== 'type').map(([key, val]) => (
                                                                        <span key={key} className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] text-white/40 font-mono">
                                                                            {key}: {typeof val === 'object' ? (Array.isArray(val) ? `[${(val as any[]).length} عنصر]` : JSON.stringify(val).slice(0, 40)) : String(val)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Delete */}
                                            <div className="flex justify-end">
                                                <button onClick={() => deleteRule(rule.id)}
                                                    className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                                                    🗑️ حذف القاعدة
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
