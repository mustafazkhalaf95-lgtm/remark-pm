'use strict';
import type { JobCategory } from './productionStore';
/* Remark Creative — Data Store v4 — Stage Ownership Model */

// ─── 10-Stage Pipeline with Ownership ───
export const PIPELINE_STAGES = [
    'new_request', 'brief_completion', 'inspiration_ready', 'concept_in_progress',
    'awaiting_concept_approval', 'creative_execution', 'cd_review',
    'revisions_required', 'final_approval', 'ready_for_handoff',
] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export interface StageInfo { ar: string; en: string; owner_ar: string; owner_en: string; nextAction_ar: string; nextAction_en: string; color: string; }
export const STAGE_META: Record<PipelineStage, StageInfo> = {
    new_request: { ar: 'طلب جديد', en: 'New Request', owner_ar: 'النظام', owner_en: 'System', nextAction_ar: 'إكمال البريف', nextAction_en: 'Complete Brief', color: '#3b82f6' },
    brief_completion: { ar: 'إكمال البريف', en: 'Brief Completion', owner_ar: 'مدير الحساب', owner_en: 'Account Manager', nextAction_ar: 'تجهيز الإلهام', nextAction_en: 'Prepare Inspiration', color: '#f59e0b' },
    inspiration_ready: { ar: 'الإلهام جاهز', en: 'Inspiration Ready', owner_ar: 'مشترك', owner_en: 'Shared', nextAction_ar: 'بدء المفهوم', nextAction_en: 'Start Concept', color: '#06b6d4' },
    concept_in_progress: { ar: 'تطوير المفهوم', en: 'Concept Development', owner_ar: 'الفريق الإبداعي', owner_en: 'Creative Team', nextAction_ar: 'تقديم للموافقة', nextAction_en: 'Submit for Approval', color: '#8b5cf6' },
    awaiting_concept_approval: { ar: 'موافقة المفهوم', en: 'Concept Approval', owner_ar: 'مدير الحساب', owner_en: 'Account Manager', nextAction_ar: 'الموافقة أو التعديل', nextAction_en: 'Approve or Revise', color: '#ec4899' },
    creative_execution: { ar: 'التنفيذ الإبداعي', en: 'Creative Execution', owner_ar: 'الفريق الإبداعي', owner_en: 'Creative Team', nextAction_ar: 'إرسال للمراجعة', nextAction_en: 'Send to Review', color: '#8b5cf6' },
    cd_review: { ar: 'مراجعة المدير', en: 'CD Review', owner_ar: 'المدير الإبداعي', owner_en: 'Creative Director', nextAction_ar: 'الموافقة أو التعديل', nextAction_en: 'Approve or Revise', color: '#ef4444' },
    revisions_required: { ar: 'يحتاج تعديلات', en: 'Revisions Required', owner_ar: 'الفريق الإبداعي', owner_en: 'Creative Team', nextAction_ar: 'إعادة التقديم', nextAction_en: 'Resubmit', color: '#f97316' },
    final_approval: { ar: 'الموافقة النهائية', en: 'Final Approval', owner_ar: 'مدير الحساب', owner_en: 'Account Manager', nextAction_ar: 'الاعتماد النهائي', nextAction_en: 'Final Approve', color: '#22c55e' },
    ready_for_handoff: { ar: 'جاهز للتسليم', en: 'Ready for Handoff', owner_ar: '—', owner_en: '—', nextAction_ar: 'مكتمل', nextAction_en: 'Complete', color: '#059669' },
};

// ─── Categories ───
export const REQUEST_CATEGORIES = ['social_post', 'story_set', 'reel', 'ad_creative', 'offer_design', 'menu_design', 'product_shoot', 'video_edit', 'banner', 'campaign_package', 'brand_asset', 'other'] as const;
export type RequestCategory = typeof REQUEST_CATEGORIES[number];
export const CATEGORY_LABELS_AR: Record<RequestCategory, string> = { social_post: 'بوست', story_set: 'ستوري', reel: 'ريلز', ad_creative: 'إعلان', offer_design: 'تصميم عرض', menu_design: 'منيو', product_shoot: 'تصوير', video_edit: 'مونتاج', banner: 'بانر', campaign_package: 'حملة', brand_asset: 'هوية', other: 'أخرى' };
export const CATEGORY_LABELS_EN: Record<RequestCategory, string> = { social_post: 'Post', story_set: 'Story', reel: 'Reel', ad_creative: 'Ad', offer_design: 'Offer', menu_design: 'Menu', product_shoot: 'Shoot', video_edit: 'Video', banner: 'Banner', campaign_package: 'Campaign', brand_asset: 'Brand', other: 'Other' };
export const CATEGORY_ICONS: Record<RequestCategory, string> = { social_post: '📱', story_set: '📸', reel: '🎬', ad_creative: '📢', offer_design: '🎯', menu_design: '🍽️', product_shoot: '📷', video_edit: '✂️', banner: '🖼️', campaign_package: '📦', brand_asset: '🎨', other: '📎' };

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type InspirationSource = 'ai_assistant' | 'creative_team' | 'account_manager';

export interface RequestComment { id: string; sender: string; avatar: string; text: string; time: string; type: 'human' | 'ai_client' | 'system'; }

