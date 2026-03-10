'use strict';
import type { JobCategory } from './productionStore';
import { TEAM, type TeamMember as CentralTeamMember, getMember, getDesigners, getVideographers } from './teamStore';
/* Remark Creative — Data Store v5 — 6-Stage Pipeline with Hybrid Assignment */

// ─── 6-Stage Pipeline ───
export const PIPELINE_STAGES = [
    'brief_ready', 'concept_writing', 'concept_approval',
    'creative_execution', 'review_revisions', 'approved_ready',
] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export interface StageInfo { ar: string; en: string; owner_ar: string; owner_en: string; nextAction_ar: string; nextAction_en: string; color: string; }
export const STAGE_META: Record<PipelineStage, StageInfo> = {
    brief_ready: { ar: 'البريف جاهز', en: 'Brief Ready', owner_ar: 'مدير الحساب', owner_en: 'Account Manager', nextAction_ar: 'تعيين كاتب المفهوم', nextAction_en: 'Assign Concept Writer', color: '#3b82f6' },
    concept_writing: { ar: 'كتابة المفهوم', en: 'Concept Writing', owner_ar: 'كاتب المفهوم المعيّن', owner_en: 'Assigned Concept Writer', nextAction_ar: 'إرسال للموافقة', nextAction_en: 'Submit for Approval', color: '#8b5cf6' },
    concept_approval: { ar: 'موافقة المفهوم', en: 'Concept Approval', owner_ar: 'المدير الإبداعي + مدير الحساب', owner_en: 'Creative Director + Account Manager', nextAction_ar: 'الموافقة المزدوجة', nextAction_en: 'Dual Approval', color: '#ec4899' },
    creative_execution: { ar: 'التنفيذ الإبداعي', en: 'Creative Execution', owner_ar: 'المنفذ المعيّن', owner_en: 'Assigned Executor', nextAction_ar: 'إرسال للمراجعة', nextAction_en: 'Send to Review', color: '#f59e0b' },
    review_revisions: { ar: 'المراجعة والتعديلات', en: 'Review & Revisions', owner_ar: 'المدير الإبداعي', owner_en: 'Creative Director', nextAction_ar: 'الموافقة أو التعديل', nextAction_en: 'Approve or Revise', color: '#ef4444' },
    approved_ready: { ar: 'معتمد وجاهز', en: 'Approved / Ready', owner_ar: 'النظام', owner_en: 'System', nextAction_ar: 'مكتمل', nextAction_en: 'Complete', color: '#059669' },
};

// Stage migration map (old 10-stage → new 6-stage)
const STAGE_MIGRATION: Record<string, PipelineStage> = {
    new_request: 'brief_ready', brief_completion: 'brief_ready', inspiration_ready: 'brief_ready',
    concept_in_progress: 'concept_writing', awaiting_concept_approval: 'concept_approval',
    creative_execution: 'creative_execution', cd_review: 'review_revisions',
    revisions_required: 'review_revisions', final_approval: 'review_revisions',
    ready_for_handoff: 'approved_ready',
};

// ─── Categories ───
export const REQUEST_CATEGORIES = ['social_post', 'story_set', 'reel', 'ad_creative', 'offer_design', 'menu_design', 'product_shoot', 'video_edit', 'banner', 'campaign_package', 'brand_asset', 'other'] as const;
export type RequestCategory = typeof REQUEST_CATEGORIES[number];
export const CATEGORY_LABELS_AR: Record<RequestCategory, string> = { social_post: 'بوست', story_set: 'ستوري', reel: 'ريلز', ad_creative: 'إعلان', offer_design: 'تصميم عرض', menu_design: 'منيو', product_shoot: 'تصوير', video_edit: 'مونتاج', banner: 'بانر', campaign_package: 'حملة', brand_asset: 'هوية', other: 'أخرى' };
export const CATEGORY_LABELS_EN: Record<RequestCategory, string> = { social_post: 'Post', story_set: 'Story', reel: 'Reel', ad_creative: 'Ad', offer_design: 'Offer', menu_design: 'Menu', product_shoot: 'Shoot', video_edit: 'Video', banner: 'Banner', campaign_package: 'Campaign', brand_asset: 'Brand', other: 'Other' };
export const CATEGORY_ICONS: Record<RequestCategory, string> = { social_post: '📱', story_set: '📸', reel: '🎬', ad_creative: '📢', offer_design: '🎯', menu_design: '🍽️', product_shoot: '📷', video_edit: '✂️', banner: '🖼️', campaign_package: '📦', brand_asset: '🎨', other: '📎' };

// Video categories
export const VIDEO_CATEGORIES: RequestCategory[] = ['reel', 'video_edit', 'product_shoot'];
export function isVideoCategory(cat: RequestCategory): boolean { return VIDEO_CATEGORIES.includes(cat); }

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type InspirationSource = 'ai_assistant' | 'creative_team' | 'account_manager';
export type AssignmentSource = 'ai' | 'creative_director' | 'account_manager' | 'operations_manager' | 'manual';
export type CalendarStatus = 'none' | 'tentative' | 'confirmed';

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
    sourceBoard: 'creative' | 'marketing';
    linkedMarketingTaskTitle: string;
    syncStatus: 'synced' | 'pending' | 'none';
    lastSyncedAt: string;
    approvalState?: 'pending' | 'approved' | 'rejected';
    // ─── V5: Assignment & Approval ───
    conceptWriterId: string;
    conceptAssignedBy: AssignmentSource;
    executorId: string;
    executionAssignedBy: AssignmentSource;
    aiRecommendation: string;
    cdPrelimApproval: boolean;
    cdPrelimApprovedAt: string;
    amFinalIdeaApproval: boolean;
    amFinalApprovedAt: string;
    // ─── V5: Video ───
    isVideoTask: boolean;
    videoOwnerId: string;
    videoAssignedBy: AssignmentSource;
    calendarStatus: CalendarStatus;
    conceptDeliveredToVideo: boolean;
    shootDate: string;
    editDeadline: string;
    // ─── V6: Deadline Orchestration ───
    publishDate: string;
    creativeDueAt: string;
    productionSafetyDueAt: string;
    productionWindowStartAt: string;
    shootCompletionTargetAt: string;
    shootCompletedAt: string;
    editDeliveryDueAt: string;
    scheduleState: 'on_track' | 'at_risk' | 'late' | '';
    deadlineSource: 'publish_based' | 'stage_based' | 'manual_override' | '';
}

