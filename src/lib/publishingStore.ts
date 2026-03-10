'use strict';
import { TEAM } from './teamStore';
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

// ─── Team (from central teamStore) ───
export const PUB_TEAM = TEAM.filter(m =>
    m.roles.includes('publishing_manager') || m.roles.includes('account_manager') ||
    m.roles.includes('operations_manager') || m.roles.includes('ceo') ||
    m.skills.includes('design')
).map(m => ({
    id: m.id, name: m.name, nameEn: m.nameEn,
    role: m.position, roleEn: m.positionEn,
    avatar: m.avatar, color: m.color,
}));

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
        const now = new Date();
        const d = (offset: number) => new Date(now.getTime() + offset * 864e5).toISOString().split('T')[0];
        const ts = () => now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const iso = () => now.toISOString();

        const mkPost = (id: string, cId: string, title: string, cat: PostCategory, platform: string, stage: PubStage, sDate: string, sTime: string, owner: string, extra?: Partial<PublishingPost>): PublishingPost => ({
            postId: id, clientId: cId, title, category: cat, platform, caption: `محتوى ${title}`, hashtags: ['remark', 'iraq'],
            scheduledDate: sDate, scheduledTime: sTime, stage, owner, assignedTeam: [owner],
            linkedCreativeRequestId: '', linkedProductionJobId: '',
            approved: ['ready_to_publish', 'published', 'performance_review'].includes(stage),
            blocked: false, blockReason: '', publishedUrl: stage === 'published' || stage === 'performance_review' ? `https://instagram.com/p/${id}` : '',
            publishedAt: stage === 'published' || stage === 'performance_review' ? iso() : '',
            performance: stage === 'performance_review' ? { reach: Math.floor(Math.random() * 50000) + 5000, impressions: Math.floor(Math.random() * 80000) + 10000, engagement: Math.floor(Math.random() * 8) + 2, likes: Math.floor(Math.random() * 3000) + 200, comments: Math.floor(Math.random() * 150) + 10, shares: Math.floor(Math.random() * 100) + 5, saves: Math.floor(Math.random() * 200) + 20 } : null,
            notes: '', createdAt: iso(), updatedAt: iso(), ...extra,
        });

        this.posts = [
            // الوردة
            mkPost('pub_w1', 'client_warda', 'بوست عرض الغداء الخاص', 'social_post', 'Instagram', 'ready_to_publish', d(0), '12:00', 'زين العابدين', { caption: '🍽️ عرض الغداء الخاص — خصم 20% على جميع الأطباق الرئيسية! الحق العرض قبل نهاية الأسبوع', hashtags: ['الوردة', 'عرض_الغداء', 'بغداد', 'مطاعم'] }),
            mkPost('pub_w2', 'client_warda', 'ستوري — كواليس المطبخ', 'story', 'Instagram', 'scheduling', d(1), '18:00', 'زين العابدين'),
            mkPost('pub_w3', 'client_warda', 'ريلز المطبخ — وصفة اليوم', 'reel', 'Instagram', 'review', d(2), '20:00', 'زين العابدين', { linkedProductionJobId: 'pj_w1' }),
            mkPost('pub_w4', 'client_warda', 'بوست فبراير — عروض الشتاء', 'social_post', 'Instagram', 'published', d(-10), '12:00', 'زين العابدين'),
            mkPost('pub_w5', 'client_warda', 'ريلز ترويجي فبراير', 'reel', 'TikTok', 'performance_review', d(-8), '19:00', 'زين العابدين', { linkedProductionJobId: 'pj_d1' }),
            // ريحانة
            mkPost('pub_r1', 'client_rayhana', 'بوست مشروع حياة — تحديث', 'social_post', 'Instagram', 'design_check', d(3), '10:00', 'وديان', { caption: '🏠 مشروع حياة — تحديثات البناء للمرحلة الثانية. موعد التسليم: Q3 2026', hashtags: ['ريحانة', 'مشروع_حياة', 'عقارات_العراق'] }),
            mkPost('pub_r2', 'client_rayhana', 'إعلان ممول — شقق للبيع', 'ad', 'Facebook', 'content_received', d(5), '09:00', 'وديان'),
            mkPost('pub_r3', 'client_rayhana', 'كاروسيل — مزايا المشروع', 'carousel', 'Instagram', 'published', d(-5), '11:00', 'وديان'),
            // كلفنك
            mkPost('pub_k1', 'client_kalfink', 'بوست منتج العناية الجديد', 'social_post', 'Instagram', 'ready_to_publish', d(1), '15:00', 'زين العابدين', { linkedCreativeRequestId: 'req_k1', caption: '💄 منتج جديد! كريم العناية بالبشرة — تركيبة طبيعية 100%', hashtags: ['كلفنك', 'عناية_بالبشرة', 'جمال'] }),
            mkPost('pub_k2', 'client_kalfink', 'ستوري — خطوات الاستخدام', 'story', 'Instagram', 'scheduling', d(2), '17:00', 'زين العابدين'),
            mkPost('pub_k3', 'client_kalfink', 'ريلز — قبل وبعد', 'reel', 'TikTok', 'performance_review', d(-12), '20:00', 'زين العابدين'),
            // زمزم
            mkPost('pub_z1', 'client_zamzam', 'بوست إطلاق مشروع النور', 'social_post', 'Instagram', 'content_received', d(7), '10:00', 'وديان', { caption: '🏗️ مشروع النور — إطلاق المرحلة الأولى قريباً! سجّل اهتمامك الآن', hashtags: ['زمزم', 'مشروع_النور', 'استثمار_عقاري'] }),
            mkPost('pub_z2', 'client_zamzam', 'فيديو تحديث أعمال البناء', 'reel', 'YouTube', 'content_received', d(10), '12:00', 'وديان'),
        ];

        this.calendarEvents = this.posts.filter(p => p.scheduledDate).map(p => ({
            id: `pce_${p.postId}`, clientId: p.clientId, postId: p.postId,
            title: p.title, date: p.scheduledDate, platform: p.platform,
            color: PUB_STAGE_META[p.stage].color,
        }));

        this.activities = [
            { id: 'pba1', clientId: 'client_warda', postId: 'pub_w1', text: '📢 بوست عرض الغداء — جاهز للنشر', textEn: '📢 Lunch Offer Post — Ready to publish', icon: '📢', time: ts(), type: 'success' },
            { id: 'pba2', clientId: 'client_warda', postId: 'pub_w5', text: '📊 ريلز فبراير — مراجعة الأداء', textEn: '📊 Feb Reel — Performance review', icon: '📊', time: ts(), type: 'info' },
            { id: 'pba3', clientId: 'client_rayhana', postId: 'pub_r1', text: '🎨 بوست مشروع حياة — فحص التصميم', textEn: '🎨 Hayat Post — Design check', icon: '🎨', time: ts(), type: 'info' },
            { id: 'pba4', clientId: 'client_kalfink', postId: 'pub_k1', text: '✅ بوست العناية — جاهز للنشر', textEn: '✅ Skincare Post — Ready to publish', icon: '✅', time: ts(), type: 'success' },
            { id: 'pba5', clientId: 'client_zamzam', postId: 'pub_z1', text: '🆕 بوست إطلاق مشروع النور — مستلم', textEn: '🆕 Noor Launch Post — Received', icon: '🆕', time: ts(), type: 'info' },
        ];

        this._saveToStorage();
    }
}

let _pbs: PublishingStore | null = null;
export function getPublishingStore(): PublishingStore { if (!_pbs) _pbs = new PublishingStore(); return _pbs; }
