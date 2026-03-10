/* ══════════════════════════════════════════════════════════
   Remark PM — Enhanced Zod Validation Schemas
   Comprehensive validation for all models with bilingual
   error messages and proper type constraints.
   ══════════════════════════════════════════════════════════ */

import { z } from 'zod';

// ─── Common Transforms ───

const trimString = z.string().transform((s) => s.trim());
const emailField = z.string().email('بريد إلكتروني غير صالح / Invalid email').transform((s) => s.toLowerCase().trim());
const passwordField = z.string().min(8, 'كلمة المرور 8 أحرف على الأقل / Password must be at least 8 characters');
const idField = z.string().min(1, 'المعرف مطلوب / ID is required');
const optionalString = z.string().optional().default('');
const optionalDate = z.string().refine((d) => !d || !isNaN(Date.parse(d)), 'تاريخ غير صالح / Invalid date').optional().nullable();

// ─── Enums ───

export const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'الأولوية يجب أن تكون: low, medium, high, urgent' }),
});

export const statusEnum = z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'الحالة يجب أن تكون: active, inactive, suspended' }),
});

export const creativeStatusEnum = z.enum([
    'new_request', 'brief_ready', 'concept_writing', 'concept_approval',
    'creative_execution', 'review_revisions', 'approved_ready', 'archived',
]);

export const marketingStatusEnum = z.enum([
    'pending', 'in_progress', 'review', 'approved', 'completed', 'archived',
]);

export const productionStatusEnum = z.enum([
    'pending', 'pre_production', 'in_production', 'post_production', 'review', 'completed', 'archived',
]);

export const publishingStatusEnum = z.enum([
    'draft', 'scheduled', 'published', 'archived',
]);

export const jobTypeEnum = z.enum(['video', 'photo', 'motion', 'audio']);

export const creativeCategoryEnum = z.enum([
    'social_post', 'reel', 'story_set', 'ad_creative', 'brand_identity',
    'packaging', 'print', 'presentation', 'motion_graphics', 'video_edit',
    'photography', 'other',
]);

export const platformEnum = z.enum([
    'instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'youtube',
    'snapchat', 'pinterest', 'website', 'other',
]);

// ══════════════════════════════════════════
// USER & AUTH SCHEMAS
// ══════════════════════════════════════════

export const userCreateSchema = z.object({
    email: emailField,
    password: passwordField.optional(),
    fullName: z.string().min(2, 'الاسم مطلوب / Name required').max(100),
    fullNameAr: optionalString,
    displayName: optionalString,
    displayNameAr: optionalString,
    avatar: optionalString,
    phone: optionalString,
    employeeCode: optionalString,
    bio: optionalString,
    positionId: z.string().optional().nullable(),
    reportingToId: z.string().optional().nullable(),
    roleId: z.string().optional(),
    departmentId: z.string().optional(),
    status: statusEnum.optional().default('active'),
});

export const userUpdateSchema = z.object({
    id: idField,
    email: emailField.optional(),
    status: statusEnum.optional(),
    profile: z.object({
        fullName: z.string().max(100).optional(),
        fullNameAr: z.string().max(100).optional(),
        displayName: z.string().max(100).optional(),
        displayNameAr: z.string().max(100).optional(),
        avatar: z.string().optional(),
        phone: z.string().max(20).optional(),
        employeeCode: z.string().max(20).optional(),
        bio: z.string().max(500).optional(),
        positionId: z.string().optional().nullable(),
        reportingToId: z.string().optional().nullable(),
    }).optional(),
    roleId: z.string().optional(),
    departmentId: z.string().optional(),
});

export const passwordChangeSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: passwordField,
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمة المرور غير متطابقة / Passwords do not match',
    path: ['confirmPassword'],
}).refine((data) => data.oldPassword !== data.newPassword, {
    message: 'كلمة المرور الجديدة يجب أن تختلف / New password must be different',
    path: ['newPassword'],
});

// ══════════════════════════════════════════
// ORGANIZATION SCHEMAS
// ══════════════════════════════════════════

export const organizationUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    nameAr: z.string().max(200).optional(),
    timezone: z.string().max(50).optional(),
    language: z.enum(['ar', 'en']).optional(),
    workWeek: z.string().max(20).optional(),
    logo: z.string().max(500).optional(),
    settings: z.array(z.object({
        key: z.string().min(1),
        value: z.string(),
        category: z.string().optional(),
    })).optional(),
});

// ══════════════════════════════════════════
// DEPARTMENT SCHEMAS
// ══════════════════════════════════════════

