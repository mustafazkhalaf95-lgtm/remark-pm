'use client';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';

/* ═══════════════════════════════════════════════════════════
   Remark PM — File Library
   Comprehensive file management with grid/list view,
   upload modal, detail panel, folder filtering
   ═══════════════════════════════════════════════════════════ */

interface FileItem {
    id: string;
    entityType: string;
    entityId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    folder: string;
    uploadedBy: string | null;
    description: string;
    isPublic: boolean;
    createdAt: string;
}

// ─── Constants ───
const FOLDERS = [
    { key: 'all', label: 'الكل', labelEn: 'All' },
    { key: 'brand_assets', label: 'أصول العلامة', labelEn: 'Brand Assets' },
    { key: 'deliverables', label: 'التسليمات', labelEn: 'Deliverables' },
    { key: 'documents', label: 'المستندات', labelEn: 'Documents' },
    { key: 'receipts', label: 'الإيصالات', labelEn: 'Receipts' },
    { key: 'general', label: 'عام', labelEn: 'General' },
];

const MIME_ICONS: Record<string, string> = {
    'image': '\u{1F5BC}',
    'video': '\u{1F3AC}',
    'audio': '\u{1F3B5}',
    'application/pdf': '\u{1F4C4}',
    'application/msword': '\u{1F4DD}',
    'application/vnd': '\u{1F4CA}',
    'text': '\u{1F4C3}',
    'default': '\u{1F4CE}',
};

function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image')) return MIME_ICONS.image;
    if (mimeType.startsWith('video')) return MIME_ICONS.video;
    if (mimeType.startsWith('audio')) return MIME_ICONS.audio;
    if (mimeType === 'application/pdf') return MIME_ICONS['application/pdf'];
    if (mimeType.includes('word') || mimeType.includes('document')) return MIME_ICONS['application/msword'];
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return MIME_ICONS['application/vnd'];
    if (mimeType.startsWith('text')) return MIME_ICONS.text;
    return MIME_ICONS.default;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

// ─── Styles ───
const S = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        direction: 'rtl' as const,
    },
    container: { maxWidth: 1440, margin: '0 auto', padding: '24px 32px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 16 },
    title: { fontSize: 28, fontWeight: 800, color: '#fff' },
    titleAccent: { color: '#6366f1' },
    headerActions: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const },
    searchInput: {
        padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14,
        outline: 'none', width: 260, backdropFilter: 'blur(8px)',
    },
    btn: {
        padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    },
    btnGhost: {
        background: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    btnGhostActive: {
        background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
        border: '1px solid rgba(99,102,241,0.3)',
    },
    glass: {
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
    },
    tabBar: {
        display: 'flex', gap: 4, padding: 4, borderRadius: 14, marginBottom: 24,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto' as const, flexWrap: 'nowrap' as const,
    },
    tab: {
        padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' as const,
        border: 'none', color: '#94a3b8', background: 'transparent',
    },
    tabActive: {
        background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
    },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
    },
    fileCard: {
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
        padding: 20, cursor: 'pointer', transition: 'all 0.3s',
    },
    fileIcon: { fontSize: 40, marginBottom: 12 },
    fileName: { fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, wordBreak: 'break-all' as const },
    fileMeta: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    fileActions: { display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-start' },
    actionBtn: {
        padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 12,
        cursor: 'pointer', transition: 'all 0.2s',
    },
    // List view
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: {
        textAlign: 'right' as const, padding: '12px 16px', fontSize: 12, fontWeight: 700,
        color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer', userSelect: 'none' as const,
    },
    td: {
        padding: '12px 16px', fontSize: 14, color: '#e2e8f0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    // Summary
    summaryCard: {
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
        padding: '16px 24px', display: 'flex', gap: 32, marginBottom: 24,
        flexWrap: 'wrap' as const,
    },
    summaryItem: { textAlign: 'center' as const },
    summaryNum: { fontSize: 24, fontWeight: 800, color: '#6366f1' },
    summaryLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    // Modal overlay
    overlay: {
        position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    modal: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 540, maxHeight: '90vh',
        overflowY: 'auto' as const,
    },
    modalTitle: { fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 },
    formGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    },
    select: {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)',
        color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    },
    dropzone: {
        border: '2px dashed rgba(99,102,241,0.4)', borderRadius: 16, padding: 40,
        textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.3s',
        background: 'rgba(99,102,241,0.05)',
    },
    dropzoneActive: {
        border: '2px dashed #6366f1', background: 'rgba(99,102,241,0.15)',
    },
    progressBar: {
        height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)',
        marginTop: 16, overflow: 'hidden' as const,
    },
    progressFill: {
        height: '100%', borderRadius: 3,
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        transition: 'width 0.3s',
    },
    // Slide-in panel
    panel: {
        position: 'fixed' as const, top: 0, left: 0, width: 420, height: '100vh',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        border: 'none', borderRight: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1000, padding: 32, overflowY: 'auto' as const,
        transition: 'transform 0.3s ease',
        boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
    },
    panelBackdrop: {
        position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 999,
    },
    badge: {
        display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontSize: 11,
        fontWeight: 600, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
    },
    empty: {
        textAlign: 'center' as const, padding: 80, color: '#64748b', fontSize: 16,
    },
};