export interface AIClientPersona { communicationStyle: string; formalityLevel: string; feedbackBehavior: string; visualSensitivity: string; boldVsSafe: string; speedExpectations: string; approvalHabits: string; toneExpectations: string; brandConservatism: string; summary: string; }
export interface CreativeProfile { clientId: string; clientName: string; industry: string; planType: string; campaignDirection: string; visualStyle: string; brandTone: string; primaryColor: string; secondaryColor: string; typography: string; targetAudience: string; approvedReferences: string[]; brandFiles: string[]; socialLinks: string[]; creativeNotes: string; clientPreferences: string[]; clientDislikes: string[]; aiPersona: AIClientPersona; }
export interface BrandAsset { id: string; clientId: string; category: string; name: string; description: string; fileUrl: string; createdAt: string; approved?: boolean; }
export interface CreativeChatMessage { id: string; clientId: string; sender: string; avatar: string; text: string; time: string; type: 'human' | 'ai_client' | 'ai_coordinator' | 'system'; }
export interface CreativeCalendarEvent { id: string; clientId: string; requestId?: string; title: string; date: string; type: string; color: string; memberId?: string; phase?: 'tentative' | 'confirmed'; }
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

export interface TeamMember {
    id: string; name: string; nameEn: string; role: string; roleEn: string;
    avatar: string; color: string; skills: string[];
}

// Bridge from central team store → creative TeamMember format
export const TEAM_MEMBERS: TeamMember[] = TEAM.map(m => ({
    id: m.id, name: m.name, nameEn: m.nameEn,
    role: m.position, roleEn: m.positionEn,
    avatar: m.avatar, color: m.color, skills: m.skills,
}));

const ACTIVE_STAGES: PipelineStage[] = ['brief_ready', 'concept_writing', 'concept_approval', 'creative_execution', 'review_revisions'];
const DESIGN_MEMBERS = TEAM_MEMBERS.filter(m => m.skills.includes('design') || m.skills.includes('branding') || m.skills.includes('illustration'));
const VIDEO_MEMBERS = TEAM_MEMBERS.filter(m => m.skills.includes('video'));

const CS_STORAGE_KEY = 'remark_pm_creative_store';

// ═══ STORE ═══
class CreativeStore {
    clients: SharedClient[] = []; profiles: CreativeProfile[] = []; requests: CreativeRequest[] = [];
    brandAssets: BrandAsset[] = []; chatMessages: CreativeChatMessage[] = []; calendarEvents: CreativeCalendarEvent[] = [];
    activities: ActivityItem[] = []; inspirations: InspirationItem[] = []; showcaseVideos: ShowcaseVideo[] = [];
    listeners = new Set<() => void>(); private _v = 0; private _toast = ''; private _toastType: 'success' | 'error' | 'info' = 'info';

    constructor() { if (!this._loadFromStorage()) this._seed(); this._migrateStages(); this._syncFromMarketing(); }

    /** Migrate old 10-stage requests to new 6-stage pipeline */
    private _migrateStages() {
        let changed = false;
        for (const r of this.requests) {
            if (!(PIPELINE_STAGES as readonly string[]).includes(r.status)) {
                const newStage = STAGE_MIGRATION[r.status];
                if (newStage) { r.status = newStage; changed = true; }
            }
            // Ensure V5 fields exist
            if (r.conceptWriterId === undefined) r.conceptWriterId = '';
            if (r.conceptAssignedBy === undefined) r.conceptAssignedBy = 'manual';
            if (r.executorId === undefined) r.executorId = r.assignedTo || '';
            if (r.executionAssignedBy === undefined) r.executionAssignedBy = 'manual';
            if (r.aiRecommendation === undefined) r.aiRecommendation = '';
            if (r.cdPrelimApproval === undefined) r.cdPrelimApproval = false;
            if (r.cdPrelimApprovedAt === undefined) r.cdPrelimApprovedAt = '';
            if (r.amFinalIdeaApproval === undefined) r.amFinalIdeaApproval = false;
            if (r.amFinalApprovedAt === undefined) r.amFinalApprovedAt = '';
            if (r.isVideoTask === undefined) r.isVideoTask = isVideoCategory(r.category);
            if (r.videoOwnerId === undefined) r.videoOwnerId = '';
            if (r.videoAssignedBy === undefined) r.videoAssignedBy = 'manual';
            if (r.calendarStatus === undefined) r.calendarStatus = 'none';
            if (r.conceptDeliveredToVideo === undefined) r.conceptDeliveredToVideo = false;
            if (r.shootDate === undefined) r.shootDate = '';
            if (r.editDeadline === undefined) r.editDeadline = '';
        }
        if (changed) this._saveToStorage();
    }

