/* ══════════════════════════════════════════════════════════
   Remark Creative — AI Client Service
   Generates personas, evaluates briefs, and produces
   realistic creative feedback from the client's perspective.
   ══════════════════════════════════════════════════════════ */

import type { CreativeProfile, CreativeRequest } from './creativeStore';

// ─── Industry-Specific Feedback Templates ───
const INDUSTRY_FEEDBACK: Record<string, string[]> = {
    'مطاعم ومقاهي': [
        'تأكدوا من أن الطعام يبدو شهياً وطبيعياً — لا مبالغة في الفلاتر.',
        'العميل يريد أن يشعر الزبون بالجوع عند رؤية المنشور.',
        'الإضاءة الدافئة ضرورية — الإضاءة الباردة لا تناسب مطاعم.',
        'CTA يجب أن يكون واضحاً: احجز الآن / اطلب الآن / زورونا.',
        'صور الطعام الحقيقية أفضل بكثير من التصاميم الجرافيكية.',
    ],
    'عقارات': [
        'العميل يتوقع صوراً احترافية بزاوية واسعة.',
        'المعلومات الأساسية يجب أن تكون واضحة: المساحة، السعر، الموقع.',
        'استخدموا ألواناً تعطي إحساساً بالفخامة والثقة.',
    ],
    'أزياء': [
        'العميل حساس جداً للألوان — تأكدوا من دقة ألوان المنتجات.',
        'التصاميم يجب أن تعكس الموسم الحالي وأحدث الصيحات.',
        'الموديلز والتنسيق مهمين جداً في هذا القطاع.',
    ],
    'default': [
        'تأكدوا من تناسق التصميم مع هوية العلامة التجارية.',
        'الرسالة الرئيسية يجب أن تكون واضحة من النظرة الأولى.',
        'CTA يجب أن يكون بارزاً وواضحاً.',
    ],
};

// ─── Brief Completeness Checklist ───
const BRIEF_REQUIREMENTS = [
    { field: 'objective', label_ar: 'الهدف', label_en: 'Objective' },
    { field: 'brief', label_ar: 'البريف', label_en: 'Brief' },
    { field: 'platform', label_ar: 'المنصة', label_en: 'Platform' },
    { field: 'format', label_ar: 'الحجم/الصيغة', label_en: 'Format' },
    { field: 'dueDate', label_ar: 'تاريخ التسليم', label_en: 'Due Date' },
    { field: 'deliverables', label_ar: 'المخرجات', label_en: 'Deliverables' },
];

export function evaluateBrief(request: CreativeRequest, lang: 'ar' | 'en'): {
    isComplete: boolean;
    missingFields: string[];
    warnings: string[];
    suggestions: string[];
} {
    const missingFields: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    for (const req of BRIEF_REQUIREMENTS) {
        const val = (request as any)[req.field];
        if (!val || (Array.isArray(val) && val.length === 0)) {
            missingFields.push(lang === 'ar' ? req.label_ar : req.label_en);
        }
    }

    if (!request.assignedTo) {
        warnings.push(lang === 'ar' ? 'لم يتم تعيين مسؤول بعد' : 'No assignee set');
    }

    if (request.missingAssetsFlag) {
        warnings.push(lang === 'ar' ? 'هناك ملفات مفقودة مطلوبة للبدء' : 'Missing assets required to start');
    }

    if (request.dependencies.length > 0) {
        warnings.push(lang === 'ar'
            ? `${request.dependencies.length} تبعيات غير محلولة`
            : `${request.dependencies.length} unresolved dependencies`);
    }

    // Smart suggestions
    if (request.category === 'reel' && !request.brief.includes('ثانية') && !request.brief.includes('second')) {
        suggestions.push(lang === 'ar' ? 'حددوا مدة الريلز في البريف' : 'Specify reel duration in the brief');
    }
    if (request.category === 'ad_creative' && !request.brief.includes('CTA')) {
        suggestions.push(lang === 'ar' ? 'أضيفوا CTA واضح في البريف' : 'Add a clear CTA to the brief');
    }
    if (request.platform.includes('TikTok') && request.category !== 'reel') {
        suggestions.push(lang === 'ar' ? 'TikTok يتطلب محتوى فيديو — هل تحتاجون ريلز أيضاً؟' : 'TikTok requires video content — do you need a reel too?');
    }

    return {
        isComplete: missingFields.length === 0,
        missingFields,
        warnings,
        suggestions,
    };
}

export function generateReviewFeedback(request: CreativeRequest, profile: CreativeProfile, lang: 'ar' | 'en'): string {
    const industry = profile.industry || 'default';
    const feedbacks = INDUSTRY_FEEDBACK[industry] || INDUSTRY_FEEDBACK['default'];

    // Pick 2-3 relevant feedback items
    const selected = feedbacks.slice(0, 2 + Math.floor(Math.random() * 2));

    // Generate contextual feedback based on request
    const contextual: string[] = [];

    if (request.category === 'social_post') {
        if (lang === 'ar') {
            contextual.push('العميل يتوقع أن يكون المنشور متناسقاً مع باقي المحتوى على الصفحة.');
        } else {
            contextual.push('The client expects the post to be consistent with existing page content.');
        }
    }

    if (request.category === 'reel') {
        if (lang === 'ar') {
            contextual.push('الثواني الأولى حاسمة — Hook قوي ضروري لمنع التمرير.');
        } else {
            contextual.push('The first seconds are crucial — a strong hook is needed to prevent scrolling.');
        }
    }

    if (request.priority === 'urgent') {
        if (lang === 'ar') {
            contextual.push('⚠️ طلب عاجل — العميل يتوقع تسليماً سريعاً بجودة عالية.');
        } else {
            contextual.push('⚠️ Urgent request — client expects fast delivery with high quality.');
        }
    }

    return [...selected, ...contextual].join('\n');
}

export function getApprovalConfidence(request: CreativeRequest): {
    score: number;
    label_ar: string;
    label_en: string;
    color: string;
} {
    let score = 50;

    // Positive factors
    if (request.reviewRound >= 1) score += 15;
    if (!request.missingAssetsFlag) score += 10;
    if (request.creativeDirectorNotes) score += 10;
    if (request.brief.length > 50) score += 5;
    if (request.versionHistory.length >= 2) score += 10;

    // Negative factors
    if (request.missingAssetsFlag) score -= 20;
    if (request.dependencies.length > 0) score -= 10;
    if (!request.assignedTo) score -= 15;
    if (request.approvalState === 'rejected') score -= 20;

    score = Math.max(10, Math.min(95, score));

    let label_ar, label_en, color;
    if (score >= 80) { label_ar = 'تطابق قوي'; label_en = 'Strong Match'; color = '#22c55e'; }
    else if (score >= 60) { label_ar = 'جيد'; label_en = 'Good'; color = '#06b6d4'; }
    else if (score >= 40) { label_ar = 'يحتاج تحسين'; label_en = 'Needs Improvement'; color = '#f59e0b'; }
    else { label_ar = 'خطر رفض'; label_en = 'Approval Risk'; color = '#ef4444'; }

    return { score, label_ar, label_en, color };
}