export const departmentCreateSchema = z.object({
    name: z.string().min(1, 'اسم القسم مطلوب / Department name required').max(100),
    nameAr: optionalString,
    slug: z.string().min(1, 'Slug required').max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    description: optionalString,
    descriptionAr: optionalString,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'لون غير صالح / Invalid color').optional().default('#6366f1'),
    icon: z.string().max(10).optional().default('📋'),
    headUserId: z.string().optional().nullable(),
});

export const departmentUpdateSchema = z.object({
    id: idField,
    name: z.string().min(1).max(100).optional(),
    nameAr: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    descriptionAr: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: z.string().max(10).optional(),
    isActive: z.boolean().optional(),
    headUserId: z.string().optional().nullable(),
});

// ══════════════════════════════════════════
// CLIENT SCHEMAS
// ══════════════════════════════════════════

export const clientCreateSchema = z.object({
    name: z.string().min(1, 'اسم العميل مطلوب / Client name required').max(200),
    nameAr: optionalString,
    sector: optionalString,
    sectorAr: optionalString,
    planType: optionalString,
    budget: optionalString,
    avatar: z.string().max(10).optional().default('✅'),
    status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
    socialLinks: z.string().optional().default('[]'),
    notes: z.string().max(2000).optional().default(''),
});

export const clientUpdateSchema = z.object({
    id: idField,
    name: z.string().min(1).max(200).optional(),
    nameAr: z.string().max(200).optional(),
    sector: z.string().max(100).optional(),
    sectorAr: z.string().max(100).optional(),
    planType: z.string().max(100).optional(),
    budget: z.string().max(50).optional(),
    avatar: z.string().max(10).optional(),
    status: z.enum(['active', 'paused', 'archived']).optional(),
    socialLinks: z.string().optional(),
    notes: z.string().max(2000).optional(),
});

// ══════════════════════════════════════════
// CREATIVE REQUEST SCHEMAS
// ══════════════════════════════════════════

export const creativeRequestCreateSchema = z.object({
    clientId: idField,
    campaignId: z.string().optional().nullable(),
    title: z.string().min(1, 'العنوان مطلوب / Title required').max(200),
    titleAr: optionalString,
    category: creativeCategoryEnum.optional().default('social_post'),
    brief: z.string().min(1, 'البريف مطلوب / Brief required').max(5000),
    status: creativeStatusEnum.optional().default('new_request'),
    priority: priorityEnum.optional().default('medium'),
    assignedTo: optionalString,
    platform: optionalString,
    format: optionalString,
    dueDate: optionalDate,
});

export const creativeRequestUpdateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    titleAr: z.string().max(200).optional(),
    category: creativeCategoryEnum.optional(),
    brief: z.string().max(5000).optional(),
    status: creativeStatusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedTo: z.string().optional(),
    platform: z.string().optional(),
    format: z.string().optional(),
    dueDate: optionalDate,
    reviewRound: z.number().int().min(0).optional(),
    conceptApproved: z.boolean().optional(),
    finalApproved: z.boolean().optional(),
    blocked: z.boolean().optional(),
    blockReason: z.string().max(500).optional(),
});

// ══════════════════════════════════════════
// MARKETING TASK SCHEMAS
// ══════════════════════════════════════════

export const marketingTaskCreateSchema = z.object({
    clientId: idField,
    campaignId: z.string().optional().nullable(),
    title: z.string().min(1, 'العنوان مطلوب / Title required').max(200),
    titleAr: optionalString,
    description: z.string().max(5000).optional().default(''),
    status: marketingStatusEnum.optional().default('pending'),
    priority: priorityEnum.optional().default('medium'),
    assignedTo: optionalString,
    platform: optionalString,
    contentType: optionalString,
    dueDate: optionalDate,
});

export const marketingTaskUpdateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    titleAr: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    status: marketingStatusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedTo: z.string().optional(),
    platform: z.string().optional(),
    contentType: z.string().optional(),
    dueDate: optionalDate,
    completedAt: optionalDate,
});

// ══════════════════════════════════════════
// PRODUCTION JOB SCHEMAS
// ══════════════════════════════════════════

export const productionJobCreateSchema = z.object({
    clientId: idField,
    campaignId: z.string().optional().nullable(),
    title: z.string().min(1, 'العنوان مطلوب / Title required').max(200),
    titleAr: optionalString,
    jobType: jobTypeEnum.optional().default('video'),
    status: productionStatusEnum.optional().default('pending'),
    priority: priorityEnum.optional().default('medium'),
    assignedTo: optionalString,
    shootDate: optionalDate,
    dueDate: optionalDate,
    location: optionalString,
    equipment: z.string().optional().default('[]'),
    deliverables: z.string().optional().default('[]'),
});

