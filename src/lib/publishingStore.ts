'use strict';
/* Remark Publishing — Data Store v1 — 7-Stage Pipeline */

// ─── Publishing Stages ───
export const PUB_STAGES = [
    'content_received', 'review', 'scheduling', 'design_check',
    'ready_to_publish', 'published', 'performance_review'
] as const;
export type PubStage = typeof PUB_STAGES[number];

export interface PubStageInfo { ar: string; en: string; owner_ar: string; owner_en: string; next_ar: string; next_en: string; color: string; }
export const PUB_STAGE_META: Record<PubStage, PubStageInfo> = {
    content_received: { ar: 'محتوى مستلم', en: 'Content Received', owner_ar: 'منسق النشر', owner_en: 'Publishing Coordinator', next_ar: 'مراجعة المحتوى', next_en: 'Review content', color: '#6366f1' },
    review: { ar: 'قيد المراجعة', en: 'Under Review', owner_ar: 'مدير المحتوى', owner_en: 'Content Manager', next_ar: 'الموافقة أو التعديل', next_en: 'Approve or revise', color: '#3b82f6' },
    scheduling: { ar: 'الجدولة', en: 'Scheduling', owner_ar: 'منسق النشر', owner_en: 'Publishing Coordinator', next_ar: 'تحديد الوقت والمنصة', next_en: 'Set time & platform', color: '#0ea5e9' },
    design_check: { ar: 'فحص التصميم', en: 'Design Check', owner_ar: 'المدير الإبداعي', owner_en: 'Creative Director', next_ar: 'تأكيد الجودة البصرية', next_en: 'Confirm visual quality', color: '#8b5cf6' },
    ready_to_publish: { ar: 'جاهز للنشر', en: 'Ready to Publish', owner_ar: 'منسق النشر', owner_en: 'Publishing Coordinator', next_ar: 'نشر المحتوى', next_en: 'Publish content', color: '#14b8a6' },
    published: { ar: 'تم النشر', en: 'Published', owner_ar: '—', owner_en: '—', next_ar: 'متابعة الأداء', next_en: 'Track performance', color: '#22c55e' },
    performance_review: { ar: 'مراجعة الأداء', en: 'Performance Review', owner_ar: 'محلل البيانات', owner_en: 'Data Analyst', next_ar: 'تقرير النتائج', next_en: 'Results report', color: '#f59e0b' },
};

// ─── Post Categories ───
export const POST_CATEGORIES = ['social_post', 'story', 'reel', 'blog', 'newsletter', 'ad', 'announcement', 'carousel'] as const;
export type PostCategory = typeof POST_CATEGORIES[number];
export const POST_CAT_AR: Record<PostCategory, string> = { social_post: 'بوست', story: 'ستوري', reel: 'ريلز', blog: 'مقال', newsletter: 'نشرة بريدية', ad: 'إعلان', announcement: 'إعلان رسمي', carousel: 'كاروسيل' };
export const POST_CAT_EN: Record<PostCategory, string> = { social_post: 'Social Post', story: 'Story', reel: 'Reel', blog: 'Blog', newsletter: 'Newsletter', ad: 'Ad', announcement: 'Announcement', carousel: 'Carousel' };
export const POST_CAT_ICON: Record<PostCategory, string> = { social_post: '📱', story: '📸', reel: '🎬', blog: '📝', newsletter: '📧', ad: '📢', announcement: '📣', carousel: '🎠' };

// ─── Platforms ───
export const PLATFORMS = ['Instagram', 'TikTok', 'Snapchat', 'X (Twitter)', 'Facebook', 'LinkedIn', 'YouTube', 'Website', 'Email'] as const;

// ─── Team ───
export const PUB_TEAM = [
    { id: 'layla', name: 'ليلى', nameEn: 'Layla', role: 'منسقة نشر', roleEn: 'Publishing Coordinator', avatar: '📋', color: '#6366f1' },
    { id: 'hassan', name: 'حسن', nameEn: 'Hassan', role: 'كاتب محتوى', roleEn: 'Content Writer', avatar: '✍️', color: '#3b82f6' },
    { id: 'reem', name: 'ريم', nameEn: 'Reem', role: 'مديرة سوشيال', roleEn: 'Social Media Manager', avatar: '📱', color: '#ec4899' },
    { id: 'ali', name: 'علي', nameEn: 'Ali', role: 'محلل بيانات', roleEn: 'Data Analyst', avatar: '📊', color: '#14b8a6' },
    { id: 'sara', name: 'سارة', nameEn: 'Sara', role: 'مصممة', roleEn: 'Designer', avatar: '🎨', color: '#f59e0b' },
];

