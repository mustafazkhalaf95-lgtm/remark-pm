'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';

interface TableInfo { name: string; count: number }
interface ColumnInfo { cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }
interface CustomField { id: string; name: string; displayName: string; fieldType: string; options: string; position: number; boardFields: { board: { id: string; name: string; color: string } }[]; _count: { values: number } }

export default function AdminPage() {
    const { data: session, status } = useSession();
    const userRole = (session?.user as any)?.role;
    const isDev = process.env.NODE_ENV !== 'production';

    // SQL Console
    const [sqlQuery, setSqlQuery] = useState('SELECT * FROM Card LIMIT 20');
    const [sqlResult, setSqlResult] = useState<any>(null);
    const [sqlError, setSqlError] = useState('');
    const [sqlLoading, setSqlLoading] = useState(false);
    const [sqlHistory, setSqlHistory] = useState<string[]>([]);

    // DB Explorer
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [tableRowCount, setTableRowCount] = useState(0);

    // Custom Fields
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [boards, setBoards] = useState<{ id: string; name: string; color: string }[]>([]);
    const [newField, setNewField] = useState({ name: '', displayName: '', fieldType: 'TEXT', options: '' as string, boardIds: [] as string[] });
    const [showNewField, setShowNewField] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);

    // Active tab
    const [activeTab, setActiveTab] = useState<'sql' | 'explorer' | 'fields'>('explorer');

    // Workspaces
    const [workspaceId, setWorkspaceId] = useState('');

    // Load tables on mount
    useEffect(() => {
        fetch('/api/admin/sql?action=stats')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.stats) setTables(data.stats); })
            .catch(() => { });
    }, []);

    // Get workspace
    useEffect(() => {
        fetch('/api/workspaces')
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setWorkspaceId(data[0].id);
                    // Fetch boards
                    fetch(`/api/boards?workspaceId=${data[0].id}`)
                        .then(r => r.ok ? r.json() : [])
                        .then(b => setBoards(Array.isArray(b) ? b : []));
                }
            });
    }, []);

    // Load custom fields when workspace changes
    useEffect(() => {
        if (!workspaceId) return;
        fetch(`/api/admin/fields?workspaceId=${workspaceId}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setCustomFields(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [workspaceId]);

    const executeSql = async () => {
        if (!sqlQuery.trim()) return;
        setSqlLoading(true);
        setSqlError('');
        setSqlResult(null);

        try {
            const res = await fetch('/api/admin/sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: sqlQuery }),
            });
            const data = await res.json();
            if (data.success) {
                setSqlResult(data);
                setSqlHistory(prev => [sqlQuery, ...prev.filter(q => q !== sqlQuery)].slice(0, 20));
            } else {
                setSqlError(data.error || 'Query failed');
            }
        } catch (e: any) {
            setSqlError(e.message);
        }
        setSqlLoading(false);
    };

    const loadTableSchema = async (tableName: string) => {
        setSelectedTable(tableName);
        const [schemaRes, dataRes] = await Promise.all([
            fetch(`/api/admin/sql?action=schema&table=${tableName}`),
            fetch('/api/admin/sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `SELECT * FROM "${tableName}" LIMIT 50`, type: 'query' }),
            }),
        ]);
        const schemaData = await schemaRes.json();
        const tableDataResult = await dataRes.json();

        setTableSchema(schemaData.columns || []);
        setTableRowCount(Number(schemaData.rowCount) || 0);
        setTableData(tableDataResult.data || []);
    };

    const createField = async () => {
        if (!newField.name || !newField.displayName || !workspaceId) return;
        const body: any = {
            workspaceId,
            name: newField.name,
            displayName: newField.displayName,
            fieldType: newField.fieldType,
            boardIds: newField.boardIds,
        };
        if (newField.fieldType === 'LIST' && newField.options) {
            body.options = newField.options.split(',').map(o => o.trim()).filter(Boolean);
        }
        await fetch('/api/admin/fields', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        setShowNewField(false);
        setNewField({ name: '', displayName: '', fieldType: 'TEXT', options: '', boardIds: [] });
        // Reload
        const res = await fetch(`/api/admin/fields?workspaceId=${workspaceId}`);
        setCustomFields(await res.json());
    };

    const deleteField = async (fieldId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحقل؟')) return;
        await fetch(`/api/admin/fields?fieldId=${fieldId}`, { method: 'DELETE' });
        setCustomFields(prev => prev.filter(f => f.id !== fieldId));
    };

    // Show loading while session is being fetched
    if (status === 'loading') {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full" style={{ background: '#0a0b14', minHeight: 'calc(100vh - 60px)' }}>
                    <div className="text-center text-white/50">
                        <div className="w-8 h-8 border-t-2 border-amber-400 rounded-full animate-spin mx-auto mb-4" />
                        <div className="text-sm">جارٍ التحميل...</div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // In dev mode, bypass role check (no active session). In production, require CEO/COO.
    if (!isDev && userRole !== 'CEO' && userRole !== 'COO') {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full" style={{ background: '#0a0b14', minHeight: 'calc(100vh - 60px)' }}>
                    <div className="text-center text-white/50">
                        <div className="text-5xl mb-4">🔒</div>
                        <div className="text-lg font-bold">لا يمكنك الوصول</div>
                        <div className="text-sm mt-2">هذه الصفحة متاحة فقط لـ CEO و COO</div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 overflow-y-auto h-full" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #1a1b2e 50%, #0d0e1b 100%)', minHeight: 'calc(100vh - 60px)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg shadow-lg">⚙️</span>
                            إدارة قاعدة البيانات
                        </h1>
                        <p className="text-sm text-white/40 mt-1">تحكم كامل بالجداول والحقول المخصصة</p>
                    </div>
                    {/* DB Stats */}
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70">
                            <span className="text-white/40 ml-2">الجداول:</span>
                            <span className="font-bold text-amber-400">{tables.length}</span>
                        </div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70">
                            <span className="text-white/40 ml-2">السجلات:</span>
                            <span className="font-bold text-emerald-400">{tables.reduce((s, t) => s + t.count, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    {([
                        { key: 'explorer', label: '📊 مستكشف البيانات', desc: 'تصفح الجداول' },
                        { key: 'sql', label: '💻 SQL Console', desc: 'استعلامات مباشرة' },
                        { key: 'fields', label: '🏷️ حقول مخصصة', desc: 'إضافة حقول للبطاقات' },
                    ] as const).map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 p-4 rounded-2xl border transition-all text-right ${activeTab === tab.key ? 'bg-white/[0.06] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                            <div className="text-sm font-bold text-white/90">{tab.label}</div>
                            <div className="text-xs text-white/40 mt-0.5">{tab.desc}</div>
                        </button>
                    ))}
                </div>

                {/* ==================== DB EXPLORER ==================== */}
                {activeTab === 'explorer' && (
                    <div className="flex gap-6">
                        {/* Tables list */}
                        <div className="w-64 flex-shrink-0">
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-white/5">
                                    <div className="text-xs font-bold text-white/40 uppercase tracking-wider">الجداول ({tables.length})</div>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                                    {tables.map(t => (
                                        <button key={t.name} onClick={() => loadTableSchema(t.name)}
                                            className={`w-full px-4 py-3 flex items-center justify-between text-sm transition-all hover:bg-white/5 ${selectedTable === t.name ? 'bg-amber-500/10 border-r-2 border-r-amber-500' : ''}`}>
                                            <span className={`font-medium truncate text-right ${selectedTable === t.name ? 'text-amber-400' : 'text-white/70'}`}>{t.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-bold flex-shrink-0">{t.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table detail */}
                        <div className="flex-1 min-w-0">
                            {selectedTable ? (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{selectedTable}</h2>
                                            <span className="text-xs text-white/40">{tableRowCount} سجل · {tableSchema.length} عمود</span>
                                        </div>
                                        <button onClick={() => { setSqlQuery(`SELECT * FROM "${selectedTable}" LIMIT 50`); setActiveTab('sql'); }}
                                            className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all">
                                            فتح في SQL Console →
                                        </button>
                                    </div>

                                    {/* Schema */}
                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                                        <div className="p-4 border-b border-white/5">
                                            <div className="text-xs font-bold text-white/40 uppercase tracking-wider">هيكل الجدول</div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-white/5">
                                                        <th className="text-right px-4 py-3 text-xs font-bold text-white/40">الاسم</th>
                                                        <th className="text-right px-4 py-3 text-xs font-bold text-white/40">النوع</th>
                                                        <th className="text-right px-4 py-3 text-xs font-bold text-white/40">مطلوب</th>
                                                        <th className="text-right px-4 py-3 text-xs font-bold text-white/40">مفتاح</th>
                                                        <th className="text-right px-4 py-3 text-xs font-bold text-white/40">القيمة الافتراضية</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tableSchema.map(col => (
                                                        <tr key={col.cid} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-4 py-2.5 font-mono text-amber-400 text-xs">{col.name}</td>
                                                            <td className="px-4 py-2.5 font-mono text-violet-400 text-xs">{col.type || 'TEXT'}</td>
                                                            <td className="px-4 py-2.5 text-xs">{col.notnull ? <span className="text-red-400">✓</span> : <span className="text-white/20">—</span>}</td>
                                                            <td className="px-4 py-2.5 text-xs">{col.pk ? <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">PK</span> : <span className="text-white/20">—</span>}</td>
                                                            <td className="px-4 py-2.5 font-mono text-xs text-white/40">{col.dflt_value ?? '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Data preview */}
                                    {tableData.length > 0 && (
                                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                                            <div className="p-4 border-b border-white/5">
                                                <div className="text-xs font-bold text-white/40 uppercase tracking-wider">معاينة البيانات (أول 50)</div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-white/5">
                                                            {Object.keys(tableData[0]).map(key => (
                                                                <th key={key} className="text-right px-3 py-2 text-white/40 font-bold whitespace-nowrap">{key}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tableData.slice(0, 20).map((row, i) => (
                                                            <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                                                                {Object.values(row).map((val: any, j) => (
                                                                    <td key={j} className="px-3 py-2 text-white/70 whitespace-nowrap max-w-[200px] truncate font-mono">
                                                                        {val === null ? <span className="text-white/20 italic">NULL</span> : String(val)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-white/30">
                                    <div className="text-center">
                                        <div className="text-4xl mb-4">📊</div>
                                        <div className="text-sm">اختر جدولاً من القائمة لعرض تفاصيله</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ==================== SQL CONSOLE ==================== */}
                {activeTab === 'sql' && (
                    <div className="space-y-4">
                        {/* Query Editor */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <div className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SQL Console
                                </div>
                                <div className="flex gap-2">
                                    {/* Quick queries */}
                                    {[
                                        { label: 'Users', q: 'SELECT id, name, email, role FROM User' },
                                        { label: 'Cards', q: 'SELECT c.id, c.name, c.status, c.priority, c.currentPhase, l.name as listName FROM Card c JOIN List l ON c.listId = l.id LIMIT 50' },
                                        { label: 'Boards', q: 'SELECT id, name, color, boardType FROM Board' },
                                        { label: 'Custom Fields', q: 'SELECT * FROM CustomField' },
                                        { label: 'Phases', q: 'SELECT tp.id, tp.phase, tp.status, tp.deadline, u.name as assignee FROM TaskPhase tp LEFT JOIN User u ON tp.assigneeId = u.id' },
                                    ].map(q => (
                                        <button key={q.label} onClick={() => setSqlQuery(q.q)}
                                            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/50 hover:text-white hover:bg-white/10 transition-all">
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                className="w-full bg-transparent p-4 text-sm text-emerald-300 font-mono focus:outline-none resize-none placeholder-white/20"
                                rows={5}
                                value={sqlQuery}
                                onChange={e => setSqlQuery(e.target.value)}
                                placeholder="اكتب استعلام SQL هنا..."
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) executeSql(); }}
                                dir="ltr"
                            />
                            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.01]">
                                <span className="text-[10px] text-white/30">Ctrl+Enter للتنفيذ · SQLite</span>
                                <button onClick={executeSql} disabled={sqlLoading}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {sqlLoading ? <span className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" /> : '▶'}
                                    تنفيذ
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {sqlError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-mono" dir="ltr">
                                ❌ {sqlError}
                            </div>
                        )}

                        {/* Results */}
                        {sqlResult && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                    <div className="text-xs text-white/40">
                                        {sqlResult.type === 'query' ? `✅ تم إرجاع ${sqlResult.rowCount} سجل` : `✅ تم تعديل ${sqlResult.affectedRows} سجل`}
                                    </div>
                                </div>
                                {sqlResult.type === 'query' && Array.isArray(sqlResult.data) && sqlResult.data.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    {Object.keys(sqlResult.data[0]).map(key => (
                                                        <th key={key} className="text-left px-3 py-2 text-white/40 font-bold whitespace-nowrap font-mono">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sqlResult.data.map((row: any, i: number) => (
                                                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                                                        {Object.values(row).map((val: any, j: number) => (
                                                            <td key={j} className="px-3 py-2 text-white/70 whitespace-nowrap max-w-[300px] truncate font-mono">
                                                                {val === null ? <span className="text-white/20 italic">NULL</span> : String(val)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History */}
                        {sqlHistory.length > 0 && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">السجل</div>
                                <div className="flex flex-col gap-1">
                                    {sqlHistory.map((q, i) => (
                                        <button key={i} onClick={() => setSqlQuery(q)}
                                            className="w-full px-3 py-2 rounded-xl text-xs font-mono text-white/50 hover:text-emerald-400 hover:bg-white/5 transition-all text-left truncate" dir="ltr">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== CUSTOM FIELDS ==================== */}
                {activeTab === 'fields' && (
                    <div className="space-y-6">
                        {/* Quick add SQL fields */}
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-lg font-bold text-white">🏷️ حقول مخصصة للبطاقات</div>
                                    <div className="text-xs text-white/40 mt-1">أضف حقولاً جديدة تظهر في كل بطاقة مهمة — مثل: حالة العميل، رابط التسليم، تقييم الجودة</div>
                                </div>
                                <button onClick={() => setShowNewField(true)}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center gap-2">
                                    + إضافة حقل
                                </button>
                            </div>

                            {/* New field form */}
                            {showNewField && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-4 animate-fade-in-up">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">الاسم الداخلي (eng)</label>
                                            <input className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50" dir="ltr"
                                                placeholder="client_status" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">اسم العرض</label>
                                            <input className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                                                placeholder="حالة العميل" value={newField.displayName} onChange={e => setNewField({ ...newField, displayName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">نوع الحقل</label>
                                            <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                                                value={newField.fieldType} onChange={e => setNewField({ ...newField, fieldType: e.target.value })}>
                                                <option value="TEXT" className="bg-[#121323]">📝 نص</option>
                                                <option value="NUMBER" className="bg-[#121323]">🔢 رقم</option>
                                                <option value="DATE" className="bg-[#121323]">📅 تاريخ</option>
                                                <option value="LIST" className="bg-[#121323]">📋 قائمة اختيارات</option>
                                            </select>
                                        </div>
                                        {newField.fieldType === 'LIST' && (
                                            <div>
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">الخيارات (مفصولة بفاصلة)</label>
                                                <input className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                                                    placeholder="مكتمل, قيد المراجعة, مرفوض" value={newField.options} onChange={e => setNewField({ ...newField, options: e.target.value })} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Board selection */}
                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">ربط باللوحات</label>
                                        <div className="flex flex-wrap gap-2">
                                            {boards.map(b => (
                                                <button key={b.id}
                                                    onClick={() => setNewField({ ...newField, boardIds: newField.boardIds.includes(b.id) ? newField.boardIds.filter(id => id !== b.id) : [...newField.boardIds, b.id] })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${newField.boardIds.includes(b.id) ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'}`}>
                                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: b.color }} />
                                                    {b.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-5">
                                        <button onClick={createField} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold transition-all">إنشاء الحقل</button>
                                        <button onClick={() => setShowNewField(false)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white transition-all">إلغاء</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Existing fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customFields.map(field => {
                                const options = JSON.parse(field.options || '[]');
                                const typeIcons: Record<string, string> = { TEXT: '📝', NUMBER: '🔢', DATE: '📅', LIST: '📋' };
                                const typeLabels: Record<string, string> = { TEXT: 'نص', NUMBER: 'رقم', DATE: 'تاريخ', LIST: 'قائمة' };
                                return (
                                    <div key={field.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">{typeIcons[field.fieldType] || '📝'}</div>
                                                <div>
                                                    <div className="font-bold text-white/90 text-sm">{field.displayName}</div>
                                                    <div className="text-[10px] text-white/30 font-mono mt-0.5">{field.name}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteField(field.id)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                                🗑️
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold">{typeLabels[field.fieldType]}</span>
                                            <span className="text-[10px] text-white/30">{field._count.values} قيمة</span>
                                        </div>

                                        {field.fieldType === 'LIST' && options.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {options.map((opt: any, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-lg bg-white/5 text-white/50 text-[10px]">{typeof opt === 'object' ? (opt.label || opt.value || JSON.stringify(opt)) : String(opt)}</span>
                                                ))}
                                            </div>
                                        )}

                                        {field.boardFields.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {field.boardFields.map(bf => (
                                                    <span key={bf.board.id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 text-white/40 text-[10px]">
                                                        <span className="w-2 h-2 rounded-sm" style={{ background: bf.board.color }} />
                                                        {bf.board.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {customFields.length === 0 && !showNewField && (
                                <div className="col-span-full text-center py-16 text-white/30">
                                    <div className="text-5xl mb-4">🏷️</div>
                                    <div className="text-sm">لا توجد حقول مخصصة بعد</div>
                                    <div className="text-xs mt-2 text-white/20">اضغط "إضافة حقل" لإنشاء حقل جديد للبطاقات</div>
                                </div>
                            )}
                        </div>

                        {/* Quick SQL snippets for card fields */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                            <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">⚡ أوامر SQL سريعة</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { label: 'عرض جميع الحقول المخصصة', query: 'SELECT cf.id, cf.name, cf.displayName, cf.fieldType, cf.options FROM CustomField cf' },
                                    { label: 'عرض قيم الحقول للبطاقات', query: 'SELECT c.name as card, cf.displayName as field, cfv.value FROM CardFieldValue cfv JOIN Card c ON cfv.cardId = c.id JOIN CustomField cf ON cfv.fieldId = cf.id' },
                                    { label: 'عرض البطاقات مع الحالة والأولوية', query: 'SELECT c.name, c.status, c.priority, c.currentPhase, l.name as list FROM Card c JOIN List l ON c.listId = l.id WHERE c.closed = 0' },
                                    { label: 'إحصائيات البطاقات حسب الأولوية', query: 'SELECT priority, COUNT(*) as count FROM Card WHERE closed = 0 GROUP BY priority' },
                                    { label: 'البطاقات المتأخرة', query: "SELECT c.name, c.dueDate, l.name as list FROM Card c JOIN List l ON c.listId = l.id WHERE c.dueDate < datetime('now') AND c.dueComplete = 0 AND c.closed = 0" },
                                    { label: 'المراحل النشطة', query: "SELECT tp.phase, tp.status, u.name as assignee, c.name as card FROM TaskPhase tp JOIN Card c ON tp.cardId = c.id LEFT JOIN User u ON tp.assigneeId = u.id WHERE tp.status = 'IN_PROGRESS'" },
                                ].map((s, i) => (
                                    <button key={i} onClick={() => { setSqlQuery(s.query); setActiveTab('sql'); }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-right hover:bg-white/5 hover:border-white/10 transition-all group">
                                        <span className="text-amber-400/50 group-hover:text-amber-400 transition-colors">▶</span>
                                        <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
