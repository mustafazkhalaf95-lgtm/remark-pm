/* ══════════════════════════════════════════════════════════
   Remark PM — Role-Based Permission System
   Maps roles to permissions for all platform operations.
   ══════════════════════════════════════════════════════════ */

// ─── Permission Codes ───

export const PERMISSIONS = {
    // Settings & Admin
    VIEW_SETTINGS: 'view:settings',
    MANAGE_ORGANIZATION: 'manage:organization',
    MANAGE_DEPARTMENTS: 'manage:departments',
    MANAGE_USERS: 'manage:users',
    MANAGE_ROLES: 'manage:roles',
    MANAGE_INTEGRATIONS: 'manage:integrations',
    VIEW_AUDIT: 'view:audit',
    ADMIN_SQL: 'admin:sql',

    // Marketing
    VIEW_MARKETING: 'view:marketing',
    MANAGE_MARKETING: 'manage:marketing',
    APPROVE_MARKETING: 'approve:marketing',

    // Creative
    VIEW_CREATIVE: 'view:creative',
    MANAGE_CREATIVE: 'manage:creative',
    APPROVE_CREATIVE_CONCEPT: 'approve:creative_concept',
    APPROVE_CREATIVE_FINAL: 'approve:creative_final',

    // Production
    VIEW_PRODUCTION: 'view:production',
    MANAGE_PRODUCTION: 'manage:production',
    APPROVE_PRODUCTION: 'approve:production',

    // Publishing
    VIEW_PUBLISHING: 'view:publishing',
    MANAGE_PUBLISHING: 'manage:publishing',
    APPROVE_PUBLISHING: 'approve:publishing',

    // Clients
    VIEW_CLIENTS: 'view:clients',
    MANAGE_CLIENTS: 'manage:clients',

    // Reports
    VIEW_REPORTS: 'view:reports',
    EXPORT_REPORTS: 'export:reports',

    // Chat
    VIEW_CHAT: 'view:chat',
    MANAGE_CHAT: 'manage:chat',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role → Permission Matrix ───
// This defines the DEFAULT permissions for each role.
// The DB can override these via RolePermission records.

const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
    CEO: Object.values(PERMISSIONS), // Full access
    COO: Object.values(PERMISSIONS), // Full access
    CTO: [
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.MANAGE_ORGANIZATION,
        PERMISSIONS.MANAGE_INTEGRATIONS,
        PERMISSIONS.ADMIN_SQL,
        PERMISSIONS.VIEW_AUDIT,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.EXPORT_REPORTS,
        PERMISSIONS.VIEW_MARKETING,
        PERMISSIONS.VIEW_CREATIVE,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_PUBLISHING,
        PERMISSIONS.VIEW_CLIENTS,
        PERMISSIONS.VIEW_CHAT,
    ],

    // Department Heads
    MARKETING_MANAGER: [
        PERMISSIONS.VIEW_MARKETING, PERMISSIONS.MANAGE_MARKETING, PERMISSIONS.APPROVE_MARKETING,
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_PUBLISHING,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CHAT, PERMISSIONS.MANAGE_CHAT,
    ],
    CREATIVE_DIRECTOR: [
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.MANAGE_CREATIVE,
        PERMISSIONS.APPROVE_CREATIVE_CONCEPT, PERMISSIONS.APPROVE_CREATIVE_FINAL,
        PERMISSIONS.VIEW_MARKETING, PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_PUBLISHING,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CHAT, PERMISSIONS.MANAGE_CHAT,
    ],
    PRODUCTION_MANAGER: [
        PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.MANAGE_PRODUCTION, PERMISSIONS.APPROVE_PRODUCTION,
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.VIEW_PUBLISHING,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CHAT, PERMISSIONS.MANAGE_CHAT,
    ],
    PUBLISHING_MANAGER: [
        PERMISSIONS.VIEW_PUBLISHING, PERMISSIONS.MANAGE_PUBLISHING, PERMISSIONS.APPROVE_PUBLISHING,
        PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_CREATIVE,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CHAT, PERMISSIONS.MANAGE_CHAT,
    ],

    // HR / Admin
    HR_MANAGER: [
        PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_DEPARTMENTS,
        PERMISSIONS.VIEW_AUDIT, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CHAT,
    ],

    // Staff roles
    SENIOR_DESIGNER: [
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.MANAGE_CREATIVE,
        PERMISSIONS.VIEW_MARKETING, PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_CHAT,
    ],
    DESIGNER: [
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.MANAGE_CREATIVE,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_CHAT,
    ],
    CONTENT_WRITER: [
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.MANAGE_CREATIVE,
        PERMISSIONS.VIEW_MARKETING, PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_CHAT,
    ],
    PHOTOGRAPHER: [
        PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.MANAGE_PRODUCTION,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_CHAT,
    ],
    VIDEOGRAPHER: [
        PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.MANAGE_PRODUCTION,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_CHAT,
    ],
    SOCIAL_MEDIA_SPECIALIST: [
        PERMISSIONS.VIEW_PUBLISHING, PERMISSIONS.MANAGE_PUBLISHING,
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_CHAT,
    ],
    ACCOUNT_MANAGER: [
        PERMISSIONS.VIEW_MARKETING, PERMISSIONS.MANAGE_MARKETING,
        PERMISSIONS.VIEW_CREATIVE, PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_PUBLISHING,
        PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.MANAGE_CLIENTS, PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_CHAT, PERMISSIONS.MANAGE_CHAT,
    ],

    // Default fallback
    MEMBER: [
        PERMISSIONS.VIEW_CHAT,
    ],
};