export interface CreativeRequest {
    requestId: string; clientId: string; linkedMarketingTaskId: string;
    title: string; category: RequestCategory; objective: string; brief: string;
    deliverables: string[]; platform: string; format: string;
    priority: Priority; dueDate: string; status: PipelineStage;
    assignedTo: string; reviewRound: number;
    conceptApproved: boolean; finalApproved: boolean; blocked: boolean; blockReason: string;
    dependencies: string[]; missingAssetsFlag: boolean;
    aiClientFeedback: string; aiClientScore: string;
    creativeDirectorNotes: string; internalTeamNotes: string;
    attachments: string[]; finalVideoUrl?: string;
    linkedInspirationIds: string[];
    versionHistory: { version: number; note: string; date: string; by: string }[];
    comments: RequestComment[];
    createdAt: string; updatedAt: string;
    // Cross-board linking
    sourceBoard: 'creative' | 'marketing';
    linkedMarketingTaskTitle: string;
    syncStatus: 'synced' | 'pending' | 'none';
    lastSyncedAt: string;
    approvalState?: 'pending' | 'approved' | 'rejected';
}

export interface AIClientPersona { communicationStyle: string; formalityLevel: string; feedbackBehavior: string; visualSensitivity: string; boldVsSafe: string; speedExpectations: string; approvalHabits: string; toneExpectations: string; brandConservatism: string; summary: string; }
export interface CreativeProfile { clientId: string; clientName: string; industry: string; planType: string; campaignDirection: string; visualStyle: string; brandTone: string; primaryColor: string; secondaryColor: string; typography: string; targetAudience: string; approvedReferences: string[]; brandFiles: string[]; socialLinks: string[]; creativeNotes: string; clientPreferences: string[]; clientDislikes: string[]; aiPersona: AIClientPersona; }
export interface BrandAsset { id: string; clientId: string; category: string; name: string; description: string; fileUrl: string; createdAt: string; approved?: boolean; }
export interface CreativeChatMessage { id: string; clientId: string; sender: string; avatar: string; text: string; time: string; type: 'human' | 'ai_client' | 'ai_coordinator' | 'system'; }
export interface CreativeCalendarEvent { id: string; clientId: string; requestId?: string; title: string; date: string; type: string; color: string; }
export interface SharedClient { clientId: string; name: string; nameEn: string; sector: string; sectorEn: string; planType: string; budget: string; socialLinks: string[]; avatar: string; createdAt: string; linkedFromMarketing?: boolean; marketingConvertedAt?: string; marketingTaskCount?: number; marketingTaskTitles?: string[]; }
export interface ActivityItem { id: string; clientId: string; requestId?: string; text: string; textEn: string; icon: string; time: string; type: 'info' | 'warning' | 'success' | 'danger'; }

export interface InspirationItem {
    inspirationId: string; clientId: string; linkedRequestId?: string;
    title: string; titleEn: string; regionType: 'global' | 'local';
    category: string; thumbnail: string; mediaType: 'video' | 'image' | 'campaign';
    sourceType: 'internal' | 'external'; sourceUrl: string;
    notes: string; whySelected: string; whySelectedEn: string;
    whatToObserve: string[]; whatToObserveEn: string[];
    tags: string[]; pinned: boolean; recommended: boolean;
    source: InspirationSource;
    createdAt: string;
}

export interface ShowcaseVideo {
    showcaseId: string; clientId: string; requestId: string;
    title: string; titleEn: string; videoUrl: string; thumbnail: string;
    duration: string; approvedAt: string; approvedBy: string; uploadedBy: string;
    category: RequestCategory; featured: boolean; createdAt: string;
}

export const TEAM_MEMBERS = [
    { id: 'layla', name: 'ليلى', nameEn: 'Layla', role: 'مصممة', roleEn: 'Designer', avatar: '👩‍🎨', color: '#8b5cf6' },
    { id: 'ahmed', name: 'أحمد', nameEn: 'Ahmed', role: 'مصور/مونتير', roleEn: 'Photographer', avatar: '📸', color: '#06b6d4' },
    { id: 'sara', name: 'سارة', nameEn: 'Sara', role: 'مصممة', roleEn: 'Designer', avatar: '🎨', color: '#ec4899' },
    { id: 'omar', name: 'عمر', nameEn: 'Omar', role: 'مونتير فيديو', roleEn: 'Video Editor', avatar: '🎬', color: '#f59e0b' },
];

const ACTIVE_STAGES: PipelineStage[] = ['new_request', 'brief_completion', 'inspiration_ready', 'concept_in_progress', 'awaiting_concept_approval', 'creative_execution', 'cd_review', 'revisions_required', 'final_approval'];

const CS_STORAGE_KEY = 'remark_pm_creative_store';

// ═══ STORE ═══
class CreativeStore {
    clients: SharedClient[] = []; profiles: CreativeProfile[] = []; requests: CreativeRequest[] = [];
    brandAssets: BrandAsset[] = []; chatMessages: CreativeChatMessage[] = []; calendarEvents: CreativeCalendarEvent[] = [];
    activities: ActivityItem[] = []; inspirations: InspirationItem[] = []; showcaseVideos: ShowcaseVideo[] = [];
    listeners = new Set<() => void>(); private _v = 0; private _toast = ''; private _toastType: 'success' | 'error' | 'info' = 'info';

    constructor() { if (!this._loadFromStorage()) this._seed(); }
    subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    getVersion() { return this._v; } private _batching = false; private _batchDirty = false; batchStart() { this._batching = true; this._batchDirty = false; } batchEnd() { this._batching = false; if (this._batchDirty) { this._batchDirty = false; this._v++; this._saveToStorage(); this.listeners.forEach(f => f()); } } private emit() { if (this._batching) { this._batchDirty = true; return; } this._v++; this._saveToStorage(); this.listeners.forEach(f => f()); }
    getToast() { const m = this._toast; const t = this._toastType; this._toast = ''; return { msg: m, type: t }; }
    private toast(m: string, t: 'success' | 'error' | 'info' = 'success') { this._toast = m; this._toastType = t; this.emit(); }

