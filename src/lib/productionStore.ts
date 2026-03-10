'use strict';
import { TEAM } from './teamStore';
/* Remark Production — Data Store v1 — 13-Stage Pipeline */

// ─── Production Stages ───
export const PROD_STAGES = [
    'awaiting_concept', 'production_intake', 'storyboard_planning', 'scheduling',
    'ready_to_shoot', 'shooting', 'media_ingested', 'editing', 'internal_review',
    'creative_alignment', 'revisions_required', 'package_ready', 'delivered'
] as const;
export type ProdStage = typeof PROD_STAGES[number];

export interface ProdStageInfo { ar: string; en: string; owner_ar: string; owner_en: string; next_ar: string; next_en: string; color: string; }
export const PROD_STAGE_META: Record<ProdStage, ProdStageInfo> = {
    awaiting_concept: { ar: 'بانتظار الموافقة', en: 'Awaiting Approved Concept', owner_ar: 'النظام', owner_en: 'System', next_ar: 'انتظار الموافقات', next_en: 'Wait for approvals', color: '#6366f1' },
    production_intake: { ar: 'استلام الإنتاج', en: 'Production Intake', owner_ar: 'مدير الإنتاج', owner_en: 'Production Manager', next_ar: 'تحقق من النطاق', next_en: 'Validate scope', color: '#3b82f6' },
    storyboard_planning: { ar: 'ستوري بورد وتخطيط', en: 'Storyboard & Planning', owner_ar: 'قائد الإنتاج', owner_en: 'Production Lead', next_ar: 'إنشاء الستوري بورد', next_en: 'Create storyboard', color: '#8b5cf6' },
    scheduling: { ar: 'الجدولة واللوجستيات', en: 'Scheduling & Logistics', owner_ar: 'منسق الإنتاج', owner_en: 'Prod. Coordinator', next_ar: 'تحديد المواعيد', next_en: 'Finalize dates', color: '#0ea5e9' },
    ready_to_shoot: { ar: 'جاهز للتصوير', en: 'Ready to Shoot', owner_ar: 'مدير الإنتاج', owner_en: 'Production Manager', next_ar: 'بدء التنفيذ', next_en: 'Start execution', color: '#14b8a6' },
    shooting: { ar: 'التصوير جاري', en: 'Shooting / Capture', owner_ar: 'المصور/المصور الفيديو', owner_en: 'Photographer/Videographer', next_ar: 'رفع المواد', next_en: 'Upload media', color: '#f59e0b' },
    media_ingested: { ar: 'المواد مرفوعة', en: 'Media Ingested', owner_ar: 'المونتير', owner_en: 'Editor', next_ar: 'بدء المونتاج', next_en: 'Start editing', color: '#84cc16' },
    editing: { ar: 'المونتاج', en: 'Editing / Post-Production', owner_ar: 'المونتير/موشن', owner_en: 'Editor/Motion', next_ar: 'إنهاء النسخة', next_en: 'Complete cut', color: '#f97316' },
    internal_review: { ar: 'مراجعة داخلية', en: 'Internal Review', owner_ar: 'قائد الإنتاج', owner_en: 'Production Lead', next_ar: 'مراجعة الجودة', next_en: 'Review quality', color: '#ef4444' },
    creative_alignment: { ar: 'مطابقة إبداعية', en: 'Creative Alignment', owner_ar: 'المدير الإبداعي', owner_en: 'Creative Director', next_ar: 'تأكيد التوافق', next_en: 'Confirm alignment', color: '#a855f7' },
    revisions_required: { ar: 'تعديلات مطلوبة', en: 'Revisions Required', owner_ar: 'المنفذ المعين', owner_en: 'Assigned Editor', next_ar: 'تطبيق التعديلات', next_en: 'Apply changes', color: '#dc2626' },
    package_ready: { ar: 'الحزمة جاهزة', en: 'Package Ready', owner_ar: 'مدير الإنتاج', owner_en: 'Production Manager', next_ar: 'تسليم الملفات', next_en: 'Deliver files', color: '#059669' },
    delivered: { ar: 'تم التسليم', en: 'Delivered', owner_ar: '—', owner_en: '—', next_ar: 'مكتمل', next_en: 'Complete', color: '#10b981' },
};

