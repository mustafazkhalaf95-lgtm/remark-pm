'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/hooks';

const CATEGORIES = [
    { value: 'all', label: 'الكل', icon: '📚' },
    { value: 'process', label: 'العمليات', icon: '⚙️' },
    { value: 'template', label: 'القوالب', icon: '📝' },
    { value: 'onboarding', label: 'التأهيل', icon: '🎓' },
    { value: 'policy', label: 'السياسات', icon: '📋' },
    { value: 'general', label: 'عام', icon: '📖' },
];

const bg = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' };

export default function WikiPage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', titleAr: '', content: '', contentAr: '', category: 'general', tags: '' });

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category !== 'all') params.set('category', category);
            if (search) params.set('search', search);
            const res = await fetch(apiUrl(`/api/wiki?${params}`));
            if (res.ok) {
                const data = await res.json();
                setArticles(data.items || []);
            }
        } catch { /* fallback */ }
        setLoading(false);
    }, [category, search]);

    useEffect(() => { fetchArticles(); }, [fetchArticles]);

    const saveArticle = async () => {
        const method = selectedArticle?.id ? 'PUT' : 'POST';
        const url = selectedArticle?.id ? apiUrl(`/api/wiki/${selectedArticle.id}`) : apiUrl('/api/wiki');
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                isPublished: true,
            }),
        });
        if (res.ok) {
            setShowEditor(false);
            setSelectedArticle(null);
            setForm({ title: '', titleAr: '', content: '', contentAr: '', category: 'general', tags: '' });
            fetchArticles();
        }
    };

    const deleteArticle = async (id: string) => {
        await fetch(`/api/wiki/${id}`, { method: 'DELETE' });
        setSelectedArticle(null);
        fetchArticles();
    };

    const editArticle = (a: any) => {
        setSelectedArticle(a);
        setForm({
            title: a.title || '', titleAr: a.titleAr || '',
            content: a.content || '', contentAr: a.contentAr || '',
            category: a.category || 'general',
            tags: (JSON.parse(a.tags || '[]')).join(', '),
        });
        setShowEditor(true);
    };

    const filteredArticles = articles;

    return (
        <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>📚 قاعدة المعرفة</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>توثيق العمليات والإجراءات والقوالب</p>
                </div>
                <button onClick={() => { setShowEditor(true); setSelectedArticle(null); setForm({ title: '', titleAr: '', content: '', contentAr: '', category: 'general', tags: '' }); }} style={{ ...glass, padding: '10px 20px', color: '#22c55e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    + مقال جديد
                </button>
            </div>

            {/* Search + Categories */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث في المقالات..." style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                    {CATEGORIES.map(c => (
                        <button key={c.value} onClick={() => setCategory(c.value)} style={{
                            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12,
                            background: category === c.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                            color: category === c.value ? '#818cf8' : 'rgba(255,255,255,0.4)',
                        }}>
                            {c.icon} {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Layout: Article List + Content */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedArticle && !showEditor ? '350px 1fr' : '1fr', gap: 16 }}>
                {/* Article List */}
                <div style={{ display: selectedArticle && !showEditor ? 'block' : 'grid', gridTemplateColumns: selectedArticle ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {loading ? (
                        <div style={{ ...glass, padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>جاري التحميل...</div>
                    ) : filteredArticles.length === 0 ? (
                        <div style={{ ...glass, padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            لا توجد مقالات. ابدأ بإنشاء أول مقال!
                        </div>
                    ) : (
                        filteredArticles.map(a => (
                            <div key={a.id} onClick={() => { setSelectedArticle(a); setShowEditor(false); }} style={{
                                ...glass, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                                background: selectedArticle?.id === a.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                borderColor: selectedArticle?.id === a.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                                        {CATEGORIES.find(c => c.value === a.category)?.icon || '📖'} {a.titleAr || a.title}
                                    </h4>
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                        {CATEGORIES.find(c => c.value === a.category)?.label || a.category}
                                    </span>
                                </div>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {a.contentAr || a.content || 'بدون محتوى'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                                    <span>{a.author?.profile?.fullNameAr || '—'}</span>
                                    <span>{a.viewCount || 0} مشاهدة</span>
                                </div>
                                {a.tags && JSON.parse(a.tags || '[]').length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                                        {JSON.parse(a.tags).slice(0, 3).map((tag: string, i: number) => (
                                            <span key={i} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Article Content Viewer */}
                {selectedArticle && !showEditor && (
                    <div style={{ ...glass, padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{selectedArticle.titleAr || selectedArticle.title}</h2>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                                    بواسطة {selectedArticle.author?.profile?.fullNameAr || '—'} • {new Date(selectedArticle.createdAt).toLocaleDateString('ar')} • {selectedArticle.viewCount || 0} مشاهدة
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => editArticle(selectedArticle)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'none', cursor: 'pointer', fontSize: 12 }}>تعديل</button>
                                <button onClick={() => deleteArticle(selectedArticle.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 12 }}>حذف</button>
                                <button onClick={() => setSelectedArticle(null)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                            </div>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 2, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
                            {selectedArticle.contentAr || selectedArticle.content || 'لا يوجد محتوى'}
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowEditor(false)}>
                    <div style={{ ...glass, padding: 28, width: 640, maxHeight: '85vh', overflowY: 'auto', background: 'rgba(15,15,26,0.95)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{selectedArticle?.id ? '✏️ تعديل المقال' : '📝 مقال جديد'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>العنوان (عربي)</label>
                                    <input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Title (English)</label>
                                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} dir="ltr" style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>التصنيف</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }}>
                                        {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الوسوم (مفصولة بفاصلة)</label>
                                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="تسويق, سوشيال, عملاء" style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                            </div>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>المحتوى (عربي)</label>
                            <textarea value={form.contentAr} onChange={e => setForm({ ...form, contentAr: e.target.value })} rows={10} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'vertical', lineHeight: 1.8 }} placeholder="اكتب محتوى المقال هنا..." />
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Content (English)</label>
                            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} dir="ltr" style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'vertical', lineHeight: 1.8 }} placeholder="Write article content here..." />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={saveArticle} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                                {selectedArticle?.id ? 'حفظ التغييرات' : 'نشر المقال'}
                            </button>
                            <button onClick={() => setShowEditor(false)} style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13 }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