    private _saveToStorage() {
        if (typeof window === 'undefined') return;
        try {
            const data = { clients: this.clients, profiles: this.profiles, requests: this.requests, brandAssets: this.brandAssets, chatMessages: this.chatMessages, calendarEvents: this.calendarEvents, activities: this.activities, inspirations: this.inspirations, showcaseVideos: this.showcaseVideos };
            localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.warn('CreativeStore save failed:', e); }
    }
    private _loadFromStorage(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(CS_STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.clients = data.clients || []; this.profiles = data.profiles || []; this.requests = data.requests || [];
            this.brandAssets = data.brandAssets || []; this.chatMessages = data.chatMessages || []; this.calendarEvents = data.calendarEvents || [];
            this.activities = data.activities || []; this.inspirations = data.inspirations || []; this.showcaseVideos = data.showcaseVideos || [];
            return this.clients.length > 0;
        } catch { return false; }
    }

    // Queries
    getClient(id: string) { return this.clients.find(c => c.clientId === id); }
    getProfile(id: string) { return this.profiles.find(p => p.clientId === id); }
    getClientRequests(id: string) { return this.requests.filter(r => r.clientId === id); }
    getClientChat(id: string) { return this.chatMessages.filter(m => m.clientId === id); }
    getClientAssets(id: string) { return this.brandAssets.filter(a => a.clientId === id); }
    getClientCalendar(id: string) { return this.calendarEvents.filter(e => e.clientId === id); }
    getClientActivities(id: string) { return this.activities.filter(a => a.clientId === id); }
    getClientInspirations(id: string) { return this.inspirations.filter(i => i.clientId === id); }
    getClientShowcase(id: string) { return this.showcaseVideos.filter(v => v.clientId === id); }
    isActive(r: CreativeRequest) { return ACTIVE_STAGES.includes(r.status); }

    // ── Stage Transitions ──
    moveToStage(reqId: string, stage: PipelineStage, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.status = stage; r.updatedAt = new Date().toISOString();
        if (stage === 'revisions_required') r.reviewRound++;
        const sm = STAGE_META[stage];
        this.activities.unshift({ id: `a${Date.now()}`, clientId: r.clientId, requestId: reqId, text: `${r.title} → ${sm.ar}`, textEn: `${r.title} → ${sm.en}`, icon: stage === 'ready_for_handoff' ? '✅' : '🔄', time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: stage === 'ready_for_handoff' ? 'success' : 'info' });
        this.toast(lang === 'ar' ? `✅ ${r.title} → ${sm.ar}` : `✅ ${r.title} → ${sm.en}`); this.emit();
        if (stage === 'ready_for_handoff') this._handoffToProduction(r, lang);
    }