// ─── Job Categories ───
export const JOB_CATEGORIES = ['product_shoot', 'interview', 'reel_filming', 'social_video', 'photo_session', 'edit_only', 'motion_graphics', 'campaign_package', 'cutdown', 'teaser'] as const;
export type JobCategory = typeof JOB_CATEGORIES[number];
export const JOB_CAT_AR: Record<JobCategory, string> = { product_shoot: 'تصوير منتجات', interview: 'مقابلة', reel_filming: 'تصوير ريلز', social_video: 'فيديو سوشيال', photo_session: 'جلسة تصوير', edit_only: 'مونتاج فقط', motion_graphics: 'موشن جرافيك', campaign_package: 'حزمة حملة', cutdown: 'نسخة مختصرة', teaser: 'تيزر' };
export const JOB_CAT_EN: Record<JobCategory, string> = { product_shoot: 'Product Shoot', interview: 'Interview', reel_filming: 'Reel Filming', social_video: 'Social Video', photo_session: 'Photo Session', edit_only: 'Edit Only', motion_graphics: 'Motion Graphics', campaign_package: 'Campaign Package', cutdown: 'Cutdown', teaser: 'Teaser' };
export const JOB_CAT_ICON: Record<JobCategory, string> = { product_shoot: '📸', interview: '🎤', reel_filming: '🎬', social_video: '📱', photo_session: '📷', edit_only: '✂️', motion_graphics: '🎞️', campaign_package: '📦', cutdown: '✂️', teaser: '🎥' };

// ─── Team (from central teamStore) ───
export const PROD_TEAM = TEAM.filter(m =>
    m.skills.includes('video') || m.skills.includes('photography') || m.skills.includes('editing') ||
    m.skills.includes('motion') || m.roles.includes('operations_manager')
).map(m => ({
    id: m.id, name: m.name, nameEn: m.nameEn,
    role: m.position, roleEn: m.positionEn,
    avatar: m.avatar, color: m.color,
}));

// ─── Interfaces ───
export interface StoryboardScene {
    sceneId: string; order: number; objective: string; visualNotes: string;
    cameraNotes: string; shotType: string; transition: string; audioNotes: string;
    textNotes: string; durationSec: number; references: string[];
    requiredAssets: string[]; requiredProps: string[]; requiredPeople: string[];
    locationNotes: string;
}
export interface Storyboard {
    storyboardId: string; parentType: 'campaign' | 'job'; parentId: string;
    title: string; scenes: StoryboardScene[]; generatedByAI: boolean;
    version: number; comments: { id: string; sender: string; text: string; time: string }[];
    createdAt: string; updatedAt: string;
}
export interface MediaFile {
    fileId: string; jobId: string; campaignId?: string; clientId: string;
    name: string; type: 'footage' | 'raw' | 'rough_cut' | 'final_cut' | 'thumbnail' | 'subtitle' | 'audio' | 'export_package';
    version: number; uploadedBy: string; uploadedAt: string; approved: boolean; size?: string;
}
export interface ProductionJob {
    productionJobId: string; clientId: string; campaignId?: string;
    linkedMarketingTaskId: string; linkedCreativeRequestId: string;
    title: string; category: JobCategory; platform: string; deliverableType: string;
    objective: string; approvedConceptSummary: string;
    storyboardId?: string; shotList: string[]; location: string;
    talent: string[]; equipmentNotes: string; deadline: string;
    owner: string; assignedTeam: string[]; stage: ProdStage;
    cdPrelimApproval: boolean; amFinalApproval: boolean;
    blocked: boolean; blockReason: string;
    mediaFiles: string[]; editVersions: { v: number; label: string; date: string; notes: string }[];
    finalDeliverable?: string; exportPackage?: string;
    createdAt: string; updatedAt: string;
}
export interface Campaign {
    campaignId: string; clientId: string; name: string; nameEn: string;
    objective: string; platforms: string[]; targetAudience: string;
    linkedMarketingContext: string; linkedCreativeConceptIds: string[];
    linkedProductionJobIds: string[]; deliverablesList: string[];
    storyboardId?: string; milestones: { label: string; date: string; done: boolean }[];
    owner: string; cdApproval: boolean; amApproval: boolean;
    status: 'planning' | 'in_production' | 'review' | 'complete';
    progress: number; notes: string; attachments: string[];
    createdAt: string; updatedAt: string;
}
export interface ProdCalendarEvent {
    id: string; clientId: string; jobId?: string; campaignId?: string;
    title: string; date: string; type: 'shoot' | 'edit_deadline' | 'review' | 'delivery' | 'milestone' | 'booking';
    color: string;
}
export interface ProdActivity {
    id: string; clientId: string; jobId?: string; campaignId?: string;
    text: string; textEn: string; icon: string; time: string;
    type: 'info' | 'warning' | 'success' | 'danger';
}