export const productionJobUpdateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    titleAr: z.string().max(200).optional(),
    jobType: jobTypeEnum.optional(),
    status: productionStatusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedTo: z.string().optional(),
    shootDate: optionalDate,
    dueDate: optionalDate,
    location: z.string().optional(),
    equipment: z.string().optional(),
    deliverables: z.string().optional(),
});

// ══════════════════════════════════════════
// PUBLISHING ITEM SCHEMAS
// ══════════════════════════════════════════

export const publishingItemCreateSchema = z.object({
    clientId: idField,
    campaignId: z.string().optional().nullable(),
    title: z.string().min(1, 'العنوان مطلوب / Title required').max(200),
    titleAr: optionalString,
    platform: platformEnum.optional().default('instagram'),
    status: publishingStatusEnum.optional().default('draft'),
    scheduledAt: optionalDate,
    content: z.string().max(5000).optional().default(''),
    mediaUrls: z.string().optional().default('[]'),
});

export const publishingItemUpdateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    titleAr: z.string().max(200).optional(),
    platform: platformEnum.optional(),
    status: publishingStatusEnum.optional(),
    scheduledAt: optionalDate,
    publishedAt: optionalDate,
    content: z.string().max(5000).optional(),
    mediaUrls: z.string().optional(),
});

// ══════════════════════════════════════════
// COMMENT & APPROVAL SCHEMAS
// ══════════════════════════════════════════

export const commentCreateSchema = z.object({
    entityType: z.enum(['creative_request', 'production_job', 'marketing_task', 'publishing_item']),
    entityId: idField,
    text: z.string().min(1, 'التعليق مطلوب / Comment text required').max(5000),
});

export const approvalCreateSchema = z.object({
    entityType: z.enum(['creative_concept', 'creative_final', 'production_review', 'publishing']),
    entityId: idField,
    decision: z.enum(['approved', 'rejected', 'revision_requested']),
    notes: z.string().max(2000).optional().default(''),
});

// ══════════════════════════════════════════
// CAMPAIGN SCHEMAS
// ══════════════════════════════════════════

export const campaignCreateSchema = z.object({
    clientId: idField,
    name: z.string().min(1, 'اسم الحملة مطلوب / Campaign name required').max(200),
    nameAr: optionalString,
    description: z.string().max(2000).optional().default(''),
    status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).optional().default('planning'),
    startDate: optionalDate,
    endDate: optionalDate,
    budget: optionalString,
});

export const campaignUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    nameAr: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).optional(),
    startDate: optionalDate,
    endDate: optionalDate,
    budget: z.string().optional(),
});

// ══════════════════════════════════════════
// PAGINATION & FILTER SCHEMAS
// ══════════════════════════════════════════

export const paginationSchema = z.object({
    take: z.coerce.number().int().positive().max(200).optional().default(20),
    skip: z.coerce.number().int().min(0).optional().default(0),
    orderBy: z.string().optional().default('createdAt'),
    orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ══════════════════════════════════════════
// LEGACY SCHEMAS (kept for backward compatibility)
// ══════════════════════════════════════════

export const briefCreateSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    clientBoard: z.string().min(1, 'Client board is required'),
    contentType: z.string().optional().default('VIDEO'),
    publishDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
});

export const automationCreateSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب / Name is required'),
    nameAr: optionalString,
    description: z.string().optional().default(''),
    descriptionAr: optionalString,
    trigger: z.string().min(1, 'المشغل مطلوب / Trigger is required'),
    triggerConfig: z.record(z.string(), z.unknown()).optional().default({}),
    actions: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    enabled: z.boolean().optional().default(true),
});

export const channelCreateSchema = z.object({
    name: z.string().min(1, 'Channel name is required'),
    description: z.string().optional(),
    channelType: z.enum(['PUBLIC', 'PRIVATE', 'DIRECT']).optional().default('PUBLIC'),
    memberIds: z.array(z.string()).optional(),
});

export const messageCreateSchema = z.object({
    content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
});

export const adminQuerySchema = z.object({
    table: z.string().min(1, 'Table name is required'),
    take: z.number().int().positive().max(200).optional(),
    skip: z.number().int().min(0).optional(),
    orderBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
});

export const automationExecuteSchema = z.object({
    trigger: z.string().min(1, 'المشغل مطلوب / Trigger is required'),
    taskId: z.string().min(1, 'معرف المهمة مطلوب / Task ID is required'),
    boardType: z.enum(['marketing_task', 'creative_request', 'production_job', 'publishing_item'], {
        errorMap: () => ({ message: 'نوع اللوحة غير صالح / Invalid board type' }),
    }),
    statusFrom: z.string().optional(),
    statusTo: z.string().optional(),
    field: z.string().optional(),
    value: z.string().optional(),
});

// ─── Helper: parse and return 400 on failure ───
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, error: errors };
    }
    return { success: true, data: result.data };
}