// ─── Check Functions ───

/**
 * Check if a role has a specific permission (from static matrix)
 */
export function roleHasPermission(role: string, permission: PermissionCode): boolean {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return false;
    return perms.includes(permission);
}

/**
 * Check if any of the user's roles grant the permission
 */
export function hasPermission(userRoles: string[], permission: PermissionCode): boolean {
    return userRoles.some((role) => roleHasPermission(role, permission));
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: string[]): PermissionCode[] {
    const allPerms = new Set<PermissionCode>();
    for (const role of roles) {
        const perms = ROLE_PERMISSIONS[role] || [];
        perms.forEach((p) => allPerms.add(p));
    }
    return [...allPerms];
}

/**
 * Check if a user can view a specific department's data.
 * C-level can view everything. Others need to be department members.
 */
export function canViewDepartment(
    userRole: string,
    userDepartments: string[],
    targetDepartmentId: string
): boolean {
    if (['CEO', 'COO', 'CTO'].includes(userRole)) return true;
    return userDepartments.includes(targetDepartmentId);
}

/**
 * Check if a user can approve a specific scope
 */
export function canApprove(
    userRole: string,
    scope: 'marketing' | 'creative_concept' | 'creative_final' | 'production' | 'publishing'
): boolean {
    const permMap: Record<string, PermissionCode> = {
        marketing: PERMISSIONS.APPROVE_MARKETING,
        creative_concept: PERMISSIONS.APPROVE_CREATIVE_CONCEPT,
        creative_final: PERMISSIONS.APPROVE_CREATIVE_FINAL,
        production: PERMISSIONS.APPROVE_PRODUCTION,
        publishing: PERMISSIONS.APPROVE_PUBLISHING,
    };
    return roleHasPermission(userRole, permMap[scope]);
}

// ─── Settings Access Roles ───

export const SETTINGS_ACCESS: Record<string, string[]> = {
    organization: ['CEO', 'COO'],
    departments: ['CEO', 'COO', 'HR_MANAGER'],
    users: ['CEO', 'COO', 'HR_MANAGER'],
    roles: ['CEO', 'COO'],
    positions: ['CEO', 'COO', 'HR_MANAGER'],
    approvals: ['CEO', 'COO'],
    integrations: ['CEO', 'COO', 'CTO'],
    audit: ['CEO', 'COO', 'CTO'],
};