    approveConcept(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.conceptApproved = true; r.status = 'creative_execution'; r.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `✅ تمت موافقة المفهوم — "${r.title}"` : `✅ Concept approved — "${r.title}"`); this.emit();
    }

    requestConceptChanges(reqId: string, note: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.conceptApproved = false; r.status = 'concept_in_progress'; r.reviewRound++; r.updatedAt = new Date().toISOString();
        if (note) r.comments.push({ id: `c${Date.now()}`, sender: lang === 'ar' ? 'مدير الحساب' : 'Account Manager', avatar: '👔', text: note, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' });
        this.toast(lang === 'ar' ? `🔄 طُلبت تعديلات على مفهوم "${r.title}"` : `🔄 Concept changes for "${r.title}"`); this.emit();
    }

    approveFinal(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.finalApproved = true; r.status = 'ready_for_handoff'; r.updatedAt = new Date().toISOString();
        if (r.finalVideoUrl) this._addShowcase(r);
        this.toast(lang === 'ar' ? `🎉 "${r.title}" — اعتماد نهائي وجاهز للتسليم` : `🎉 "${r.title}" — Final approved`); this.emit();
        this._handoffToProduction(r, lang);
    }

    requestFinalChanges(reqId: string, note: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.finalApproved = false; r.status = 'revisions_required'; r.reviewRound++; r.updatedAt = new Date().toISOString();
        if (note) r.comments.push({ id: `c${Date.now()}`, sender: lang === 'ar' ? 'مدير الحساب' : 'Account Manager', avatar: '👔', text: note, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' });
        this.toast(lang === 'ar' ? `🔄 طُلبت تعديلات نهائية — "${r.title}"` : `🔄 Final changes — "${r.title}"`); this.emit();
    }

    cdApprove(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.status = 'final_approval'; r.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `✅ المدير الإبداعي وافق — "${r.title}"` : `✅ CD approved — "${r.title}"`); this.emit();
    }

    cdRequestChanges(reqId: string, note: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.status = 'revisions_required'; r.reviewRound++; r.updatedAt = new Date().toISOString();
        if (note) { r.creativeDirectorNotes = note; r.comments.push({ id: `c${Date.now()}`, sender: lang === 'ar' ? 'المدير الإبداعي' : 'Creative Director', avatar: '🎨', text: note, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' }); }
        this.toast(lang === 'ar' ? `🔄 المدير طلب تعديلات — "${r.title}"` : `🔄 CD changes — "${r.title}"`); this.emit();
    }

    markBlocked(reqId: string, reason: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.blocked = true; r.blockReason = reason; r.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `⛔ "${r.title}" — محظور: ${reason}` : `⛔ "${r.title}" blocked: ${reason}`, 'info'); this.emit();
    }

    unblock(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.blocked = false; r.blockReason = ''; r.updatedAt = new Date().toISOString();
        this.toast(lang === 'ar' ? `✅ "${r.title}" — تم رفع الحظر` : `✅ "${r.title}" unblocked`); this.emit();
    }

    addChatMessage(cId: string, msg: Omit<CreativeChatMessage, 'id' | 'clientId'>) { this.chatMessages.push({ ...msg, id: `m${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, clientId: cId }); this.emit(); }
    addRequestComment(rId: string, c: Omit<RequestComment, 'id'>) { const r = this.requests.find(x => x.requestId === rId); if (r) { r.comments.push({ ...c, id: `c${Date.now()}` }); this.emit(); } }

    uploadAttachment(rId: string, name: string, lang: 'ar' | 'en' = 'ar') { const r = this.requests.find(x => x.requestId === rId); if (!r) return; r.attachments.push(name); r.updatedAt = new Date().toISOString(); this.toast(lang === 'ar' ? `📎 "${name}"` : `📎 "${name}"`); this.emit(); }
    uploadFinalVideo(rId: string, name: string, lang: 'ar' | 'en' = 'ar') { const r = this.requests.find(x => x.requestId === rId); if (!r) return; r.finalVideoUrl = name; r.attachments.push(name); r.updatedAt = new Date().toISOString(); if (r.status === 'ready_for_handoff') this._addShowcase(r); this.toast(lang === 'ar' ? `🎬 "${name}"` : `🎬 "${name}"`); this.emit(); }
    addBrandAsset(cId: string, a: Omit<BrandAsset, 'id' | 'clientId' | 'createdAt'>, lang: 'ar' | 'en' = 'ar') { this.brandAssets.push({ ...a, id: `as${Date.now()}`, clientId: cId, createdAt: new Date().toISOString().split('T')[0] }); this.toast(lang === 'ar' ? `📁 "${a.name}"` : `📁 "${a.name}"`); this.emit(); }

    addInspiration(cId: string, i: Omit<InspirationItem, 'inspirationId' | 'clientId' | 'createdAt'>, lang: 'ar' | 'en' = 'ar') { this.inspirations.push({ ...i, inspirationId: `in${Date.now()}`, clientId: cId, createdAt: new Date().toISOString().split('T')[0] }); this.toast(lang === 'ar' ? `💡 "${i.title}"` : `💡 "${i.title}"`); this.emit(); }
    togglePin(id: string) { const i = this.inspirations.find(x => x.inspirationId === id); if (i) { i.pinned = !i.pinned; this.emit(); } }
    toggleRecommend(id: string) { const i = this.inspirations.find(x => x.inspirationId === id); if (i) { i.recommended = !i.recommended; this.emit(); } }
    linkInspirationToRequest(inspId: string, reqId: string) { const r = this.requests.find(x => x.requestId === reqId); if (r && !r.linkedInspirationIds.includes(inspId)) { r.linkedInspirationIds.push(inspId); this.emit(); } }

    syncClient(c: SharedClient) { const i = this.clients.findIndex(x => x.clientId === c.clientId); if (i >= 0) this.clients[i] = { ...this.clients[i], ...c }; else { this.clients.push(c); this.profiles.push(this._dp(c)); } this.emit(); }

    // ── Cross-Board Linking ──
    createRequestFromMarketingTask(clientId: string, taskTitle: string, marketingTaskId: string, lang: 'ar' | 'en' = 'ar') {
        const cat: RequestCategory = taskTitle.includes('ريلز') || taskTitle.includes('فيديو') ? 'reel' : taskTitle.includes('تصوير') || taskTitle.includes('Shoot') ? 'product_shoot' : taskTitle.includes('منيو') || taskTitle.includes('Menu') ? 'menu_design' : 'social_post';
        const now = new Date();
        const req: CreativeRequest = { requestId: `req_mkt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, clientId, linkedMarketingTaskId: marketingTaskId, title: taskTitle, category: cat, objective: '', brief: '', deliverables: [], platform: 'Instagram', format: '1080×1080', priority: 'medium', dueDate: new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0], status: 'new_request', assignedTo: '', reviewRound: 0, conceptApproved: false, finalApproved: false, blocked: false, blockReason: '', dependencies: [], missingAssetsFlag: false, aiClientFeedback: '', aiClientScore: '', creativeDirectorNotes: '', internalTeamNotes: '', attachments: [], linkedInspirationIds: [], versionHistory: [], comments: [], createdAt: now.toISOString(), updatedAt: now.toISOString(), sourceBoard: 'marketing', linkedMarketingTaskTitle: taskTitle, syncStatus: 'synced', lastSyncedAt: now.toISOString() };
        this.requests.push(req);
        // Update client marketing task count
        const cl = this.getClient(clientId);
        if (cl) { cl.marketingTaskCount = (cl.marketingTaskCount || 0) + 1; if (!cl.marketingTaskTitles) cl.marketingTaskTitles = []; cl.marketingTaskTitles.push(taskTitle); }
        this.toast(lang === 'ar' ? `🔗 طلب إبداعي من التسويق — "${taskTitle}"` : `🔗 Creative request from Marketing — "${taskTitle}"`);
        this.emit();
        return req;
    }

    getLinkedMarketingContext(clientId: string) {
        const cl = this.getClient(clientId);
        const linkedReqs = this.requests.filter(r => r.clientId === clientId && r.linkedMarketingTaskId);
        return { linked: cl?.linkedFromMarketing || false, convertedAt: cl?.marketingConvertedAt || '', taskCount: cl?.marketingTaskCount || linkedReqs.length, taskTitles: cl?.marketingTaskTitles || linkedReqs.map(r => r.linkedMarketingTaskTitle), creativeRequestCount: linkedReqs.length, latestSync: linkedReqs.reduce((latest, r) => r.lastSyncedAt > latest ? r.lastSyncedAt : latest, ''), linkedRequests: linkedReqs };
    }

    getCreativeProgressForMarketing(clientId: string) {
        const reqs = this.getClientRequests(clientId);
        const total = reqs.length;
        const done = reqs.filter(r => r.status === 'ready_for_handoff').length;
        const active = reqs.filter(r => this.isActive(r)).length;
        const blocked = reqs.filter(r => r.blocked).length;
        const latestStage = reqs.length > 0 ? reqs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] : null;
        return { total, done, active, blocked, latestStage: latestStage ? STAGE_META[latestStage.status].ar : '', latestStageEn: latestStage ? STAGE_META[latestStage.status].en : '', latestTitle: latestStage?.title || '' };
    }

    // ── Bidirectional Sync (Rule 19) ──
    updateMarketingTaskStatus(marketingTaskId: string, status: string, dueDate?: string, lang: 'ar' | 'en' = 'ar') {
        const req = this.requests.find(r => r.linkedMarketingTaskId === marketingTaskId);
        if (!req) return;
        req.syncStatus = 'synced'; req.lastSyncedAt = new Date().toISOString();
        if (dueDate) req.dueDate = dueDate;
        this.activities.unshift({ id: `a${Date.now()}`, clientId: req.clientId, requestId: req.requestId, text: `🔄 تزامن مع التسويق — "${req.title}"`, textEn: `🔄 Synced from Marketing — "${req.title}"`, icon: '🔄', time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'info' });
        this.emit();
    }

    // ── Guard: Prevent removing marketing-linked clients (Rules 13, 14, 17) ──
    removeClient(clientId: string) {
        const cl = this.getClient(clientId);
        if (cl?.linkedFromMarketing) { this.toast('⛔ Cannot remove a marketing-linked client. The client must remain visible in both boards.', 'error'); return false; }
        this.clients = this.clients.filter(c => c.clientId !== clientId);
        this.profiles = this.profiles.filter(p => p.clientId !== clientId);
        this.emit(); return true;
    }

    // ── Guard: Prevent removing marketing-sourced requests (Rules 13, 15, 17) ──
    removeRequest(requestId: string) {
        const req = this.requests.find(r => r.requestId === requestId);
        if (req?.sourceBoard === 'marketing') { this.toast('⛔ Cannot remove a marketing-sourced request. The original task must remain traceable.', 'error'); return false; }
        this.requests = this.requests.filter(r => r.requestId !== requestId);
        this.emit(); return true;
    }

    // ── Creative → Production Handoff ──
    private _handoffToProduction(r: CreativeRequest, lang: 'ar' | 'en' = 'ar') {
        try {
            const { getProductionStore } = require('./productionStore');
            const ps = getProductionStore();
            // Dedup: don't create if already linked
            if (ps.jobs.some((j: any) => j.linkedCreativeRequestId === r.requestId)) return;
            const catMap: Record<string, JobCategory> = { reel: 'reel_filming', product_shoot: 'product_shoot', video_edit: 'edit_only', campaign_package: 'campaign_package', story_set: 'social_video', social_post: 'social_video', ad_creative: 'social_video', menu_design: 'product_shoot', other: 'edit_only' };
            const jobCat = catMap[r.category] || 'edit_only';
            ps.createJob({
                clientId: r.clientId, linkedMarketingTaskId: r.linkedMarketingTaskId || '', linkedCreativeRequestId: r.requestId,
                title: r.title, category: jobCat, platform: r.platform, deliverableType: r.format || r.platform,
                objective: r.objective || r.title, approvedConceptSummary: r.creativeDirectorNotes || '',
                shotList: [], location: '', talent: [], equipmentNotes: '',
                deadline: r.dueDate || new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0],
                owner: '', assignedTeam: [], stage: 'production_intake' as any,
                cdPrelimApproval: true, amFinalApproval: r.finalApproved,
                blocked: false, blockReason: '', finalDeliverable: r.finalVideoUrl || '', exportPackage: '',
            }, lang);
        } catch (e) { console.warn('Creative→Production handoff error:', e); }
    }

    private _addShowcase(r: CreativeRequest) { if (!r.finalVideoUrl || this.showcaseVideos.some(v => v.requestId === r.requestId)) return; const c = this.getClient(r.clientId); this.showcaseVideos.push({ showcaseId: `sh${Date.now()}`, clientId: r.clientId, requestId: r.requestId, title: r.title, titleEn: r.title, videoUrl: r.finalVideoUrl, thumbnail: '🎬', duration: '0:30', approvedAt: new Date().toISOString().split('T')[0], approvedBy: 'مدير الحساب', uploadedBy: r.assignedTo || 'الفريق', category: r.category, featured: false, createdAt: new Date().toISOString().split('T')[0] }); }

    private _dp(c: SharedClient): CreativeProfile { return { clientId: c.clientId, clientName: c.name, industry: c.sector, planType: c.planType, campaignDirection: '', visualStyle: '', brandTone: '', primaryColor: '#6366f1', secondaryColor: '#1e1b4b', typography: 'Noto Sans Arabic', targetAudience: '', approvedReferences: [], brandFiles: [], socialLinks: c.socialLinks || [], creativeNotes: '', clientPreferences: [], clientDislikes: [], aiPersona: { communicationStyle: 'مباشر', formalityLevel: 'متوسط', feedbackBehavior: 'سريعة', visualSensitivity: 'عالية', boldVsSafe: 'متوازن', speedExpectations: 'سريعة', approvalHabits: 'جولة', toneExpectations: 'مهني', brandConservatism: 'محافظ', summary: 'عميل جديد.' } }; }

    // ═══ SEED ═══
    private _seed() {
        const now = new Date(); const d = (o: number) => new Date(now.getTime() + o * 864e5).toISOString().split('T')[0];
        // Clients
        this.clients.push({ clientId: 'client_warda', name: 'الوردة', nameEn: 'Al-Warda', sector: 'مطاعم ومقاهي', sectorEn: 'Restaurants', planType: 'شهرية', budget: '5,000', socialLinks: [], avatar: '🌹', createdAt: '2026-03-01', linkedFromMarketing: true, marketingConvertedAt: '2026-03-01', marketingTaskCount: 6, marketingTaskTitles: ['محتوى سوشيال', 'تصوير منتجات', 'تصميم منيو', 'فيديو ريلز', 'حملة رمضان', 'تصميم عروض'] });
        this.clients.push({ clientId: 'client_rayhana', name: 'ريحانة', nameEn: 'Rayhana', sector: 'أزياء ومجوهرات', sectorEn: 'Fashion & Jewelry', planType: 'ربع سنوية', budget: '12,000', socialLinks: [], avatar: '💎', createdAt: '2026-02-15', linkedFromMarketing: true, marketingConvertedAt: '2026-02-15', marketingTaskCount: 4, marketingTaskTitles: ['تصوير مجموعة ربيع', 'بوست إطلاق', 'ريلز Unboxing', 'إعلان Shopping'] });
        // Profiles
        this.profiles.push({ clientId: 'client_warda', clientName: 'الوردة', industry: 'مطاعم ومقاهي', planType: 'شهرية', campaignDirection: 'تعزيز الحضور الرقمي', visualStyle: 'دافئ، ألوان ترابية', brandTone: 'ودّي، شهي', primaryColor: '#D4451A', secondaryColor: '#2C1810', typography: 'Noto Sans Arabic', targetAudience: 'شباب 18-35', approvedReferences: [], brandFiles: ['logo_warda.svg'], socialLinks: [], creativeNotes: 'يفضّل الصور الحقيقية.', clientPreferences: ['تصوير طعام حقيقي', 'ألوان دافئة', 'ستوريز تفاعلية'], clientDislikes: ['تصاميم مزدحمة', 'صور Stock'], aiPersona: { communicationStyle: 'مباشر', formalityLevel: 'شبه رسمي', feedbackBehavior: 'واضحة ومحددة', visualSensitivity: 'عالية جداً', boldVsSafe: 'آمن بالهوية', speedExpectations: '48 ساعة', approvalHabits: 'جولة واحدة', toneExpectations: 'دافئ', brandConservatism: 'محافظ مع انفتاح', summary: 'عميل واعٍ بصرياً.' } });
        this.profiles.push({ clientId: 'client_rayhana', clientName: 'ريحانة', industry: 'أزياء ومجوهرات', planType: 'ربع سنوية', campaignDirection: 'إطلاق مجموعة ربيع', visualStyle: 'أنيق، إضاءة دراماتيكية', brandTone: 'فاخر، أنوثة عصرية', primaryColor: '#B8860B', secondaryColor: '#1C1C1C', typography: 'Cormorant Garamond', targetAudience: 'نساء 22-40', approvedReferences: [], brandFiles: ['logo_rayhana.svg'], socialLinks: [], creativeNotes: 'هوية فاخرة متسقة.', clientPreferences: ['تصوير احترافي', 'ألوان ذهبية', 'Unboxing فيديو'], clientDislikes: ['ألوان صارخة', 'فلاتر ثقيلة'], aiPersona: { communicationStyle: 'رسمي', formalityLevel: 'رسمي جداً', feedbackBehavior: 'تفصيلية', visualSensitivity: 'حادة', boldVsSafe: 'أناقة راقية', speedExpectations: '3-5 أيام', approvalHabits: '2-3 جولات', toneExpectations: 'فاخر', brandConservatism: 'محافظة جداً', summary: 'دقيقة ومتطلبة.' } });

        // Requests — الوردة (new stages)
        const mkReq = (id: string, cId: string, title: string, cat: RequestCategory, status: PipelineStage, assignee: string, prio: Priority, due: string, concept: boolean, final_: boolean, blocked: boolean, blockR: string, ai: string, cd: string, video?: string, mktTaskId?: string): CreativeRequest => ({ requestId: id, clientId: cId, linkedMarketingTaskId: mktTaskId || '', title, category: cat, objective: '', brief: '', deliverables: [], platform: 'Instagram', format: '1080×1080', priority: prio, dueDate: due, status, assignedTo: assignee, reviewRound: 0, conceptApproved: concept, finalApproved: final_, blocked, blockReason: blockR, dependencies: [], missingAssetsFlag: blocked, aiClientFeedback: ai, aiClientScore: ai ? 'strong_match' : '', creativeDirectorNotes: cd, internalTeamNotes: '', attachments: [], finalVideoUrl: video, linkedInspirationIds: [], versionHistory: [], comments: [], createdAt: new Date(now.getTime() - 5 * 864e5).toISOString(), updatedAt: now.toISOString(), sourceBoard: mktTaskId ? 'marketing' : 'creative', linkedMarketingTaskTitle: mktTaskId ? title : '', syncStatus: mktTaskId ? 'synced' : 'none', lastSyncedAt: mktTaskId ? now.toISOString() : '' });

        this.requests.push(
            mkReq('req_w01', 'client_warda', 'تصميم بوست عرض رمضان', 'social_post', 'creative_execution', 'ليلى (مصممة)', 'high', d(2), true, false, false, '', 'تأكدوا من وضوح السعر.', 'استخدموا التصوير الجديد.', undefined, 'mkt_w_01'),
            mkReq('req_w02', 'client_warda', 'ريلز "خلف الكواليس"', 'reel', 'brief_completion', 'أحمد (مصور)', 'medium', d(5), false, false, true, 'ننتظر التصوير في المطبخ', '', '', undefined, 'mkt_w_02'),
            mkReq('req_w03', 'client_warda', 'ستوري تفاعلية — استفتاء', 'story_set', 'awaiting_concept_approval', 'ليلى (مصممة)', 'medium', d(3), false, false, false, '', '', 'عدّلي الخلفية.', undefined, 'mkt_w_03'),
            mkReq('req_w04', 'client_warda', 'إعلان حملة رمضان', 'ad_creative', 'ready_for_handoff', 'ليلى (مصممة)', 'urgent', d(1), true, true, false, '', 'ممتاز!', 'عمل رائع.', 'ramadan_ad_final.mp4', 'mkt_w_04'),
            mkReq('req_w05', 'client_warda', 'تصوير أطباق — ربيع', 'product_shoot', 'inspiration_ready', 'أحمد (مصور)', 'high', d(4), false, false, false, '', '', 'جهّز عدسة ماكرو.', undefined, 'mkt_w_05'),
            mkReq('req_w06', 'client_warda', 'تصميم منيو رمضان', 'menu_design', 'new_request', '', 'high', d(6), false, false, true, 'قائمة الأطباق لم تصل', '', '', undefined, 'mkt_w_06'),
        );
        this.requests.push(
            mkReq('req_r01', 'client_rayhana', 'تصوير مجموعة ربيع 2026', 'product_shoot', 'creative_execution', 'أحمد (مصور)', 'urgent', d(3), true, false, false, '', '', 'الإضاءة مفتاح.', undefined, 'mkt_r_01'),
            mkReq('req_r02', 'client_rayhana', 'بوست إطلاق المجموعة', 'social_post', 'brief_completion', 'سارة (مصممة)', 'high', d(5), false, false, true, 'ننتظر صور التصوير', '', '', undefined, 'mkt_r_02'),
            mkReq('req_r03', 'client_rayhana', 'ريلز Unboxing مجوهرات', 'reel', 'concept_in_progress', 'عمر (مونتير)', 'medium', d(7), false, false, false, '', 'ASMR مهم', 'لا موسيقى عالية.', undefined, 'mkt_r_03'),
            mkReq('req_r04', 'client_rayhana', 'إعلان Instagram Shopping', 'ad_creative', 'cd_review', 'سارة (مصممة)', 'high', d(8), true, false, false, '', 'CTA أوضح', 'كبّري الزر.', undefined, 'mkt_r_04'),
        );

        // Assets
        this.brandAssets.push(
            { id: 'a1', clientId: 'client_warda', category: 'logo', name: 'شعار الوردة', description: 'النسخة الأساسية', fileUrl: 'logo.svg', createdAt: '2026-01-15', approved: true },
            { id: 'a2', clientId: 'client_warda', category: 'identity', name: 'دليل الهوية v2', description: 'ألوان وخطوط', fileUrl: 'brand.pdf', createdAt: '2026-01-20', approved: true },
            { id: 'a3', clientId: 'client_warda', category: 'product_image', name: 'طبق الكبسة', description: 'Flat lay', fileUrl: 'kabsa.jpg', createdAt: '2026-02-10', approved: true },
            { id: 'a4', clientId: 'client_rayhana', category: 'logo', name: 'شعار ريحانة', description: 'ذهبي على أسود', fileUrl: 'logo_r.svg', createdAt: '2026-02-01', approved: true },
            { id: 'a5', clientId: 'client_rayhana', category: 'product_image', name: 'خاتم الياقوت', description: 'تصوير استوديو', fileUrl: 'ring.jpg', createdAt: '2026-02-20', approved: true },
        );

        // Chat
        this.chatMessages.push(
            { id: 'ch1', clientId: 'client_warda', sender: 'المدير الإبداعي', avatar: '🎨', text: 'صباح الخير! 6 طلبات + تصوير الأحد.', time: '09:00', type: 'human' },
            { id: 'ch2', clientId: 'client_warda', sender: 'ليلى', avatar: '👩‍🎨', text: 'بوست رمضان شبه جاهز.', time: '09:15', type: 'human' },
            { id: 'ch3', clientId: 'client_warda', sender: 'AI العميل', avatar: '🤖', text: '💡 تأكدوا أن السعر واضح في بوست رمضان.', time: '09:30', type: 'ai_client' },
            { id: 'ch4', clientId: 'client_rayhana', sender: 'المدير الإبداعي', avatar: '🎨', text: 'فريق ريحانة — التصوير غداً.', time: '08:30', type: 'human' },
            { id: 'ch5', clientId: 'client_rayhana', sender: 'أحمد', avatar: '📸', text: 'جاهز! الاستوديو محجوز.', time: '08:45', type: 'human' },
            { id: 'ch6', clientId: 'client_rayhana', sender: 'AI العميل', avatar: '🤖', text: '⚠️ ريحانة دقيقة بالألوان. لون الذهب: #B8860B.', time: '09:20', type: 'ai_client' },
        );

        // Calendar
        this.calendarEvents.push(
            { id: 'e1', clientId: 'client_warda', requestId: 'req_w01', title: 'تسليم بوست رمضان', date: d(2), type: 'deadline', color: '#ef4444' },
            { id: 'e2', clientId: 'client_warda', requestId: 'req_w02', title: 'تصوير خلف الكواليس', date: d(4), type: 'shoot', color: '#8b5cf6' },
            { id: 'e3', clientId: 'client_warda', requestId: 'req_w04', title: 'إطلاق حملة رمضان', date: d(3), type: 'publish', color: '#22c55e' },
            { id: 'e4', clientId: 'client_rayhana', requestId: 'req_r01', title: 'تصوير مجموعة ربيع', date: d(1), type: 'shoot', color: '#8b5cf6' },
            { id: 'e5', clientId: 'client_rayhana', requestId: 'req_r02', title: 'تسليم بوست الإطلاق', date: d(5), type: 'deadline', color: '#ef4444' },
        );

        // Activities
        this.activities = [
            { id: 'a1', clientId: 'client_warda', requestId: 'req_w04', text: '✅ إعلان رمضان — جاهز للتسليم', textEn: '✅ Ramadan ad — ready', icon: '✅', time: '10:30', type: 'success' },
            { id: 'a2', clientId: 'client_rayhana', requestId: 'req_r01', text: '📸 تصوير ريحانة غداً', textEn: '📸 Rayhana shoot tomorrow', icon: '📸', time: '10:15', type: 'info' },
            { id: 'a3', clientId: 'client_warda', requestId: 'req_w06', text: '⛔ منيو رمضان — محظور: ملفات مفقودة', textEn: '⛔ Menu blocked', icon: '⛔', time: '09:45', type: 'warning' },
        ];

        // Showcase
        this.showcaseVideos.push({ showcaseId: 'sh1', clientId: 'client_warda', requestId: 'req_w04', title: 'إعلان حملة رمضان', titleEn: 'Ramadan Campaign', videoUrl: 'ramadan_ad_final.mp4', thumbnail: '🎬', duration: '0:30', approvedAt: d(-1), approvedBy: 'مدير الحساب', uploadedBy: 'ليلى', category: 'ad_creative', featured: true, createdAt: d(-1) });

        // Inspirations — 3 sources
        this.inspirations.push(
            { inspirationId: 'in1', clientId: 'client_warda', title: 'إعلان Nando\'s رمضان', titleEn: 'Nando\'s Ramadan', regionType: 'global', category: 'إعلان مطاعم', thumbnail: '🎥', mediaType: 'video', sourceType: 'external', sourceUrl: 'https://youtube.com/example', notes: '', whySelected: 'سرد قصصي دافئ مناسب للمطاعم', whySelectedEn: 'Warm storytelling', whatToObserve: ['الافتتاحية العاطفية', 'إيقاع المونتاج', 'إضاءة الطعام'], whatToObserveEn: ['Emotional opening', 'Edit pacing', 'Food lighting'], tags: ['رمضان'], pinned: true, recommended: true, source: 'ai_assistant', createdAt: '2026-03-01' },
            { inspirationId: 'in2', clientId: 'client_warda', title: 'تصوير Flat Lay احترافي', titleEn: 'Pro Flat Lay', regionType: 'global', category: 'تصوير منتجات', thumbnail: '📷', mediaType: 'image', sourceType: 'external', sourceUrl: 'https://pinterest.com/example', notes: '', whySelected: 'مرجع لتصوير أطباق الربيع', whySelectedEn: 'Spring menu reference', whatToObserve: ['زاوية التصوير', 'الإضاءة الطبيعية', 'ترتيب العناصر'], whatToObserveEn: ['Camera angle', 'Natural light', 'Arrangement'], tags: ['تصوير'], pinned: true, recommended: false, source: 'creative_team', createdAt: '2026-03-02' },
            { inspirationId: 'in3', clientId: 'client_warda', title: 'حملة مطعم محلي — بغداد', titleEn: 'Local Restaurant — Baghdad', regionType: 'local', category: 'حملة محلية', thumbnail: '📱', mediaType: 'campaign', sourceType: 'external', sourceUrl: '', notes: '', whySelected: 'نموذج محلي ناجح', whySelectedEn: 'Local success model', whatToObserve: ['أسلوب الكتابة', 'التصوير الواقعي', 'CTAs'], whatToObserveEn: ['Writing style', 'Authentic photos', 'CTAs'], tags: ['محلي'], pinned: false, recommended: false, source: 'account_manager', createdAt: '2026-03-03' },
            { inspirationId: 'in4', clientId: 'client_rayhana', title: 'Cartier Panthère', titleEn: 'Cartier Panthère', regionType: 'global', category: 'مجوهرات فاخرة', thumbnail: '💎', mediaType: 'video', sourceType: 'external', sourceUrl: 'https://youtube.com/cartier', notes: '', whySelected: 'معيار ذهبي للمجوهرات', whySelectedEn: 'Gold standard', whatToObserve: ['الإضاءة الدراماتيكية', 'حركة الكاميرا', 'التفاصيل الماكرو'], whatToObserveEn: ['Dramatic lighting', 'Camera movement', 'Macro details'], tags: ['مجوهرات'], pinned: true, recommended: true, source: 'creative_team', createdAt: '2026-02-28' },
            { inspirationId: 'in5', clientId: 'client_rayhana', title: 'Unboxing ASMR مجوهرات', titleEn: 'ASMR Unboxing', regionType: 'global', category: 'ريلز', thumbnail: '🎬', mediaType: 'video', sourceType: 'external', sourceUrl: '', notes: '', whySelected: 'مرجع مباشر للريلز', whySelectedEn: 'Direct reference', whatToObserve: ['جودة الصوت', 'حركة الأيدي', 'الإضاءة الناعمة'], whatToObserveEn: ['ASMR quality', 'Hand movements', 'Soft lighting'], tags: ['ASMR'], pinned: true, recommended: false, source: 'ai_assistant', createdAt: '2026-03-01' },
            { inspirationId: 'in6', clientId: 'client_rayhana', title: 'عرض إكسسوارات — دبي', titleEn: 'Dubai Accessories', regionType: 'local', category: 'تصوير منتجات', thumbnail: '📸', mediaType: 'image', sourceType: 'external', sourceUrl: '', notes: '', whySelected: 'مرجع محلي أنيق', whySelectedEn: 'Local elegant ref', whatToObserve: ['ترتيب المنتج', 'الزوايا', 'الانعكاسات'], whatToObserveEn: ['Product arrangement', 'Angles', 'Reflections'], tags: ['محلي'], pinned: false, recommended: false, source: 'account_manager', createdAt: '2026-03-02' },
        );
    }
}

let _s: CreativeStore | null = null;
export function getCreativeStore(): CreativeStore { if (!_s) _s = new CreativeStore(); return _s; }