// ─── Interfaces ───
export interface PublishingPost {
    postId: string; clientId: string; title: string; category: PostCategory;
    platform: string; caption: string; hashtags: string[];
    scheduledDate: string; scheduledTime: string;
    stage: PubStage; owner: string; assignedTeam: string[];
    linkedCreativeRequestId: string; linkedProductionJobId: string;
    approved: boolean; blocked: boolean; blockReason: string;
    publishedUrl: string; publishedAt: string;
    performance: { reach: number; impressions: number; engagement: number; likes: number; comments: number; shares: number; saves: number } | null;
    notes: string; createdAt: string; updatedAt: string;
}
export interface PubCalendarEvent {
    id: string; clientId: string; postId?: string;
    title: string; date: string; platform: string; color: string;
}
export interface PubActivity {
    id: string; clientId: string; postId?: string;
    text: string; textEn: string; icon: string; time: string;
    type: 'info' | 'warning' | 'success' | 'danger';
}

const PB_STORAGE_KEY = 'remark_pm_publishing_store';

// ═══ STORE ═══
export class PublishingStore {
    posts: PublishingPost[] = [];
    calendarEvents: PubCalendarEvent[] = [];
    activities: PubActivity[] = [];
    private _v = 0; private _subs = new Set<() => void>(); private _toast = { msg: '', type: 'success' as string };

    constructor() { if (!this._loadFromStorage()) this._seed(); }
    subscribe(fn: () => void) { this._subs.add(fn); return () => { this._subs.delete(fn); }; }
    getVersion() { return this._v; }
    emit() { this._v++; this._saveToStorage(); this._subs.forEach(fn => fn()); }
    getToast() { return this._toast; }
    toast(m: string, t: 'success' | 'error' | 'info' = 'success') { this._toast = { msg: m, type: t }; this.emit(); }

