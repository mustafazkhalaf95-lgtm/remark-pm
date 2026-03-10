'use strict';
/* Remark — Central Team Store — Real Company Mode */

// ─── Departments ───
export const DEPARTMENTS = [
    'executive', 'operations', 'accounts', 'creative',
    'production', 'marketing', 'ai_systems', 'publishing',
] as const;
export type Department = typeof DEPARTMENTS[number];

export const DEPT_LABELS: Record<Department, { ar: string; en: string; icon: string; color: string }> = {
    executive: { ar: 'الإدارة التنفيذية', en: 'Executive', icon: '👑', color: '#f59e0b' },
    operations: { ar: 'العمليات', en: 'Operations', icon: '⚙️', color: '#22c55e' },
    accounts: { ar: 'إدارة الحسابات', en: 'Accounts', icon: '👔', color: '#3b82f6' },
    creative: { ar: 'الإبداعي', en: 'Creative', icon: '🎨', color: '#8b5cf6' },
    production: { ar: 'الإنتاج', en: 'Production', icon: '🎬', color: '#ec4899' },
    marketing: { ar: 'التسويق', en: 'Marketing', icon: '📊', color: '#06b6d4' },
    ai_systems: { ar: 'الذكاء الاصطناعي', en: 'AI / Systems', icon: '🤖', color: '#14b8a6' },
    publishing: { ar: 'النشر', en: 'Publishing', icon: '📢', color: '#f97316' },
};

// ─── Roles ───
export const ROLES = [
    'ceo', 'operations_manager', 'account_manager', 'creative_director',
    'designer', 'marketing_manager', 'videographer_editor', 'ai_developer',
    'pr', 'publishing_manager',
] as const;
export type Role = typeof ROLES[number];

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
    ceo: { ar: 'مدير تنفيذي', en: 'CEO / Executive Director' },
    operations_manager: { ar: 'مدير تشغيلي', en: 'Operations Manager' },
    account_manager: { ar: 'مدير حساب', en: 'Account Manager' },
    creative_director: { ar: 'مدير قسم الكرييتف', en: 'Creative Director' },
    designer: { ar: 'مصمم', en: 'Designer' },
    marketing_manager: { ar: 'مدير تسويق', en: 'Marketing Manager' },
    videographer_editor: { ar: 'مصور ومونتير', en: 'Videographer / Video Editor' },
    ai_developer: { ar: 'مطور AI', en: 'AI Developer' },
    pr: { ar: 'علاقات عامة', en: 'PR' },
    publishing_manager: { ar: 'مدير النشر', en: 'Publishing Manager' },
};

// ─── Team Member ───
export interface TeamMember {
    id: string;
    name: string;
    nameEn: string;
    position: string;
    positionEn: string;
    department: Department;
    departmentEn: string;
    roles: Role[];
    secondaryResponsibilities: string[];
    avatar: string;
    color: string;
    skills: string[];
    email?: string;
}