const PS_STORAGE_KEY = 'remark_pm_production_store';

// ═══ STORE ═══
export class ProductionStore {
    campaigns: Campaign[] = [];
    jobs: ProductionJob[] = [];
    storyboards: Storyboard[] = [];
    mediaFiles: MediaFile[] = [];
    calendarEvents: ProdCalendarEvent[] = [];
    activities: ProdActivity[] = [];
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
            const data = { campaigns: this.campaigns, jobs: this.jobs, storyboards: this.storyboards, mediaFiles: this.mediaFiles, calendarEvents: this.calendarEvents, activities: this.activities };
            localStorage.setItem(PS_STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.warn('ProductionStore save failed:', e); }
    }
    private _loadFromStorage(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(PS_STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.campaigns = data.campaigns || []; this.jobs = data.jobs || []; this.storyboards = data.storyboards || [];
            this.mediaFiles = data.mediaFiles || []; this.calendarEvents = data.calendarEvents || []; this.activities = data.activities || [];
            return this.jobs.length > 0;
        } catch { return false; }
    }

    // ── Queries ──
    getClientJobs(clientId: string) { return this.jobs.filter(j => j.clientId === clientId); }
    getClientCampaigns(clientId: string) { return this.campaigns.filter(c => c.clientId === clientId); }
    getCampaignJobs(campaignId: string) { return this.jobs.filter(j => j.campaignId === campaignId); }
    getJobMedia(jobId: string) { return this.mediaFiles.filter(f => f.jobId === jobId); }
    getStoryboard(id: string) { return this.storyboards.find(s => s.storyboardId === id); }
    getJob(id: string) { return this.jobs.find(j => j.productionJobId === id); }
    getCampaign(id: string) { return this.campaigns.find(c => c.campaignId === id); }
    getClientCalendar(clientId: string) { return this.calendarEvents.filter(e => e.clientId === clientId); }
    getClientActivities(clientId: string) { return this.activities.filter(a => a.clientId === clientId); }
    getClientMedia(clientId: string) { return this.mediaFiles.filter(f => f.clientId === clientId); }

    // ── KPIs ──
    getKPIs() {
        const j = this.jobs;
        return {
            activeJobs: j.filter(x => x.stage !== 'delivered' && x.stage !== 'package_ready').length,
            scheduledShoots: j.filter(x => x.stage === 'ready_to_shoot' || x.stage === 'scheduling').length,
            editing: j.filter(x => x.stage === 'editing').length,
            blocked: j.filter(x => x.blocked).length,
            awaitingApprovals: j.filter(x => x.stage === 'awaiting_concept').length,
            readyForDelivery: j.filter(x => x.stage === 'package_ready').length,
            overdue: j.filter(x => x.deadline && new Date(x.deadline) < new Date() && x.stage !== 'delivered').length,
            delivered: j.filter(x => x.stage === 'delivered').length,
            total: j.length,
            onTimeRate: j.length > 0 ? Math.round((j.filter(x => x.stage === 'delivered').length / Math.max(j.length, 1)) * 100) : 0,
        };
    }

    // ── Stage Transitions ──
    moveJobToStage(jobId: string, stage: ProdStage, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        if (stage !== 'awaiting_concept' && !j.cdPrelimApproval) { this.toast(lang === 'ar' ? '⛔ بانتظار موافقة المدير الإبداعي' : '⛔ Awaiting CD approval', 'error'); return; }
        if (PROD_STAGES.indexOf(stage) >= 2 && !j.amFinalApproval) { this.toast(lang === 'ar' ? '⛔ بانتظار موافقة مدير الحسابات' : '⛔ Awaiting AM approval', 'error'); return; }
        j.stage = stage; j.updatedAt = new Date().toISOString();
        const sm = PROD_STAGE_META[stage];
        this.toast(lang === 'ar' ? `✅ ${j.title} → ${sm.ar}` : `✅ ${j.title} → ${sm.en}`);
        this.activities.unshift({ id: `pa${Date.now()}`, clientId: j.clientId, jobId, text: `📌 ${j.title} — ${sm.ar}`, textEn: `📌 ${j.title} — ${sm.en}`, icon: '📌', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'info' });
        this.emit();
        if (stage === 'delivered') this._handoffToPublishing(j, lang);
    }

    // ── Production → Publishing Handoff ──
    private _handoffToPublishing(j: ProductionJob, lang: 'ar' | 'en' = 'ar') {
        try {
            const { getPublishingStore } = require('./publishingStore');
            const pbs = getPublishingStore();
            // Dedup: don't create if already linked by title + client
            if (pbs.posts.some((p: any) => p.clientId === j.clientId && p.title === j.title)) return;
            const catMap: Record<string, string> = { reel_filming: 'reel', social_video: 'story', product_shoot: 'social_post', campaign_package: 'carousel', edit_only: 'social_post', motion_graphics: 'reel', photo_session: 'social_post', interview: 'reel', cutdown: 'reel', teaser: 'reel' };
            const postCat = catMap[j.category] || 'social_post';
            const schedDate = new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0];
            pbs.createPost({
                clientId: j.clientId, title: j.title, category: postCat as any, platform: j.platform || 'Instagram',
                caption: '', hashtags: [], scheduledDate: schedDate, scheduledTime: '18:00',
                stage: 'content_received' as any, owner: '', assignedTeam: [],
                approved: false, blocked: false, blockReason: '', linkedCreativeRequestId: j.linkedCreativeRequestId || '',
                linkedProductionJobId: j.productionJobId, notes: '',
            }, lang);
        } catch (e) { console.warn('Production→Publishing handoff error:', e); }
    }

    setCDApproval(jobId: string, approved: boolean, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        j.cdPrelimApproval = approved; j.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? (approved ? '✅ موافقة المدير الإبداعي' : '❌ رفض المدير الإبداعي') : (approved ? '✅ CD Approved' : '❌ CD Rejected'));
        this.emit();
    }
    setAMApproval(jobId: string, approved: boolean, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        j.amFinalApproval = approved; j.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? (approved ? '✅ موافقة مدير الحسابات' : '❌ رفض مدير الحسابات') : (approved ? '✅ AM Approved' : '❌ AM Rejected'));
        this.emit();
    }

    // ── Create ──
    createCampaign(c: Omit<Campaign, 'campaignId' | 'createdAt' | 'updatedAt' | 'progress' | 'linkedProductionJobIds'>, lang: 'ar' | 'en' = 'ar') {
        const now = new Date().toISOString();
        const campaign: Campaign = { ...c, campaignId: `camp_${Date.now()}`, progress: 0, linkedProductionJobIds: [], createdAt: now, updatedAt: now };
        this.campaigns.push(campaign);
        this.toast(lang === 'ar' ? `🎬 حملة جديدة: ${c.name}` : `🎬 New campaign: ${c.nameEn}`);
        this.emit(); return campaign;
    }
    createJob(j: Omit<ProductionJob, 'productionJobId' | 'createdAt' | 'updatedAt' | 'editVersions' | 'mediaFiles'>, lang: 'ar' | 'en' = 'ar') {
        const now = new Date().toISOString();
        const job: ProductionJob = { ...j, productionJobId: `pj_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, editVersions: [], mediaFiles: [], createdAt: now, updatedAt: now };
        this.jobs.push(job);
        if (j.campaignId) { const c = this.getCampaign(j.campaignId); if (c) { c.linkedProductionJobIds.push(job.productionJobId); c.updatedAt = now; } }
        this.toast(lang === 'ar' ? `🎬 مهمة إنتاج: ${j.title}` : `🎬 Production job: ${j.title}`);
        this.activities.unshift({ id: `pa${Date.now()}`, clientId: j.clientId, jobId: job.productionJobId, text: `🆕 مهمة إنتاج جديدة: ${j.title}`, textEn: `🆕 New production job: ${j.title}`, icon: '🆕', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'success' });
        this.emit(); return job;
    }

    // ── AI Storyboard ──
    generateAIStoryboard(parentType: 'campaign' | 'job', parentId: string, brief: string, lang: 'ar' | 'en' = 'ar') {
        const scenes: StoryboardScene[] = [
            { sceneId: `sc_${Date.now()}_1`, order: 1, objective: lang === 'ar' ? 'افتتاحية — جذب الانتباه' : 'Opening — Hook', visualNotes: lang === 'ar' ? 'لقطة واسعة مع حركة كاميرا بطيئة' : 'Wide shot with slow camera movement', cameraNotes: 'Gimbal / Dolly', shotType: 'Wide', transition: 'Fade In', audioNotes: lang === 'ar' ? 'موسيقى خفيفة + صوت محيط' : 'Soft music + ambient', textNotes: lang === 'ar' ? 'عنوان رئيسي متحرك' : 'Animated main title', durationSec: 5, references: [], requiredAssets: ['Logo'], requiredProps: [], requiredPeople: ['Talent'], locationNotes: lang === 'ar' ? 'موقع التصوير الرئيسي' : 'Main location' },
            { sceneId: `sc_${Date.now()}_2`, order: 2, objective: lang === 'ar' ? 'عرض المنتج / الخدمة' : 'Product / Service Showcase', visualNotes: lang === 'ar' ? 'لقطات قريبة للمنتج مع إضاءة مميزة' : 'Close-up product shots with key lighting', cameraNotes: 'Macro / Close-up', shotType: 'Close-up', transition: 'Cut', audioNotes: lang === 'ar' ? 'تعليق صوتي واضح' : 'Clear voiceover', textNotes: lang === 'ar' ? 'نقاط رئيسية متحركة' : 'Animated key points', durationSec: 8, references: [], requiredAssets: ['Product samples'], requiredProps: ['Display stand'], requiredPeople: ['Hand model'], locationNotes: lang === 'ar' ? 'استوديو' : 'Studio' },
            { sceneId: `sc_${Date.now()}_3`, order: 3, objective: lang === 'ar' ? 'شهادة / تفاعل حقيقي' : 'Testimonial / Real interaction', visualNotes: lang === 'ar' ? 'لقطة متوسطة — وجه المتحدث' : 'Medium shot — speaker face', cameraNotes: 'Handheld natural', shotType: 'Medium', transition: 'Cross dissolve', audioNotes: lang === 'ar' ? 'صوت مباشر + موسيقى خفيفة' : 'Direct audio + light music', textNotes: lang === 'ar' ? 'اسم وعنوان المتحدث' : 'Speaker name & title', durationSec: 10, references: [], requiredAssets: [], requiredProps: ['Mic'], requiredPeople: ['Guest speaker'], locationNotes: lang === 'ar' ? 'موقع العميل' : 'Client location' },
            { sceneId: `sc_${Date.now()}_4`, order: 4, objective: lang === 'ar' ? 'دعوة للتفاعل (CTA)' : 'Call to Action (CTA)', visualNotes: lang === 'ar' ? 'لقطة ختامية مع العلامة التجارية' : 'Closing shot with branding', cameraNotes: 'Static / Slider', shotType: 'Medium-Wide', transition: 'Fade Out', audioNotes: lang === 'ar' ? 'موسيقى تصاعدية + CTA صوتي' : 'Rising music + voice CTA', textNotes: lang === 'ar' ? 'رابط / رقم تواصل / QR' : 'Link / contact / QR', durationSec: 5, references: [], requiredAssets: ['Brand kit', 'Contact info'], requiredProps: [], requiredPeople: [], locationNotes: '' },
        ];
        const sb: Storyboard = { storyboardId: `sb_${Date.now()}`, parentType, parentId, title: brief || (lang === 'ar' ? 'ستوري بورد AI' : 'AI Storyboard'), scenes, generatedByAI: true, version: 1, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.storyboards.push(sb);
        if (parentType === 'job') { const j = this.getJob(parentId); if (j) j.storyboardId = sb.storyboardId; }
        else { const c = this.getCampaign(parentId); if (c) c.storyboardId = sb.storyboardId; }
        this.toast(lang === 'ar' ? `🤖 تم إنشاء ستوري بورد بالذكاء الاصطناعي` : `🤖 AI Storyboard generated`);
        this.emit(); return sb;
    }

    // ── Media ──
    uploadMedia(jobId: string, name: string, type: MediaFile['type'], uploadedBy: string, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        const f: MediaFile = { fileId: `mf_${Date.now()}`, jobId, campaignId: j.campaignId, clientId: j.clientId, name, type, version: 1, uploadedBy, uploadedAt: new Date().toISOString(), approved: false, size: `${(Math.random() * 500 + 50).toFixed(0)} MB` };
        this.mediaFiles.push(f); j.mediaFiles.push(f.fileId); j.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `📤 تم رفع: ${name}` : `📤 Uploaded: ${name}`);
        this.emit(); return f;
    }
    addVersion(jobId: string, label: string, notes: string, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        j.editVersions.push({ v: j.editVersions.length + 1, label, date: new Date().toISOString().split('T')[0], notes });
        j.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `🔄 نسخة جديدة: ${label}` : `🔄 New version: ${label}`);
        this.emit();
    }

    // ── Export ──
    exportJobPackage(jobId: string) {
        const j = this.getJob(jobId); if (!j) return null;
        const sb = j.storyboardId ? this.getStoryboard(j.storyboardId) : null;
        const media = this.getJobMedia(jobId);
        return { job: j, storyboard: sb, media, exportedAt: new Date().toISOString() };
    }
    exportCampaignPackage(campaignId: string) {
        const c = this.getCampaign(campaignId); if (!c) return null;
        const jobs = this.getCampaignJobs(campaignId);
        const sb = c.storyboardId ? this.getStoryboard(c.storyboardId) : null;
        return { campaign: c, jobs, storyboard: sb, exportedAt: new Date().toISOString() };
    }
    exportMonthlyReport(lang: 'ar' | 'en' = 'ar') {
        const kpis = this.getKPIs();
        return { title: lang === 'ar' ? 'تقرير الإنتاج الشهري' : 'Monthly Production Report', date: new Date().toISOString().split('T')[0], kpis, campaigns: this.campaigns.map(c => ({ name: c.name, status: c.status, progress: c.progress })), jobsSummary: this.jobs.map(j => ({ title: j.title, stage: j.stage, client: j.clientId })), exportedAt: new Date().toISOString() };
    }

    // ── Block ──
    markBlocked(jobId: string, reason: string, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        j.blocked = true; j.blockReason = reason; j.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `⛔ ${j.title} — محظور` : `⛔ ${j.title} — Blocked`, 'error');
        this.emit();
    }
    unblock(jobId: string, lang: 'ar' | 'en' = 'ar') {
        const j = this.getJob(jobId); if (!j) return;
        j.blocked = false; j.blockReason = ''; j.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `✅ ${j.title} — تم رفع الحظر` : `✅ ${j.title} — Unblocked`);
        this.emit();
    }

    // ── Seed ──
    private _seed() {
        const now = new Date();
        const d = (offset: number) => new Date(now.getTime() + offset * 864e5).toISOString().split('T')[0];
        const ts = () => now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const iso = () => now.toISOString();

        this.campaigns = [
            {
                campaignId: 'camp_warda_march', clientId: 'client_warda', name: 'حملة الوردة — مارس', nameEn: 'Al Warda — March Campaign',
                objective: 'زيادة التفاعل 30% مع عروض الربيع', platforms: ['Instagram', 'TikTok', 'Snapchat'],
                targetAudience: 'شباب 18-35 — بغداد', linkedMarketingContext: 'حملة ربيعية', linkedCreativeConceptIds: ['req_w1', 'req_w2'],
                linkedProductionJobIds: ['pj_w1', 'pj_w2', 'pj_w3'], deliverablesList: ['3 ريلز', '5 بوستات', '10 ستوريز', 'تصوير منيو'],
                owner: 'يوسف كاظم', cdApproval: true, amApproval: true,
                milestones: [{ label: 'بدء التصوير', date: d(3), done: true }, { label: 'مراجعة المحتوى', date: d(7), done: false }],
                status: 'in_production', progress: 45, notes: '', attachments: [],
                createdAt: iso(), updatedAt: iso(),
            },
            {
                campaignId: 'camp_zamzam_launch', clientId: 'client_zamzam', name: 'إطلاق مشروع النور', nameEn: 'Noor Project Launch',
                objective: 'تغطية إعلامية لإطلاق المرحلة الأولى', platforms: ['Instagram', 'Facebook', 'YouTube'],
                targetAudience: 'مستثمرون ومشترون — العراق', linkedMarketingContext: 'إطلاق عقاري', linkedCreativeConceptIds: ['req_z1', 'req_z2'],
                linkedProductionJobIds: ['pj_z1', 'pj_z2'], deliverablesList: ['فيديو إطلاق', 'تصوير جوي', '5 بوستات'],
                milestones: [{ label: 'تصوير جوي', date: d(10), done: false }, { label: 'تسليم نهائي', date: d(20), done: false }],
                owner: 'يوسف كاظم', cdApproval: true, amApproval: false,
                status: 'planning', progress: 20, notes: 'بانتظار موافقة مدير الحسابات', attachments: [],
                createdAt: iso(), updatedAt: iso(),
            },
        ];

        const mkJob = (id: string, cId: string, title: string, cat: JobCategory, stage: ProdStage, owner: string, team: string[], deadline: string, cdOk: boolean, amOk: boolean, campId?: string, linked?: string): ProductionJob => ({
            productionJobId: id, clientId: cId, campaignId: campId, linkedMarketingTaskId: '', linkedCreativeRequestId: linked || '',
            title, category: cat, platform: 'Instagram', deliverableType: cat, objective: `هدف ${title}`, approvedConceptSummary: '',
            shotList: [], location: '', talent: [], equipmentNotes: '', deadline,
            owner, assignedTeam: team, stage, cdPrelimApproval: cdOk, amFinalApproval: amOk,
            blocked: false, blockReason: '', mediaFiles: [], editVersions: [],
            createdAt: iso(), updatedAt: iso(),
        });

        this.jobs = [
            mkJob('pj_w1', 'client_warda', 'ريلز المطبخ — خلف الكواليس', 'reel_filming', 'shooting', 'حسنين', ['حسنين', 'موسى'], d(3), true, true, 'camp_warda_march', 'req_w2'),
            mkJob('pj_w2', 'client_warda', 'تصوير منيو جديد', 'product_shoot', 'scheduling', 'مصطفى عجر', ['مصطفى عجر'], d(7), true, true, 'camp_warda_march'),
            mkJob('pj_w3', 'client_warda', 'ستوري عروض الأسبوع — موشن', 'social_video', 'editing', 'حسنين', ['حسنين'], d(2), true, true, 'camp_warda_march', 'req_w3'),
            mkJob('pj_r1', 'client_rayhana', 'فيديو جولة المرحلة الثانية', 'reel_filming', 'storyboard_planning', 'مصطفى عجر', ['مصطفى عجر', 'موسى'], d(10), true, true, undefined, 'req_r2'),
            mkJob('pj_r2', 'client_rayhana', 'تصوير واجهات المبنى', 'photo_session', 'ready_to_shoot', 'حسنين', ['حسنين'], d(5), true, true),
            mkJob('pj_k1', 'client_kalfink', 'ريلز تجربة المنتج', 'reel_filming', 'awaiting_concept', 'موسى', ['موسى'], d(12), false, false, undefined, 'req_k2'),
            mkJob('pj_z1', 'client_zamzam', 'فيديو إطلاق مشروع النور', 'reel_filming', 'production_intake', 'يوسف كاظم', ['حسنين', 'مصطفى عجر', 'موسى'], d(14), true, false, 'camp_zamzam_launch', 'req_z1'),
            mkJob('pj_z2', 'client_zamzam', 'تصوير جوي — مشروع النور', 'product_shoot', 'scheduling', 'مصطفى عجر', ['مصطفى عجر'], d(9), true, true, 'camp_zamzam_launch', 'req_z2'),
            mkJob('pj_d1', 'client_warda', 'ريلز ترويجي — عروض فبراير', 'reel_filming', 'delivered', 'حسنين', ['حسنين'], d(-5), true, true),
            mkJob('pj_d2', 'client_kalfink', 'تصوير منتجات العناية', 'product_shoot', 'delivered', 'مصطفى عجر', ['مصطفى عجر'], d(-3), true, true),
        ];

        this.calendarEvents = [
            { id: 'pce1', clientId: 'client_warda', jobId: 'pj_w1', title: '🎬 تصوير ريلز المطبخ', date: d(1), type: 'shoot', color: '#f59e0b' },
            { id: 'pce2', clientId: 'client_warda', jobId: 'pj_w2', title: '📸 تصوير المنيو', date: d(7), type: 'shoot', color: '#3b82f6' },
            { id: 'pce3', clientId: 'client_warda', jobId: 'pj_w3', title: '✂️ تسليم مونتاج ستوري', date: d(2), type: 'edit_deadline', color: '#ef4444' },
            { id: 'pce4', clientId: 'client_rayhana', jobId: 'pj_r2', title: '📸 تصوير واجهات', date: d(5), type: 'shoot', color: '#8b5cf6' },
            { id: 'pce5', clientId: 'client_zamzam', jobId: 'pj_z2', title: '📸 تصوير جوي', date: d(9), type: 'shoot', color: '#22c55e' },
            { id: 'pce6', clientId: 'client_zamzam', jobId: 'pj_z1', title: '📋 مراجعة فيديو الإطلاق', date: d(14), type: 'review', color: '#ec4899' },
        ];

        this.activities = [
            { id: 'pa1', clientId: 'client_warda', jobId: 'pj_w1', text: '🎬 تصوير ريلز المطبخ — جاري التنفيذ', textEn: '🎬 Kitchen Reel — Shooting in progress', icon: '🎬', time: ts(), type: 'info' },
            { id: 'pa2', clientId: 'client_warda', jobId: 'pj_w3', text: '✂️ مونتاج ستوري العروض — جاري', textEn: '✂️ Offers Story editing — In progress', icon: '✂️', time: ts(), type: 'info' },
            { id: 'pa3', clientId: 'client_rayhana', jobId: 'pj_r1', text: '📋 ستوري بورد فيديو الجولة — قيد الإعداد', textEn: '📋 Tour video storyboard — In preparation', icon: '📋', time: ts(), type: 'info' },
            { id: 'pa4', clientId: 'client_zamzam', jobId: 'pj_z1', text: '🆕 فيديو إطلاق مشروع النور', textEn: '🆕 Noor Launch Video', icon: '🆕', time: ts(), type: 'success' },
            { id: 'pa5', clientId: 'client_warda', jobId: 'pj_d1', text: '✅ ريلز عروض فبراير — تم التسليم', textEn: '✅ Feb Offers Reel — Delivered', icon: '✅', time: ts(), type: 'success' },
            { id: 'pa6', clientId: 'client_kalfink', jobId: 'pj_d2', text: '✅ تصوير منتجات العناية — تم التسليم', textEn: '✅ Skincare Shoot — Delivered', icon: '✅', time: ts(), type: 'success' },
        ];

        this._saveToStorage();
    }
}

let _ps: ProductionStore | null = null;
export function getProductionStore(): ProductionStore { if (!_ps) _ps = new ProductionStore(); return _ps; }