    private _saveToStorage() {
        if (typeof window === 'undefined') return;
        try {
            const data = { posts: this.posts, calendarEvents: this.calendarEvents, activities: this.activities };
            localStorage.setItem(PB_STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.warn('PublishingStore save failed:', e); }
    }
    private _loadFromStorage(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(PB_STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.posts = data.posts || []; this.calendarEvents = data.calendarEvents || []; this.activities = data.activities || [];
            return this.posts.length > 0;
        } catch { return false; }
    }

    // ── Queries ──
    getPost(id: string) { return this.posts.find(p => p.postId === id); }
    getClientPosts(clientId: string) { return this.posts.filter(p => p.clientId === clientId); }
    getClientCalendar(clientId: string) { return this.calendarEvents.filter(e => e.clientId === clientId); }
    getClientActivities(clientId: string) { return this.activities.filter(a => a.clientId === clientId); }

    // ── KPIs ──
    getKPIs() {
        const p = this.posts;
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return {
            total: p.length,
            active: p.filter(x => x.stage !== 'published' && x.stage !== 'performance_review').length,
            inReview: p.filter(x => x.stage === 'review' || x.stage === 'design_check').length,
            scheduled: p.filter(x => x.stage === 'scheduling' || x.stage === 'ready_to_publish').length,
            published: p.filter(x => x.stage === 'published' || x.stage === 'performance_review').length,
            publishedThisMonth: p.filter(x => (x.stage === 'published' || x.stage === 'performance_review') && x.publishedAt?.startsWith(thisMonth)).length,
            blocked: p.filter(x => x.blocked).length,
            avgEngagement: p.filter(x => x.performance).length > 0 ? Math.round(p.filter(x => x.performance).reduce((s, x) => s + (x.performance?.engagement || 0), 0) / p.filter(x => x.performance).length) : 0,
        };
    }

    // ── Stage Transitions ──
    movePostToStage(postId: string, stage: PubStage, lang: 'ar' | 'en' = 'ar') {
        const p = this.getPost(postId); if (!p) return;
        const prev = p.stage;
        p.stage = stage; p.updatedAt = new Date().toISOString();
        if (stage === 'published') { p.publishedAt = new Date().toISOString(); }
        const sm = PUB_STAGE_META[stage];
        this.toast(lang === 'ar' ? `✅ ${p.title} → ${sm.ar}` : `✅ ${p.title} → ${sm.en}`);
        this.activities.unshift({ id: `pba${Date.now()}`, clientId: p.clientId, postId, text: `📌 ${p.title} — ${sm.ar}`, textEn: `📌 ${p.title} — ${sm.en}`, icon: '📌', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'info' });
        this.emit();
    }

    // ── Create ──
    createPost(p: Omit<PublishingPost, 'postId' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'publishedUrl' | 'performance'>, lang: 'ar' | 'en' = 'ar') {
        const now = new Date().toISOString();
        const post: PublishingPost = { ...p, postId: `pub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, publishedAt: '', publishedUrl: '', performance: null, createdAt: now, updatedAt: now };
        this.posts.push(post);
        this.toast(lang === 'ar' ? `📢 منشور جديد: ${p.title}` : `📢 New post: ${p.title}`);
        this.activities.unshift({ id: `pba${Date.now()}`, clientId: p.clientId, postId: post.postId, text: `🆕 منشور جديد: ${p.title}`, textEn: `🆕 New post: ${p.title}`, icon: '🆕', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'success' });
        // Add calendar event
        if (p.scheduledDate) {
            this.calendarEvents.push({ id: `pce_${Date.now()}`, clientId: p.clientId, postId: post.postId, title: p.title, date: p.scheduledDate, platform: p.platform, color: PUB_STAGE_META[p.stage].color });
        }
        this.emit(); return post;
    }

    // ── Update Performance ──
    updatePerformance(postId: string, perf: NonNullable<PublishingPost['performance']>, lang: 'ar' | 'en' = 'ar') {
        const p = this.getPost(postId); if (!p) return;
        p.performance = perf; p.stage = 'performance_review'; p.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `📊 تم تحديث أداء: ${p.title}` : `📊 Performance updated: ${p.title}`);
        this.emit();
    }

    // ── Block ──
    markBlocked(postId: string, reason: string, lang: 'ar' | 'en' = 'ar') {
        const p = this.getPost(postId); if (!p) return;
        p.blocked = true; p.blockReason = reason; p.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `⛔ ${p.title} — محظور` : `⛔ ${p.title} — Blocked`, 'error');
        this.emit();
    }
    unblock(postId: string, lang: 'ar' | 'en' = 'ar') {
        const p = this.getPost(postId); if (!p) return;
        p.blocked = false; p.blockReason = ''; p.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `✅ ${p.title} — تم رفع الحظر` : `✅ ${p.title} — Unblocked`);
        this.emit();
    }

    // ── Export ──
    exportMonthlyReport(lang: 'ar' | 'en' = 'ar') {
        const kpis = this.getKPIs();
        return { title: lang === 'ar' ? 'تقرير النشر الشهري' : 'Monthly Publishing Report', date: new Date().toISOString().split('T')[0], kpis, postsSummary: this.posts.map(p => ({ title: p.title, stage: p.stage, platform: p.platform, client: p.clientId })), exportedAt: new Date().toISOString() };
    }

    // ── Seed ──
    private _seed() {
        const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
        const t = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        this.posts.push(
            { postId: 'pub_warda_01', clientId: 'client_warda', title: 'بوست رمضان — عروض الإفطار', category: 'social_post', platform: 'Instagram', caption: '🌙 استمتعوا بعروض الإفطار الخاصة في مطعم الوردة! خصم 20% على جميع الأطباق الرمضانية.', hashtags: ['رمضان_كريم', 'الوردة', 'عروض_رمضان'], scheduledDate: d(1), scheduledTime: t(18, 0), stage: 'ready_to_publish', owner: 'ريم', assignedTeam: ['ريم', 'سارة'], linkedCreativeRequestId: 'req_w01', linkedProductionJobId: '', approved: true, blocked: false, blockReason: '', publishedUrl: '', publishedAt: '', performance: null, notes: 'نشر قبل الإفطار بساعة', createdAt: d(-3), updatedAt: d(0) },
            { postId: 'pub_warda_02', clientId: 'client_warda', title: 'ريلز — كواليس المطبخ', category: 'reel', platform: 'Instagram', caption: '🎬 خلف الكواليس: كيف يُحضّر الشيف أطباقكم المفضلة!', hashtags: ['خلف_الكواليس', 'الوردة', 'طبخ'], scheduledDate: d(3), scheduledTime: t(20, 0), stage: 'review', owner: 'ريم', assignedTeam: ['ريم', 'حسن'], linkedCreativeRequestId: 'req_w04', linkedProductionJobId: 'pj_ram_bts', approved: false, blocked: false, blockReason: '', publishedUrl: '', publishedAt: '', performance: null, notes: '', createdAt: d(-2), updatedAt: d(0) },
            { postId: 'pub_warda_03', clientId: 'client_warda', title: 'كاروسيل — قائمة رمضان', category: 'carousel', platform: 'Instagram', caption: '📋 تعرفوا على قائمة رمضان الجديدة! 15 طبق جديد بانتظاركم.', hashtags: ['منيو_رمضان', 'الوردة'], scheduledDate: d(0), scheduledTime: t(12, 0), stage: 'published', owner: 'ليلى', assignedTeam: ['ليلى', 'سارة'], linkedCreativeRequestId: '', linkedProductionJobId: 'pj_warda_menu', approved: true, blocked: false, blockReason: '', publishedUrl: 'https://instagram.com/p/example1', publishedAt: d(0), performance: { reach: 12500, impressions: 18200, engagement: 8.5, likes: 1540, comments: 89, shares: 210, saves: 340 }, notes: '', createdAt: d(-5), updatedAt: d(0) },
            { postId: 'pub_warda_04', clientId: 'client_warda', title: 'ستوري — عروض اليوم', category: 'story', platform: 'Instagram', caption: '🔥 عرض اليوم فقط!', hashtags: [], scheduledDate: d(2), scheduledTime: t(17, 0), stage: 'scheduling', owner: 'ليلى', assignedTeam: ['ليلى'], linkedCreativeRequestId: '', linkedProductionJobId: '', approved: true, blocked: false, blockReason: '', publishedUrl: '', publishedAt: '', performance: null, notes: '', createdAt: d(-1), updatedAt: d(0) },
            { postId: 'pub_rayhana_01', clientId: 'client_rayhana', title: 'إطلاق مجموعة الربيع', category: 'reel', platform: 'Instagram', caption: '✨ مجموعة الربيع 2026 — أناقة تنبض بالحياة', hashtags: ['ريحانة', 'مجوهرات', 'Spring2026'], scheduledDate: d(5), scheduledTime: t(19, 0), stage: 'content_received', owner: 'حسن', assignedTeam: ['حسن', 'ريم'], linkedCreativeRequestId: 'req_r01', linkedProductionJobId: 'pj_spring_hero', approved: false, blocked: true, blockReason: 'بانتظار اكتمال الفيديو من الإنتاج', publishedUrl: '', publishedAt: '', performance: null, notes: 'مرتبط بحملة الربيع', createdAt: d(-1), updatedAt: d(0) },
            { postId: 'pub_rayhana_02', clientId: 'client_rayhana', title: 'بوست — خاتم الياقوت', category: 'social_post', platform: 'Instagram', caption: '💎 خاتم الياقوت الطبيعي — قطعة فريدة بتصميم كلاسيكي.', hashtags: ['ريحانة', 'ياقوت', 'مجوهرات_فاخرة'], scheduledDate: d(-1), scheduledTime: t(20, 0), stage: 'published', owner: 'ريم', assignedTeam: ['ريم', 'سارة'], linkedCreativeRequestId: 'req_r02', linkedProductionJobId: '', approved: true, blocked: false, blockReason: '', publishedUrl: 'https://instagram.com/p/example2', publishedAt: d(-1), performance: { reach: 8900, impressions: 14300, engagement: 6.2, likes: 880, comments: 45, shares: 120, saves: 195 }, notes: '', createdAt: d(-4), updatedAt: d(-1) },
            { postId: 'pub_warda_05', clientId: 'client_warda', title: 'إعلان مدفوع — رمضان', category: 'ad', platform: 'Facebook', caption: '🌙 احجز طاولة الإفطار الآن! مطعم الوردة ينتظركم.', hashtags: ['رمضان', 'إفطار', 'حجز'], scheduledDate: d(4), scheduledTime: t(16, 0), stage: 'design_check', owner: 'سارة', assignedTeam: ['سارة', 'علي'], linkedCreativeRequestId: '', linkedProductionJobId: '', approved: false, blocked: false, blockReason: '', publishedUrl: '', publishedAt: '', performance: null, notes: 'ميزانية إعلان: 500$', createdAt: d(-1), updatedAt: d(0) },
            { postId: 'pub_warda_06', clientId: 'client_warda', title: 'نشرة بريدية — عروض الأسبوع', category: 'newsletter', platform: 'Email', caption: 'عروض الأسبوع الحصرية لمشتركي الوردة!', hashtags: [], scheduledDate: d(6), scheduledTime: t(10, 0), stage: 'content_received', owner: 'حسن', assignedTeam: ['حسن'], linkedCreativeRequestId: '', linkedProductionJobId: '', approved: false, blocked: false, blockReason: '', publishedUrl: '', publishedAt: '', performance: null, notes: '', createdAt: d(0), updatedAt: d(0) },
        );
        // Calendar Events
        this.calendarEvents.push(
            { id: 'pce1', clientId: 'client_warda', postId: 'pub_warda_01', title: 'بوست عروض الإفطار', date: d(1), platform: 'Instagram', color: '#ec4899' },
            { id: 'pce2', clientId: 'client_warda', postId: 'pub_warda_02', title: 'ريلز كواليس المطبخ', date: d(3), platform: 'Instagram', color: '#8b5cf6' },
            { id: 'pce3', clientId: 'client_warda', postId: 'pub_warda_03', title: 'كاروسيل قائمة رمضان', date: d(0), platform: 'Instagram', color: '#22c55e' },
            { id: 'pce4', clientId: 'client_warda', postId: 'pub_warda_04', title: 'ستوري عروض اليوم', date: d(2), platform: 'Instagram', color: '#f59e0b' },
            { id: 'pce5', clientId: 'client_rayhana', postId: 'pub_rayhana_01', title: 'إطلاق مجموعة الربيع', date: d(5), platform: 'Instagram', color: '#6366f1' },
            { id: 'pce6', clientId: 'client_warda', postId: 'pub_warda_05', title: 'إعلان رمضان — Facebook', date: d(4), platform: 'Facebook', color: '#3b82f6' },
            { id: 'pce7', clientId: 'client_warda', postId: 'pub_warda_06', title: 'نشرة بريدية', date: d(6), platform: 'Email', color: '#14b8a6' },
        );
        // Activities
        this.activities.push(
            { id: 'pba1', clientId: 'client_warda', postId: 'pub_warda_03', text: '✅ تم نشر كاروسيل قائمة رمضان', textEn: '✅ Ramadan menu carousel published', icon: '✅', time: '12:00', type: 'success' },
            { id: 'pba2', clientId: 'client_rayhana', postId: 'pub_rayhana_02', text: '✅ تم نشر بوست خاتم الياقوت', textEn: '✅ Ruby ring post published', icon: '✅', time: '20:00', type: 'success' },
            { id: 'pba3', clientId: 'client_warda', postId: 'pub_warda_01', text: '📋 بوست عروض الإفطار — جاهز للنشر', textEn: '📋 Iftar deals post — ready to publish', icon: '📋', time: '15:30', type: 'info' },
            { id: 'pba4', clientId: 'client_rayhana', postId: 'pub_rayhana_01', text: '⛔ إطلاق الربيع — محظور (بانتظار الفيديو)', textEn: '⛔ Spring launch — blocked (awaiting video)', icon: '⛔', time: '11:00', type: 'warning' },
            { id: 'pba5', clientId: 'client_warda', postId: 'pub_warda_05', text: '🔍 إعلان رمضان — فحص التصميم', textEn: '🔍 Ramadan ad — design check', icon: '🔍', time: '14:00', type: 'info' },
            { id: 'pba6', clientId: 'client_warda', postId: 'pub_warda_06', text: '🆕 نشرة بريدية جديدة — عروض الأسبوع', textEn: '🆕 New newsletter — weekly deals', icon: '🆕', time: '09:30', type: 'success' },
        );
    }
}

let _pbs: PublishingStore | null = null;
export function getPublishingStore(): PublishingStore { if (!_pbs) _pbs = new PublishingStore(); return _pbs; }