// ─── The Real Team (13 People) ───
export const TEAM: TeamMember[] = [
    {
        id: 'mustafa_khalaf', name: 'مصطفى خلف', nameEn: 'Mustafa Khalaf',
        position: 'مدير تنفيذي', positionEn: 'CEO / Executive Director',
        department: 'executive', departmentEn: 'Executive',
        roles: ['ceo'],
        secondaryResponsibilities: [],
        avatar: '👑', color: '#f59e0b',
        skills: ['management', 'strategy', 'all_access'],
    },
    {
        id: 'yousef_kazem', name: 'يوسف كاظم', nameEn: 'Yousef Kazem',
        position: 'مدير تشغيلي', positionEn: 'Operations Manager',
        department: 'operations', departmentEn: 'Operations',
        roles: ['operations_manager'],
        secondaryResponsibilities: ['production_oversight', 'approval_fallback', 'video_assignment_owner'],
        avatar: '⚙️', color: '#22c55e',
        skills: ['management', 'scheduling', 'video_assignment', 'production'],
    },
    {
        id: 'saif_ali', name: 'سيف علي', nameEn: 'Saif Ali',
        position: 'مدير حساب', positionEn: 'Account Manager',
        department: 'accounts', departmentEn: 'Accounts',
        roles: ['account_manager'],
        secondaryResponsibilities: [],
        avatar: '👔', color: '#3b82f6',
        skills: ['client_management', 'approvals', 'communication'],
    },
    {
        id: 'widian', name: 'وديان', nameEn: 'Widian',
        position: 'مدير حساب + PR', positionEn: 'Account Manager + PR',
        department: 'accounts', departmentEn: 'Accounts',
        roles: ['account_manager', 'pr'],
        secondaryResponsibilities: ['pr', 'client_communications'],
        avatar: '💼', color: '#a855f7',
        skills: ['client_management', 'approvals', 'communication', 'pr', 'media_relations'],
    },
    {
        id: 'zain_alabideen', name: 'زين العابدين', nameEn: 'Zain Al-Abideen',
        position: 'مدير حساب + مدير النشر', positionEn: 'Account Manager + Publishing Manager',
        department: 'accounts', departmentEn: 'Accounts',
        roles: ['account_manager', 'publishing_manager'],
        secondaryResponsibilities: ['publishing'],
        avatar: '📋', color: '#0ea5e9',
        skills: ['client_management', 'approvals', 'communication', 'publishing', 'scheduling'],
    },
    {
        id: 'abdul_qader', name: 'عبد القادر', nameEn: 'Abdul Qader',
        position: 'مصمم', positionEn: 'Designer',
        department: 'creative', departmentEn: 'Creative',
        roles: ['designer'],
        secondaryResponsibilities: [],
        avatar: '🎨', color: '#6366f1',
        skills: ['design', 'social', 'branding', 'ads', 'illustration'],
    },
    {
        id: 'ahmed_maher', name: 'احمد ماهر', nameEn: 'Ahmed Maher',
        position: 'مدير قسم الكرييتف', positionEn: 'Head of Creative / Creative Director',
        department: 'creative', departmentEn: 'Creative',
        roles: ['creative_director'],
        secondaryResponsibilities: ['concept_approval', 'creative_review'],
        avatar: '🎯', color: '#8b5cf6',
        skills: ['creative_direction', 'concept_approval', 'design_review', 'team_management'],
    },
    {
        id: 'ahmed_fareeq', name: 'احمد فريق', nameEn: 'Ahmed Fareeq',
        position: 'مدير تسويق', positionEn: 'Marketing Manager',
        department: 'marketing', departmentEn: 'Marketing',
        roles: ['marketing_manager'],
        secondaryResponsibilities: [],
        avatar: '📊', color: '#06b6d4',
        skills: ['marketing', 'strategy', 'campaigns', 'analytics'],
    },
    {
        id: 'hassanein', name: 'حسنين', nameEn: 'Hassanein',
        position: 'مصور ومونتير', positionEn: 'Videographer / Video Editor',
        department: 'production', departmentEn: 'Production',
        roles: ['videographer_editor'],
        secondaryResponsibilities: [],
        avatar: '📸', color: '#ec4899',
        skills: ['video', 'photography', 'editing', 'motion'],
    },
    {
        id: 'mustafa_ajar', name: 'مصطفى عجر', nameEn: 'Mustafa Ajar',
        position: 'مصور ومونتير', positionEn: 'Videographer / Video Editor',
        department: 'production', departmentEn: 'Production',
        roles: ['videographer_editor'],
        secondaryResponsibilities: [],
        avatar: '🎥', color: '#f43f5e',
        skills: ['video', 'photography', 'editing', 'motion'],
    },
    {
        id: 'mousa', name: 'موسى', nameEn: 'Mousa',
        position: 'مصور ومونتير', positionEn: 'Videographer / Video Editor',
        department: 'production', departmentEn: 'Production',
        roles: ['videographer_editor'],
        secondaryResponsibilities: [],
        avatar: '🎬', color: '#f59e0b',
        skills: ['video', 'photography', 'editing'],
    },
    {
        id: 'yaser', name: 'ياسر', nameEn: 'Yaser',
        position: 'مطور AI', positionEn: 'AI Developer',
        department: 'ai_systems', departmentEn: 'AI / Systems',
        roles: ['ai_developer'],
        secondaryResponsibilities: ['integrations', 'automation'],
        avatar: '🤖', color: '#14b8a6',
        skills: ['ai', 'development', 'automation', 'integrations'],
    },
    {
        id: 'abdullah', name: 'عبد الله', nameEn: 'Abdullah',
        position: 'مطور AI', positionEn: 'AI Developer',
        department: 'ai_systems', departmentEn: 'AI / Systems',
        roles: ['ai_developer'],
        secondaryResponsibilities: ['integrations', 'automation'],
        avatar: '💻', color: '#10b981',
        skills: ['ai', 'development', 'automation', 'integrations'],
    },
];