    /** Bridge converted Marketing clients into Creative on startup */
    private _syncFromMarketing() {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('remark_pm_marketing_convertedClients');
            if (!raw) return;
            const converted: any[] = JSON.parse(raw);
            if (!Array.isArray(converted) || converted.length === 0) return;
            let didSync = false;
            for (const cc of converted) {
                const cId = cc.linkedClientId;
                if (!cId || this.clients.some(c => c.clientId === cId)) continue;
                const sc: SharedClient = {
                    clientId: cId, name: cc.name || 'New Client', nameEn: cc.name || 'New Client',
                    sector: cc.data?.industry || '', sectorEn: cc.data?.industry || '',
                    planType: cc.data?.planType || '', budget: cc.data?.agreedBudget || cc.data?.budget || '',
                    socialLinks: cc.data?.socialLinks?.filter((l: string) => l?.trim()) || [],
                    avatar: '✅', createdAt: cc.convertedAt ? cc.convertedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                    linkedFromMarketing: true, marketingConvertedAt: cc.convertedAt || new Date().toISOString(),
                    marketingTaskCount: cc.data?.contentTypes?.length || 0,
                    marketingTaskTitles: cc.data?.contentTypes || [],
                };
                this.clients.push(sc); this.profiles.push(this._dp(sc));
                const contentTypes: string[] = cc.data?.contentTypes || [];
                for (const ct of contentTypes) { this._createRequestFromTitle(cId, ct, `mkt_auto_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`); }
                const now = new Date();
                this.activities.unshift({ id: `a_startsync_${Date.now()}`, clientId: cId, text: `🎉 عميل جديد من التسويق — "${cc.name}"`, textEn: `🎉 New client from Marketing — "${cc.name}"`, icon: '🎉', time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'success' });
                this.chatMessages.push({ id: `m_startsync_${Date.now()}`, clientId: cId, sender: 'النظام', avatar: '🔗', text: `مرحباً! تم ربط "${cc.name}" من قسم التسويق. البريف والمهام جاهزة للبدء.`, time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'system' });
                didSync = true;
            }
            if (didSync) this._saveToStorage();
        } catch (e) { console.warn('_syncFromMarketing error:', e); }
    }

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
            if (typeof data !== 'object' || data === null) return false;
            this.clients = data.clients || []; this.profiles = data.profiles || []; this.requests = data.requests || [];
            this.brandAssets = data.brandAssets || []; this.chatMessages = data.chatMessages || []; this.calendarEvents = data.calendarEvents || [];
            this.activities = data.activities || []; this.inspirations = data.inspirations || []; this.showcaseVideos = data.showcaseVideos || [];
            return true;
        } catch { return false; }
    }

    // ═══ Queries ═══
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

    // ═══ Assignment ═══

    /** Assign concept writer — manual only (CD or AM fallback) */
    assignConceptWriter(reqId: string, writerId: string, assignedBy: 'creative_director' | 'account_manager', lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        const member = TEAM_MEMBERS.find(m => m.id === writerId);
        r.conceptWriterId = writerId;
        r.conceptAssignedBy = assignedBy;
        r.assignedTo = member?.name || writerId;
        if (r.status === 'brief_ready') r.status = 'concept_writing';
        r.updatedAt = new Date().toISOString();
        const byLabel = assignedBy === 'creative_director' ? (lang === 'ar' ? 'المدير الإبداعي' : 'Creative Director') : (lang === 'ar' ? 'مدير الحساب' : 'Account Manager');
        this._activity(r, `✏️ تعيين كاتب المفهوم: ${member?.name || writerId} بواسطة ${byLabel}`, `✏️ Concept writer assigned: ${member?.nameEn || writerId} by ${byLabel}`);
        // Early awareness for video tasks
        if (r.isVideoTask && !r.videoOwnerId) this._notifyVideoAwareness(r, lang);
        this.toast(lang === 'ar' ? `✅ تم تعيين ${member?.name || writerId} ككاتب المفهوم` : `✅ ${member?.nameEn || writerId} assigned as concept writer`); this.emit();
    }

    /** AI-powered assignment recommendation */
    getAiRecommendation(reqId: string): { memberId: string; memberName: string; reason_ar: string; reason_en: string } | null {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return null;
        const pool = r.isVideoTask ? VIDEO_MEMBERS : DESIGN_MEMBERS;
        if (pool.length === 0) return null;
        // Score by: workload (lower = better), skill match, availability
        const scored = pool.map(m => {
            const activeCount = this.requests.filter(x => this.isActive(x) && (x.executorId === m.id || x.assignedTo.includes(m.name))).length;
            const workloadScore = Math.max(0, 10 - activeCount * 2);
            const skillMatch = m.skills.some(s => r.category.includes(s)) ? 3 : 0;
            const urgencyBonus = r.priority === 'urgent' && activeCount === 0 ? 5 : 0;
            return { member: m, score: workloadScore + skillMatch + urgencyBonus, activeCount };
        }).sort((a, b) => b.score - a.score);
        const best = scored[0];
        return {
            memberId: best.member.id,
            memberName: best.member.name,
            reason_ar: `📊 ${best.member.name} — حمل عمل: ${best.activeCount} مهام نشطة، تقييم التوافق: ${best.score}/15`,
            reason_en: `📊 ${best.member.nameEn} — Workload: ${best.activeCount} active tasks, Match score: ${best.score}/15`,
        };
    }

    /** Assign executor (design: AI auto, video: Yousef assigns) */
    assignExecutor(reqId: string, executorId: string, source: AssignmentSource, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        const member = TEAM_MEMBERS.find(m => m.id === executorId);
        r.executorId = executorId;
        r.executionAssignedBy = source;
        r.assignedTo = member?.name || executorId;
        r.updatedAt = new Date().toISOString();
        // Store AI recommendation
        if (source === 'ai') {
            const rec = this.getAiRecommendation(reqId);
            r.aiRecommendation = rec ? (lang === 'ar' ? rec.reason_ar : rec.reason_en) : '';
        }
        const srcLabels: Record<AssignmentSource, [string, string]> = { ai: ['الذكاء الاصطناعي', 'AI'], creative_director: ['المدير الإبداعي', 'CD'], account_manager: ['مدير الحساب', 'AM'], operations_manager: ['مدير العمليات', 'Ops Manager'], manual: ['يدوي', 'Manual'] };
        const srcL = srcLabels[source];
        this._activity(r, `🎯 تعيين المنفذ: ${member?.name || executorId} (${srcL[0]})`, `🎯 Executor: ${member?.nameEn || executorId} (${srcL[1]})`);
        this.toast(lang === 'ar' ? `✅ تم تعيين ${member?.name || executorId} للتنفيذ` : `✅ ${member?.nameEn || executorId} assigned to execute`); this.emit();
    }

    /** Assign video owner — by Operations Manager (Yousef) */
    assignVideoOwner(reqId: string, ownerId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        const member = TEAM_MEMBERS.find(m => m.id === ownerId);
        r.videoOwnerId = ownerId;
        r.videoAssignedBy = 'operations_manager';
        r.updatedAt = new Date().toISOString();
        // Also set executor if in execution stage
        if (r.status === 'creative_execution' && !r.executorId) {
            r.executorId = ownerId;
            r.executionAssignedBy = 'operations_manager';
            r.assignedTo = member?.name || ownerId;
        }
        this._activity(r, `🎬 تعيين مالك الفيديو: ${member?.name || ownerId} بواسطة يوسف`, `🎬 Video owner: ${member?.nameEn || ownerId} by Yousef`);
        this.toast(lang === 'ar' ? `✅ ${member?.name || ownerId} — مالك الفيديو` : `✅ ${member?.nameEn || ownerId} — Video Owner`); this.emit();
    }

    // ═══ Approvals ═══

    /** CD Preliminary Approval */
    approvePreliminary(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.cdPrelimApproval = true;
        r.cdPrelimApprovedAt = new Date().toISOString();
        r.updatedAt = new Date().toISOString();
        // If both approved, move to execution
        if (r.amFinalIdeaApproval) this._moveToExecution(r, lang);
        this._activity(r, `✅ موافقة أولية — المدير الإبداعي`, `✅ Preliminary approval — Creative Director`);
        this.toast(lang === 'ar' ? `✅ موافقة أولية — "${r.title}"` : `✅ Preliminary approved — "${r.title}"`); this.emit();
    }

    /** AM Final Idea Approval */
    approveIdeaFinal(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.amFinalIdeaApproval = true;
        r.amFinalApprovedAt = new Date().toISOString();
        r.conceptApproved = true;
        r.updatedAt = new Date().toISOString();
        // If both approved, move to execution
        if (r.cdPrelimApproval) this._moveToExecution(r, lang);
        this._activity(r, `✅ موافقة الفكرة النهائية — مدير الحساب`, `✅ Final idea approval — Account Manager`);
        this.toast(lang === 'ar' ? `✅ موافقة الفكرة النهائية — "${r.title}"` : `✅ Final idea approved — "${r.title}"`); this.emit();
    }

    /** Request concept changes (back to concept writing) */
    requestConceptChanges(reqId: string, note: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.cdPrelimApproval = false; r.amFinalIdeaApproval = false;
        r.status = 'concept_writing'; r.reviewRound++; r.updatedAt = new Date().toISOString();
        if (note) r.comments.push({ id: `c${Date.now()}`, sender: lang === 'ar' ? 'المراجع' : 'Reviewer', avatar: '🔄', text: note, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' });
        this.toast(lang === 'ar' ? `🔄 طُلبت تعديلات على مفهوم "${r.title}"` : `🔄 Concept changes for "${r.title}"`); this.emit();
    }

    /** CD Review: approve → approved_ready */
    cdApprove(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.finalApproved = true; r.status = 'approved_ready'; r.updatedAt = new Date().toISOString();
        if (r.finalVideoUrl) this._addShowcase(r);
        this._activity(r, `🎉 "${r.title}" — معتمد وجاهز`, `🎉 "${r.title}" — Approved & Ready`);
        this.toast(lang === 'ar' ? `🎉 "${r.title}" — معتمد وجاهز` : `🎉 "${r.title}" — Approved & Ready`); this.emit();
        this._handoffToProduction(r, lang);
    }

    /** CD Request Changes (back to execution) */
    cdRequestChanges(reqId: string, note: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.status = 'creative_execution'; r.reviewRound++; r.updatedAt = new Date().toISOString();
        if (note) { r.creativeDirectorNotes = note; r.comments.push({ id: `c${Date.now()}`, sender: lang === 'ar' ? 'المدير الإبداعي' : 'Creative Director', avatar: '🎨', text: note, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'human' }); }
        this.toast(lang === 'ar' ? `🔄 المدير طلب تعديلات — "${r.title}"` : `🔄 CD changes — "${r.title}"`); this.emit();
    }

    // ═══ Stage Transitions ═══

    moveToStage(reqId: string, stage: PipelineStage, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.status = stage; r.updatedAt = new Date().toISOString();
        if (stage === 'review_revisions') r.reviewRound++;
        const sm = STAGE_META[stage];
        this._activity(r, `${r.title} → ${sm.ar}`, `${r.title} → ${sm.en}`);
        this.toast(lang === 'ar' ? `✅ ${r.title} → ${sm.ar}` : `✅ ${r.title} → ${sm.en}`); this.emit();
        if (stage === 'approved_ready') this._handoffToProduction(r, lang);
    }

    private _moveToExecution(r: CreativeRequest, lang: 'ar' | 'en' = 'ar') {
        r.status = 'creative_execution'; r.updatedAt = new Date().toISOString();
        // Auto-assign for design tasks
        if (!r.isVideoTask && !r.executorId) {
            const rec = this.getAiRecommendation(r.requestId);
            if (rec) { r.executorId = rec.memberId; r.executionAssignedBy = 'ai'; r.aiRecommendation = lang === 'ar' ? rec.reason_ar : rec.reason_en; r.assignedTo = rec.memberName; }
        }
        // Deliver concept to video owner
        if (r.isVideoTask && r.videoOwnerId) {
            r.conceptDeliveredToVideo = true;
            if (r.calendarStatus === 'tentative') r.calendarStatus = 'confirmed';
        }
    }

    // ═══ Video Calendar ═══

    markTentative(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.calendarStatus = 'tentative'; r.updatedAt = new Date().toISOString();
        // Add tentative calendar event
        if (r.videoOwnerId && r.dueDate) {
            this.calendarEvents.push({ id: `cal_tent_${Date.now()}`, clientId: r.clientId, requestId: r.requestId, title: `⏳ ${r.title}`, date: r.dueDate, type: 'tentative', color: 'rgba(245,158,11,0.6)', memberId: r.videoOwnerId, phase: 'tentative' });
        }
        this.toast(lang === 'ar' ? `⏳ حجز مبدئي — "${r.title}"` : `⏳ Tentative hold — "${r.title}"`); this.emit();
    }

    confirmCalendarSlot(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.calendarStatus = 'confirmed'; r.updatedAt = new Date().toISOString();
        // Update calendar event to confirmed
        const ev = this.calendarEvents.find(e => e.requestId === reqId && e.phase === 'tentative');
        if (ev) { ev.phase = 'confirmed'; ev.title = `✅ ${r.title}`; ev.color = 'rgba(34,197,94,0.6)'; }
        this.toast(lang === 'ar' ? `✅ تأكيد الحجز — "${r.title}"` : `✅ Confirmed — "${r.title}"`); this.emit();
    }

    deliverConceptToVideo(reqId: string, lang: 'ar' | 'en' = 'ar') {
        const r = this.requests.find(x => x.requestId === reqId); if (!r) return;
        r.conceptDeliveredToVideo = true; r.updatedAt = new Date().toISOString();
        this._activity(r, `📨 تسليم المفهوم لمالك الفيديو`, `📨 Concept delivered to video owner`);
        this.toast(lang === 'ar' ? `📨 تسليم المفهوم — "${r.title}"` : `📨 Concept delivered — "${r.title}"`); this.emit();
    }

    /** Get videographer's personal calendar */
    getVideographerCalendar(memberId: string) {
        const tasks = this.requests.filter(r => r.videoOwnerId === memberId || (r.executorId === memberId && r.isVideoTask));
        return {
            tentative: tasks.filter(r => r.calendarStatus === 'tentative').map(r => ({ requestId: r.requestId, title: r.title, clientId: r.clientId, dueDate: r.dueDate, shootDate: r.shootDate, status: r.status, conceptReady: r.conceptDeliveredToVideo })),
            confirmed: tasks.filter(r => r.calendarStatus === 'confirmed').map(r => ({ requestId: r.requestId, title: r.title, clientId: r.clientId, dueDate: r.dueDate, shootDate: r.shootDate, editDeadline: r.editDeadline, status: r.status })),
            calendarEvents: this.calendarEvents.filter(e => e.memberId === memberId),
        };
    }

    /** Early video awareness: add to videographer's task list even before concept */
    private _notifyVideoAwareness(r: CreativeRequest, lang: 'ar' | 'en' = 'ar') {
        this._activity(r, `🎬 فيديو قادم — "${r.title}" (بانتظار المفهوم)`, `🎬 Upcoming video — "${r.title}" (Pending Concept)`);
    }

    // ═══ Blocking ═══

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

    // ═══ Chat & Comments ═══

    addChatMessage(cId: string, msg: Omit<CreativeChatMessage, 'id' | 'clientId'>) { this.chatMessages.push({ ...msg, id: `m${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, clientId: cId }); this.emit(); }
    addRequestComment(rId: string, c: Omit<RequestComment, 'id'>) { const r = this.requests.find(x => x.requestId === rId); if (r) { r.comments.push({ ...c, id: `c${Date.now()}` }); this.emit(); } }

    uploadAttachment(rId: string, name: string, lang: 'ar' | 'en' = 'ar') { const r = this.requests.find(x => x.requestId === rId); if (!r) return; r.attachments.push(name); r.updatedAt = new Date().toISOString(); this.toast(lang === 'ar' ? `📎 "${name}"` : `📎 "${name}"`); this.emit(); }
    uploadFinalVideo(rId: string, name: string, lang: 'ar' | 'en' = 'ar') { const r = this.requests.find(x => x.requestId === rId); if (!r) return; r.finalVideoUrl = name; r.attachments.push(name); r.updatedAt = new Date().toISOString(); if (r.status === 'approved_ready') this._addShowcase(r); this.toast(lang === 'ar' ? `🎬 "${name}"` : `🎬 "${name}"`); this.emit(); }
    addBrandAsset(cId: string, a: Omit<BrandAsset, 'id' | 'clientId' | 'createdAt'>, lang: 'ar' | 'en' = 'ar') { this.brandAssets.push({ ...a, id: `as${Date.now()}`, clientId: cId, createdAt: new Date().toISOString().split('T')[0] }); this.toast(lang === 'ar' ? `📁 "${a.name}"` : `📁 "${a.name}"`); this.emit(); }

    addInspiration(cId: string, i: Omit<InspirationItem, 'inspirationId' | 'clientId' | 'createdAt'>, lang: 'ar' | 'en' = 'ar') { this.inspirations.push({ ...i, inspirationId: `in${Date.now()}`, clientId: cId, createdAt: new Date().toISOString().split('T')[0] }); this.toast(lang === 'ar' ? `💡 "${i.title}"` : `💡 "${i.title}"`); this.emit(); }
    togglePin(id: string) { const i = this.inspirations.find(x => x.inspirationId === id); if (i) { i.pinned = !i.pinned; this.emit(); } }
    toggleRecommend(id: string) { const i = this.inspirations.find(x => x.inspirationId === id); if (i) { i.recommended = !i.recommended; this.emit(); } }
    linkInspirationToRequest(inspId: string, reqId: string) { const r = this.requests.find(x => x.requestId === reqId); if (r && !r.linkedInspirationIds.includes(inspId)) { r.linkedInspirationIds.push(inspId); this.emit(); } }

    // ═══ Cross-Board ═══

    syncClient(c: SharedClient) {
        const i = this.clients.findIndex(x => x.clientId === c.clientId);
        if (i >= 0) { this.clients[i] = { ...this.clients[i], ...c }; } else {
            this.clients.push(c); this.profiles.push(this._dp(c));
            const now = new Date();
            this.activities.unshift({ id: `a_sync_${Date.now()}`, clientId: c.clientId, text: `🎉 عميل جديد من التسويق — "${c.name}"`, textEn: `🎉 New client from Marketing — "${c.name}"`, icon: '🎉', time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'success' });
            this.chatMessages.push({ id: `m_sync_${Date.now()}`, clientId: c.clientId, sender: 'النظام', avatar: '🔗', text: `مرحباً! تم ربط "${c.name}" من قسم التسويق.`, time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'system' });
        }
        this.emit();
    }

    createRequestFromMarketingTask(clientId: string, taskTitle: string, marketingTaskId: string, lang: 'ar' | 'en' = 'ar') {
        const req = this._createRequestFromTitle(clientId, taskTitle, marketingTaskId);
        const cl = this.getClient(clientId);
        if (cl) { cl.marketingTaskCount = (cl.marketingTaskCount || 0) + 1; if (!cl.marketingTaskTitles) cl.marketingTaskTitles = []; cl.marketingTaskTitles.push(taskTitle); }
        this.toast(lang === 'ar' ? `🔗 طلب إبداعي من التسويق — "${taskTitle}"` : `🔗 Creative request from Marketing — "${taskTitle}"`);
        this.emit(); return req;
    }

    private _createRequestFromTitle(clientId: string, taskTitle: string, marketingTaskId: string): CreativeRequest {
        const cat: RequestCategory = taskTitle.includes('ريلز') || taskTitle.includes('فيديو') ? 'reel' : taskTitle.includes('تصوير') || taskTitle.includes('Shoot') ? 'product_shoot' : taskTitle.includes('منيو') || taskTitle.includes('Menu') ? 'menu_design' : 'social_post';
        const now = new Date();
        const req: CreativeRequest = {
            requestId: `req_mkt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, clientId, linkedMarketingTaskId: marketingTaskId,
            title: taskTitle, category: cat, objective: '', brief: '', deliverables: [], platform: 'Instagram', format: '1080×1080', priority: 'medium',
            dueDate: new Date(now.getTime() + 7 * 864e5).toISOString().split('T')[0], status: 'brief_ready', assignedTo: '', reviewRound: 0,
            conceptApproved: false, finalApproved: false, blocked: false, blockReason: '', dependencies: [], missingAssetsFlag: false,
            aiClientFeedback: '', aiClientScore: '', creativeDirectorNotes: '', internalTeamNotes: '', attachments: [],
            linkedInspirationIds: [], versionHistory: [], comments: [], createdAt: now.toISOString(), updatedAt: now.toISOString(),
            sourceBoard: 'marketing', linkedMarketingTaskTitle: taskTitle, syncStatus: 'synced', lastSyncedAt: now.toISOString(),
            conceptWriterId: '', conceptAssignedBy: 'manual', executorId: '', executionAssignedBy: 'manual', aiRecommendation: '',
            cdPrelimApproval: false, cdPrelimApprovedAt: '', amFinalIdeaApproval: false, amFinalApprovedAt: '',
            isVideoTask: isVideoCategory(cat), videoOwnerId: '', videoAssignedBy: 'manual', calendarStatus: 'none',
            conceptDeliveredToVideo: false, shootDate: '', editDeadline: '',
            publishDate: '', creativeDueAt: '', productionSafetyDueAt: '', productionWindowStartAt: '', shootCompletionTargetAt: '', shootCompletedAt: '', editDeliveryDueAt: '', scheduleState: '', deadlineSource: '',
        };
        this.requests.push(req); return req;
    }

    getLinkedMarketingContext(clientId: string) {
        const cl = this.getClient(clientId);
        const linkedReqs = this.requests.filter(r => r.clientId === clientId && r.linkedMarketingTaskId);
        return { linked: cl?.linkedFromMarketing || false, convertedAt: cl?.marketingConvertedAt || '', taskCount: cl?.marketingTaskCount || linkedReqs.length, taskTitles: cl?.marketingTaskTitles || linkedReqs.map(r => r.linkedMarketingTaskTitle), creativeRequestCount: linkedReqs.length, latestSync: linkedReqs.reduce((latest, r) => r.lastSyncedAt > latest ? r.lastSyncedAt : latest, ''), linkedRequests: linkedReqs };
    }

    getCreativeProgressForMarketing(clientId: string) {
        const reqs = this.getClientRequests(clientId);
        const total = reqs.length; const done = reqs.filter(r => r.status === 'approved_ready').length;
        const active = reqs.filter(r => this.isActive(r)).length; const blocked = reqs.filter(r => r.blocked).length;
        const latestStage = reqs.length > 0 ? [...reqs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] : null;
        return { total, done, active, blocked, latestStage: latestStage ? STAGE_META[latestStage.status].ar : '', latestStageEn: latestStage ? STAGE_META[latestStage.status].en : '', latestTitle: latestStage?.title || '' };
    }

    updateMarketingTaskStatus(marketingTaskId: string, status: string, dueDate?: string, lang: 'ar' | 'en' = 'ar') {
        const req = this.requests.find(r => r.linkedMarketingTaskId === marketingTaskId); if (!req) return;
        req.syncStatus = 'synced'; req.lastSyncedAt = new Date().toISOString();
        if (dueDate) req.dueDate = dueDate;
        this._activity(req, `🔄 تزامن مع التسويق — "${req.title}"`, `🔄 Synced from Marketing — "${req.title}"`);
        this.emit();
    }

    removeClient(clientId: string) {
        const cl = this.getClient(clientId);
        if (cl?.linkedFromMarketing) { this.toast('⛔ لا يمكن حذف عميل مرتبط بالتسويق', 'error'); return false; }
        this.clients = this.clients.filter(c => c.clientId !== clientId);
        this.profiles = this.profiles.filter(p => p.clientId !== clientId);
        this.emit(); return true;
    }

    removeRequest(requestId: string) {
        const req = this.requests.find(r => r.requestId === requestId);
        if (req?.sourceBoard === 'marketing') { this.toast('⛔ لا يمكن حذف طلب من التسويق', 'error'); return false; }
        this.requests = this.requests.filter(r => r.requestId !== requestId);
        this.emit(); return true;
    }

    // ═══ Helpers ═══

    private _activity(r: CreativeRequest, textAr: string, textEn: string) {
        this.activities.unshift({ id: `a${Date.now()}`, clientId: r.clientId, requestId: r.requestId, text: textAr, textEn, icon: '🔄', time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'info' });
    }

    private _handoffToProduction(r: CreativeRequest, lang: 'ar' | 'en' = 'ar') {
        try {
            const { getProductionStore } = require('./productionStore');
            const ps = getProductionStore();
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

    private _addShowcase(r: CreativeRequest) { if (!r.finalVideoUrl || this.showcaseVideos.some(v => v.requestId === r.requestId)) return; this.showcaseVideos.push({ showcaseId: `sh${Date.now()}`, clientId: r.clientId, requestId: r.requestId, title: r.title, titleEn: r.title, videoUrl: r.finalVideoUrl, thumbnail: '🎬', duration: '0:30', approvedAt: new Date().toISOString().split('T')[0], approvedBy: 'مدير الحساب', uploadedBy: r.assignedTo || 'الفريق', category: r.category, featured: false, createdAt: new Date().toISOString().split('T')[0] }); }
    private _dp(c: SharedClient): CreativeProfile { return { clientId: c.clientId, clientName: c.name, industry: c.sector, planType: c.planType, campaignDirection: '', visualStyle: '', brandTone: '', primaryColor: '#6366f1', secondaryColor: '#1e1b4b', typography: 'Noto Sans Arabic', targetAudience: '', approvedReferences: [], brandFiles: [], socialLinks: c.socialLinks || [], creativeNotes: '', clientPreferences: [], clientDislikes: [], aiPersona: { communicationStyle: 'مباشر', formalityLevel: 'متوسط', feedbackBehavior: 'سريعة', visualSensitivity: 'عالية', boldVsSafe: 'متوازن', speedExpectations: 'سريعة', approvalHabits: 'جولة', toneExpectations: 'مهني', brandConservatism: 'محافظ', summary: 'عميل جديد.' } }; }

    private _seed() {
        const now = new Date();
        const d = (offset: number) => new Date(now.getTime() + offset * 864e5).toISOString().split('T')[0];
        const ts = () => now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        // ─── Clients (matching DB) ───
        this.clients = [
            { clientId: 'client_warda', name: 'الوردة', nameEn: 'Al Warda', sector: 'مطاعم ومقاهي', sectorEn: 'Restaurants & Cafés', planType: 'شهرية', budget: '5,000', socialLinks: ['instagram.com/alwarda'], avatar: '🌹', createdAt: d(-30), linkedFromMarketing: true, marketingConvertedAt: d(-25), marketingTaskCount: 4, marketingTaskTitles: ['بوست ترويجي', 'ريلز المطبخ', 'ستوري عروض', 'تصوير منيو'] },
            { clientId: 'client_rayhana', name: 'ريحانة', nameEn: 'Rayhana', sector: 'عقارات', sectorEn: 'Real Estate', planType: 'سنوية', budget: '15,000', socialLinks: ['instagram.com/rayhana'], avatar: '🏠', createdAt: d(-60), linkedFromMarketing: true, marketingConvertedAt: d(-50), marketingTaskCount: 3, marketingTaskTitles: ['بوست مشروع جديد', 'فيديو جولة', 'إعلان ممول'] },
            { clientId: 'client_kalfink', name: 'كلفنك', nameEn: 'Kalfink', sector: 'جمال وعناية', sectorEn: 'Beauty & Personal Care', planType: 'شهرية', budget: '3,000', socialLinks: ['instagram.com/kalfink'], avatar: '💄', createdAt: d(-20), linkedFromMarketing: true, marketingConvertedAt: d(-15), marketingTaskCount: 2, marketingTaskTitles: ['بوست منتج جديد', 'ريلز تجربة'] },
            { clientId: 'client_zamzam', name: 'زمزم', nameEn: 'Zamzam', sector: 'عقارات', sectorEn: 'Real Estate', planType: 'شهرية', budget: '8,000', socialLinks: ['instagram.com/zamzam'], avatar: '🏗️', createdAt: d(-45), linkedFromMarketing: true, marketingConvertedAt: d(-40), marketingTaskCount: 3, marketingTaskTitles: ['إعلان إطلاق', 'تصوير مشروع', 'بوست تحديث'] },
        ];

        // ─── Profiles ───
        this.profiles = this.clients.map(c => this._dp(c));

        // ─── Creative Requests ───
        const mkReq = (id: string, cId: string, title: string, cat: any, stage: any, priority: any, assignedTo: string, conceptWriterId: string, executorId: string, isVideo: boolean, extra?: Partial<CreativeRequest>): CreativeRequest => ({
            requestId: id, clientId: cId, linkedMarketingTaskId: `mkt_${id}`, title, category: cat, objective: `هدف ${title}`, brief: `بريف ${title}`, deliverables: ['تصميم نهائي'], platform: 'Instagram', format: '1080×1080', priority,
            dueDate: d(Math.floor(Math.random() * 14) + 1), status: stage, assignedTo, reviewRound: stage === 'review_revisions' ? 2 : 0,
            conceptApproved: ['creative_execution', 'review_revisions', 'approved_ready'].includes(stage), finalApproved: stage === 'approved_ready', blocked: false, blockReason: '',
            dependencies: [], missingAssetsFlag: false, aiClientFeedback: '', aiClientScore: '', creativeDirectorNotes: '', internalTeamNotes: '',
            attachments: [], linkedInspirationIds: [], versionHistory: [], comments: [],
            createdAt: new Date(now.getTime() - Math.random() * 7 * 864e5).toISOString(), updatedAt: now.toISOString(),
            sourceBoard: 'marketing', linkedMarketingTaskTitle: title, syncStatus: 'synced', lastSyncedAt: now.toISOString(),
            conceptWriterId, conceptAssignedBy: 'creative_director', executorId, executionAssignedBy: executorId ? 'ai' : 'manual', aiRecommendation: '',
            cdPrelimApproval: ['concept_approval', 'creative_execution', 'review_revisions', 'approved_ready'].includes(stage),
            cdPrelimApprovedAt: '', amFinalIdeaApproval: ['creative_execution', 'review_revisions', 'approved_ready'].includes(stage), amFinalApprovedAt: '',
            isVideoTask: isVideo, videoOwnerId: isVideo ? 'hassanein' : '', videoAssignedBy: 'operations_manager', calendarStatus: isVideo ? 'confirmed' : 'none',
            conceptDeliveredToVideo: isVideo && ['creative_execution', 'review_revisions', 'approved_ready'].includes(stage), shootDate: isVideo ? d(5) : '', editDeadline: isVideo ? d(8) : '',
            publishDate: '', creativeDueAt: '', productionSafetyDueAt: '', productionWindowStartAt: '', shootCompletionTargetAt: '', shootCompletedAt: '', editDeliveryDueAt: '', scheduleState: '', deadlineSource: '',
            ...extra,
        });

        this.requests = [
            // الوردة - 4 requests
            mkReq('req_w1', 'client_warda', 'بوست ترويجي — عرض الغداء', 'social_post', 'concept_writing', 'high', 'عبد القادر', 'abdul_qader', '', false),
            mkReq('req_w2', 'client_warda', 'ريلز المطبخ — خلف الكواليس', 'reel', 'creative_execution', 'urgent', 'حسنين', 'abdul_qader', 'hassanein', true),
            mkReq('req_w3', 'client_warda', 'ستوري عروض الأسبوع', 'story_set', 'approved_ready', 'medium', 'عبد القادر', 'abdul_qader', 'abdul_qader', false),
            mkReq('req_w4', 'client_warda', 'تصوير منيو جديد', 'menu_design', 'brief_ready', 'medium', '', '', '', false),
            // ريحانة - 3 requests
            mkReq('req_r1', 'client_rayhana', 'بوست مشروع حياة', 'social_post', 'review_revisions', 'high', 'عبد القادر', 'abdul_qader', 'abdul_qader', false),
            mkReq('req_r2', 'client_rayhana', 'فيديو جولة — المرحلة الثانية', 'reel', 'concept_approval', 'urgent', '', 'abdul_qader', '', true),
            mkReq('req_r3', 'client_rayhana', 'إعلان ممول — إطلاق المرحلة 3', 'ad_creative', 'creative_execution', 'high', 'عبد القادر', 'abdul_qader', 'abdul_qader', false),
            // كلفنك - 2 requests
            mkReq('req_k1', 'client_kalfink', 'بوست منتج العناية الجديد', 'social_post', 'approved_ready', 'medium', 'عبد القادر', 'abdul_qader', 'abdul_qader', false),
            mkReq('req_k2', 'client_kalfink', 'ريلز تجربة المنتج', 'reel', 'concept_writing', 'high', '', 'abdul_qader', '', true),
            // زمزم - 3 requests
            mkReq('req_z1', 'client_zamzam', 'إعلان إطلاق مشروع النور', 'ad_creative', 'creative_execution', 'urgent', 'عبد القادر', 'abdul_qader', 'abdul_qader', false),
            mkReq('req_z2', 'client_zamzam', 'تصوير مشروع النور — جوي', 'product_shoot', 'brief_ready', 'high', '', '', '', true),
            mkReq('req_z3', 'client_zamzam', 'بوست تحديث أعمال البناء', 'social_post', 'concept_approval', 'medium', '', 'abdul_qader', '', false),
        ];

        // ─── Activities ───
        this.activities = [
            { id: 'a1', clientId: 'client_warda', text: '🎉 عميل جديد من التسويق — "الوردة"', textEn: '🎉 New client from Marketing — "Al Warda"', icon: '🎉', time: ts(), type: 'success' },
            { id: 'a2', clientId: 'client_warda', requestId: 'req_w2', text: '🎬 ريلز المطبخ — تم تعيين حسنين للتصوير', textEn: '🎬 Kitchen Reel — Hassanein assigned', icon: '🎬', time: ts(), type: 'info' },
            { id: 'a3', clientId: 'client_rayhana', requestId: 'req_r1', text: '🔄 بوست مشروع حياة — تعديلات مطلوبة (الجولة 2)', textEn: '🔄 Hayat Project Post — Revisions Round 2', icon: '🔄', time: ts(), type: 'warning' },
            { id: 'a4', clientId: 'client_zamzam', requestId: 'req_z1', text: '🎯 إعلان إطلاق مشروع النور — تنفيذ جاري', textEn: '🎯 Noor Launch Ad — In execution', icon: '🎯', time: ts(), type: 'info' },
            { id: 'a5', clientId: 'client_kalfink', requestId: 'req_k1', text: '🎉 بوست العناية — معتمد وجاهز', textEn: '🎉 Skincare Post — Approved & Ready', icon: '🎉', time: ts(), type: 'success' },
            { id: 'a6', clientId: 'client_warda', requestId: 'req_w3', text: '✅ ستوري العروض — معتمد وجاهز للنشر', textEn: '✅ Offers Story — Approved & Ready', icon: '✅', time: ts(), type: 'success' },
        ];

        // ─── Chat Messages ───
        this.chatMessages = this.clients.map(c => ({
            id: `m_init_${c.clientId}`, clientId: c.clientId, sender: 'النظام', avatar: '🔗',
            text: `مرحباً! تم ربط "${c.name}" من قسم التسويق. البريف والمهام جاهزة للبدء.`,
            time: ts(), type: 'system' as const,
        }));

        this._saveToStorage();
    }
}

let _s: CreativeStore | null = null;
export function getCreativeStore(): CreativeStore { if (!_s) _s = new CreativeStore(); return _s; }