export default function FilesPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFolder, setActiveFolder] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [showUpload, setShowUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        fileName: '', fileUrl: '', fileSize: 0, mimeType: '',
        folder: 'general', entityType: '', entityId: '', description: '',
    });

    // ─── Fetch ───
    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeFolder !== 'all') params.set('folder', activeFolder);
            if (search) params.set('search', search);
            params.set('take', '100');
            const res = await fetch(`/api/files?${params}`);
            const json = await res.json();
            setFiles(json.data || []);
        } catch { setFiles([]); }
        setLoading(false);
    }, [activeFolder, search]);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    // ─── Upload Handler ───
    const handleUpload = async () => {
        if (!uploadForm.fileName || !uploadForm.fileUrl) return;
        setUploading(true);
        setUploadProgress(0);
        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) { clearInterval(interval); return 90; }
                return prev + 10;
            });
        }, 200);

        try {
            const res = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadForm),
            });
            clearInterval(interval);
            setUploadProgress(100);
            if (res.ok) {
                setTimeout(() => {
                    setShowUpload(false);
                    setUploadProgress(0);
                    setUploading(false);
                    setUploadForm({ fileName: '', fileUrl: '', fileSize: 0, mimeType: '', folder: 'general', entityType: '', entityId: '', description: '' });
                    fetchFiles();
                }, 500);
            }
        } catch {
            clearInterval(interval);
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // ─── Delete Handler ───
    const handleDelete = async (id: string) => {
        if (!confirm('هل تريد حذف هذا الملف؟ / Delete this file?')) return;
        await fetch(`/api/files/${id}`, { method: 'DELETE' });
        setFiles(files.filter((f) => f.id !== id));
        if (selectedFile?.id === id) setSelectedFile(null);
    };

    // ─── Sort for list view ───
    const sortedFiles = [...files].sort((a, b) => {
        const aVal = (a as any)[sortCol] || '';
        const bVal = (b as any)[sortCol] || '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const toggleSort = (col: string) => {
        if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    // ─── Summary ───
    const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);
    const folderCounts = FOLDERS.slice(1).map(f => ({
        ...f,
        count: files.filter(fi => fi.folder === f.key).length,
    }));

    return (
        <AppLayout>
            <div style={S.page}>
                <div style={S.container}>
                    {/* Header */}
                    <div style={S.header}>
                        <div>
                            <h1 style={S.title}>
                                <span style={S.titleAccent}>{'📁'}</span>{' '}
                                {'مكتبة الملفات'}{' '}
                                <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>File Library</span>
                            </h1>
                        </div>
                        <div style={S.headerActions}>
                            <input
                                style={S.searchInput}
                                placeholder="بحث عن ملف... / Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button
                                style={{ ...S.btn, ...(viewMode === 'grid' ? S.btnGhostActive : S.btnGhost) }}
                                onClick={() => setViewMode('grid')}
                            >
                                {'▦ شبكة'}
                            </button>
                            <button
                                style={{ ...S.btn, ...(viewMode === 'list' ? S.btnGhostActive : S.btnGhost) }}
                                onClick={() => setViewMode('list')}
                            >
                                {'☰ قائمة'}
                            </button>
                            <button
                                style={{ ...S.btn, ...S.btnPrimary }}
                                onClick={() => setShowUpload(true)}
                            >
                                {'+ رفع ملف'}
                            </button>
                        </div>
                    </div>

                    {/* Storage Summary */}
                    <div style={S.summaryCard}>
                        <div style={S.summaryItem}>
                            <div style={S.summaryNum}>{files.length}</div>
                            <div style={S.summaryLabel}>{'اجمالي الملفات / Total Files'}</div>
                        </div>
                        <div style={S.summaryItem}>
                            <div style={S.summaryNum}>{formatFileSize(totalSize)}</div>
                            <div style={S.summaryLabel}>{'الحجم الكلي / Total Size'}</div>
                        </div>
                        {folderCounts.map((f) => (
                            <div key={f.key} style={S.summaryItem}>
                                <div style={{ ...S.summaryNum, fontSize: 18 }}>{f.count}</div>
                                <div style={S.summaryLabel}>{f.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Folder Tabs */}
                    <div style={S.tabBar}>
                        {FOLDERS.map((f) => (
                            <button
                                key={f.key}
                                style={{ ...S.tab, ...(activeFolder === f.key ? S.tabActive : {}) }}
                                onClick={() => setActiveFolder(f.key)}
                            >
                                {f.label}{' '}
                                <span style={{ fontSize: 11, opacity: 0.6 }}>{f.labelEn}</span>
                            </button>
                        ))}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div style={S.empty}>{'جاري التحميل... / Loading...'}</div>
                    )}

                    {/* Empty state */}
                    {!loading && files.length === 0 && (
                        <div style={S.empty}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>{'📂'}</div>
                            {'لا توجد ملفات / No files found'}
                        </div>
                    )}

                    {/* Grid View */}
                    {!loading && files.length > 0 && viewMode === 'grid' && (
                        <div style={S.grid}>
                            {sortedFiles.map((file) => (
                                <div
                                    key={file.id}
                                    style={S.fileCard}
                                    onClick={() => setSelectedFile(file)}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.3)';
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Preview area for images */}
                                    {file.mimeType.startsWith('image') ? (
                                        <div style={{
                                            width: '100%', height: 140, borderRadius: 12, marginBottom: 12,
                                            background: `url(${file.fileUrl}) center/cover`,
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                        }} />
                                    ) : (
                                        <div style={S.fileIcon}>{getFileIcon(file.mimeType)}</div>
                                    )}
                                    <div style={S.fileName}>{file.fileName}</div>
                                    <div style={S.fileMeta}>{formatFileSize(file.fileSize)} &middot; {file.mimeType || 'Unknown'}</div>
                                    <div style={S.fileMeta}>{formatDate(file.createdAt)}</div>
                                    <div style={{ marginTop: 8 }}>
                                        <span style={S.badge}>
                                            {FOLDERS.find((f) => f.key === file.folder)?.label || file.folder}
                                        </span>
                                    </div>
                                    <div style={S.fileActions}>
                                        <button
                                            style={S.actionBtn}
                                            onClick={(e) => { e.stopPropagation(); window.open(file.fileUrl, '_blank'); }}
                                        >
                                            {'تحميل / Download'}
                                        </button>
                                        <button
                                            style={S.actionBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(file.fileUrl);
                                            }}
                                        >
                                            {'نسخ الرابط'}
                                        </button>
                                        <button
                                            style={{ ...S.actionBtn, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                        >
                                            {'حذف'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {!loading && files.length > 0 && viewMode === 'list' && (
                        <div style={S.glass}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th} onClick={() => toggleSort('fileName')}>
                                            {'الاسم / Name'} {sortCol === 'fileName' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                        </th>
                                        <th style={S.th} onClick={() => toggleSort('mimeType')}>
                                            {'النوع / Type'} {sortCol === 'mimeType' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                        </th>
                                        <th style={S.th} onClick={() => toggleSort('fileSize')}>
                                            {'الحجم / Size'} {sortCol === 'fileSize' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                        </th>
                                        <th style={S.th} onClick={() => toggleSort('folder')}>
                                            {'المجلد / Folder'} {sortCol === 'folder' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                        </th>
                                        <th style={S.th} onClick={() => toggleSort('createdAt')}>
                                            {'التاريخ / Date'} {sortCol === 'createdAt' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                        </th>
                                        <th style={S.th}>{'إجراءات / Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFiles.map((file) => (
                                        <tr
                                            key={file.id}
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                            onClick={() => setSelectedFile(file)}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={S.td}>
                                                <span style={{ marginLeft: 8 }}>{getFileIcon(file.mimeType)}</span>
                                                {file.fileName}
                                            </td>
                                            <td style={S.td}>{file.mimeType || '-'}</td>
                                            <td style={S.td}>{formatFileSize(file.fileSize)}</td>
                                            <td style={S.td}>
                                                <span style={S.badge}>
                                                    {FOLDERS.find((f) => f.key === file.folder)?.label || file.folder}
                                                </span>
                                            </td>
                                            <td style={S.td}>{formatDate(file.createdAt)}</td>
                                            <td style={S.td}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        style={S.actionBtn}
                                                        onClick={(e) => { e.stopPropagation(); window.open(file.fileUrl, '_blank'); }}
                                                    >
                                                        {'تحميل'}
                                                    </button>
                                                    <button
                                                        style={{ ...S.actionBtn, color: '#f87171' }}
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                                    >
                                                        {'حذف'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ═══ Upload Modal ═══ */}
                    {showUpload && (
                        <div style={S.overlay} onClick={() => !uploading && setShowUpload(false)}>
                            <div style={S.modal} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h2 style={S.modalTitle}>{'رفع ملف جديد / Upload New File'}</h2>
                                    <button
                                        style={{ ...S.btn, ...S.btnGhost, padding: '6px 12px' }}
                                        onClick={() => !uploading && setShowUpload(false)}
                                    >
                                        {'✕'}
                                    </button>
                                </div>

                                {/* Drop zone */}
                                <div
                                    style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        const file = e.dataTransfer.files[0];
                                        if (file) {
                                            setUploadForm({
                                                ...uploadForm,
                                                fileName: file.name,
                                                fileSize: file.size,
                                                mimeType: file.type,
                                                fileUrl: `/uploads/${file.name}`,
                                            });
                                        }
                                    }}
                                >
                                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>{'☁'}</div>
                                    <div style={{ color: '#94a3b8', fontSize: 14 }}>
                                        {'اسحب الملف هنا أو اختر ملف'}
                                        <br />
                                        {'Drag & drop a file here'}
                                    </div>
                                    {uploadForm.fileName && (
                                        <div style={{ marginTop: 12, color: '#a5b4fc', fontWeight: 600 }}>
                                            {uploadForm.fileName} ({formatFileSize(uploadForm.fileSize)})
                                        </div>
                                    )}
                                </div>

                                <div style={S.formGroup}>
                                    <label style={S.label}>{'اسم الملف / File Name'}</label>
                                    <input
                                        style={S.input}
                                        value={uploadForm.fileName}
                                        onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                                        placeholder="filename.pdf"
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>{'رابط الملف / File URL'}</label>
                                    <input
                                        style={S.input}
                                        value={uploadForm.fileUrl}
                                        onChange={(e) => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>{'الحجم (بايت) / Size (bytes)'}</label>
                                        <input
                                            style={S.input}
                                            type="number"
                                            value={uploadForm.fileSize}
                                            onChange={(e) => setUploadForm({ ...uploadForm, fileSize: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>{'نوع MIME / MIME Type'}</label>
                                        <input
                                            style={S.input}
                                            value={uploadForm.mimeType}
                                            onChange={(e) => setUploadForm({ ...uploadForm, mimeType: e.target.value })}
                                            placeholder="image/png"
                                        />
                                    </div>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>{'المجلد / Folder'}</label>
                                    <select
                                        style={S.select}
                                        value={uploadForm.folder}
                                        onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
                                    >
                                        {FOLDERS.slice(1).map((f) => (
                                            <option key={f.key} value={f.key}>{f.label} - {f.labelEn}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>{'نوع الكيان / Entity Type'}</label>
                                        <select
                                            style={S.select}
                                            value={uploadForm.entityType}
                                            onChange={(e) => setUploadForm({ ...uploadForm, entityType: e.target.value })}
                                        >
                                            <option value="">{'بدون ربط / None'}</option>
                                            <option value="client">{'عميل / Client'}</option>
                                            <option value="creative_request">{'طلب إبداعي / Creative'}</option>
                                            <option value="production_job">{'مهمة إنتاج / Production'}</option>
                                            <option value="invoice">{'فاتورة / Invoice'}</option>
                                        </select>
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>{'معرف الكيان / Entity ID'}</label>
                                        <input
                                            style={S.input}
                                            value={uploadForm.entityId}
                                            onChange={(e) => setUploadForm({ ...uploadForm, entityId: e.target.value })}
                                            placeholder="ID..."
                                        />
                                    </div>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>{'وصف / Description'}</label>
                                    <input
                                        style={S.input}
                                        value={uploadForm.description}
                                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    />
                                </div>

                                {/* Progress */}
                                {uploading && (
                                    <div style={S.progressBar}>
                                        <div style={{ ...S.progressFill, width: `${uploadProgress}%` }} />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                                    <button
                                        style={{ ...S.btn, ...S.btnGhost }}
                                        onClick={() => !uploading && setShowUpload(false)}
                                        disabled={uploading}
                                    >
                                        {'إلغاء / Cancel'}
                                    </button>
                                    <button
                                        style={{ ...S.btn, ...S.btnPrimary, opacity: uploading ? 0.6 : 1 }}
                                        onClick={handleUpload}
                                        disabled={uploading || !uploadForm.fileName || !uploadForm.fileUrl}
                                    >
                                        {uploading ? `${'جاري الرفع...'} ${uploadProgress}%` : 'رفع / Upload'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ File Details Panel (slide-in) ═══ */}
                    {selectedFile && (
                        <>
                            <div style={S.panelBackdrop} onClick={() => setSelectedFile(null)} />
                            <div style={S.panel}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                                        {'تفاصيل الملف / File Details'}
                                    </h2>
                                    <button
                                        style={{ ...S.btn, ...S.btnGhost, padding: '6px 12px' }}
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        {'✕'}
                                    </button>
                                </div>

                                {/* Preview for images */}
                                {selectedFile.mimeType.startsWith('image') && (
                                    <div style={{
                                        width: '100%', height: 200, borderRadius: 12, marginBottom: 20,
                                        background: `url(${selectedFile.fileUrl}) center/contain no-repeat`,
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }} />
                                )}

                                {/* Non-image icon */}
                                {!selectedFile.mimeType.startsWith('image') && (
                                    <div style={{
                                        textAlign: 'center', fontSize: 64, marginBottom: 20, padding: 20,
                                        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                                    }}>
                                        {getFileIcon(selectedFile.mimeType)}
                                    </div>
                                )}

                                <div style={{ ...S.glass, padding: 20, marginBottom: 16 }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'اسم الملف / File Name'}</div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{selectedFile.fileName}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'الحجم / Size'}</div>
                                            <div style={{ color: '#e2e8f0' }}>{formatFileSize(selectedFile.fileSize)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'النوع / Type'}</div>
                                            <div style={{ color: '#e2e8f0' }}>{selectedFile.mimeType || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'المجلد / Folder'}</div>
                                            <span style={S.badge}>
                                                {FOLDERS.find((f) => f.key === selectedFile.folder)?.label || selectedFile.folder}
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'التاريخ / Date'}</div>
                                            <div style={{ color: '#e2e8f0' }}>{formatDate(selectedFile.createdAt)}</div>
                                        </div>
                                    </div>
                                    {selectedFile.entityType && (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'مرتبط بـ / Linked to'}</div>
                                            <div style={{ color: '#e2e8f0' }}>
                                                {selectedFile.entityType} &middot; {selectedFile.entityId}
                                            </div>
                                        </div>
                                    )}
                                    {selectedFile.description && (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{'وصف / Description'}</div>
                                            <div style={{ color: '#e2e8f0' }}>{selectedFile.description}</div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        style={{ ...S.btn, ...S.btnPrimary, flex: 1 }}
                                        onClick={() => window.open(selectedFile.fileUrl, '_blank')}
                                    >
                                        {'تحميل / Download'}
                                    </button>
                                    <button
                                        style={{ ...S.btn, flex: 1, background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                                        onClick={() => handleDelete(selectedFile.id)}
                                    >
                                        {'حذف / Delete'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