// ─── Query Helpers ───
export function getMember(id: string): TeamMember | undefined { return TEAM.find(m => m.id === id); }
export function getMembersByRole(role: Role): TeamMember[] { return TEAM.filter(m => m.roles.includes(role)); }
export function getMembersByDept(dept: Department): TeamMember[] { return TEAM.filter(m => m.department === dept); }
export function getDesigners(): TeamMember[] { return TEAM.filter(m => m.skills.includes('design')); }
export function getVideographers(): TeamMember[] { return TEAM.filter(m => m.roles.includes('videographer_editor')); }
export function getAccountManagers(): TeamMember[] { return TEAM.filter(m => m.roles.includes('account_manager')); }
export function getCreativeDirector(): TeamMember | undefined { return TEAM.find(m => m.roles.includes('creative_director')); }
export function getOperationsManager(): TeamMember | undefined { return TEAM.find(m => m.roles.includes('operations_manager')); }
export function getCEO(): TeamMember | undefined { return TEAM.find(m => m.roles.includes('ceo')); }

// ─── Permission Helpers ───
export function hasRole(memberId: string, role: Role): boolean {
    const m = getMember(memberId); return m ? m.roles.includes(role) : false;
}
export function canApproveCreativePrelim(memberId: string): boolean { return hasRole(memberId, 'creative_director') || hasRole(memberId, 'ceo'); }
export function canApproveIdeaFinal(memberId: string): boolean { return hasRole(memberId, 'account_manager') || hasRole(memberId, 'ceo'); }
export function canAssignVideoOwner(memberId: string): boolean { return hasRole(memberId, 'operations_manager') || hasRole(memberId, 'ceo'); }
export function canApprovePublishing(memberId: string): boolean { return hasRole(memberId, 'operations_manager') || hasRole(memberId, 'ceo'); }
export function canAccessDepartment(memberId: string, dept: Department): boolean {
    const m = getMember(memberId); if (!m) return false;
    if (m.roles.includes('ceo')) return true; // CEO sees everything
    if (m.department === dept) return true;
    // Secondary access
    if (dept === 'publishing' && m.roles.includes('publishing_manager')) return true;
    if (dept === 'accounts' && m.roles.includes('account_manager')) return true;
    if (dept === 'production' && m.roles.includes('operations_manager')) return true;
    return false;
}
export function getVisibleDepartments(memberId: string): Department[] {
    const m = getMember(memberId); if (!m) return [];
    if (m.roles.includes('ceo')) return [...DEPARTMENTS];
    const depts = new Set<Department>([m.department]);
    if (m.roles.includes('operations_manager')) { depts.add('production'); depts.add('publishing'); }
    if (m.roles.includes('publishing_manager')) depts.add('publishing');
    if (m.roles.includes('account_manager')) { depts.add('accounts'); depts.add('creative'); }
    return Array.from(depts);
}

// ─── Active User Session (localStorage) ───
const ACTIVE_USER_KEY = 'remark_pm_active_user';

export function getActiveUserId(): string {
    if (typeof window === 'undefined') return 'mustafa_khalaf';
    return localStorage.getItem(ACTIVE_USER_KEY) || 'mustafa_khalaf';
}
export function setActiveUser(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_USER_KEY, id);
}
export function getActiveUser(): TeamMember {
    return getMember(getActiveUserId()) || TEAM[0];
}
