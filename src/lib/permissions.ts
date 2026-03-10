/* ══════════════════════════════════════════════════════════
   Remark PM — Role-Based Permission System
   Maps roles to permissions for all platform operations.
   Permission codes use dot notation matching the database seed.
   Role names are lowercase with underscores matching the database seed.
   ══════════════════════════════════════════════════════════ */

// ─── Permission Codes (dot notation — matches DB seed) ───

export const PERMISSIONS = {
    // Settings & Admin
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_MANAGE: 'settings.manage',
    SETTINGS_USERS_MANAGE: 'settings.users.manage',
    SETTINGS_ROLES_MANAGE: 'settings.roles.manage',
    SETTINGS_DEPARTMENTS_MANAGE: 'settings.departments.manage',
    SETTINGS_INTEGRATIONS_MANAGE: 'settings.integrations.manage',

    // Marketing
    MARKETING_VIEW: 'marketing.view',
    MARKETING_MANAGE: 'marketing.manage',

    // Creative
    CREATIVE_VIEW: 'creative.view',
    CREATIVE_MANAGE: 'creative.manage',

    // Production
    PRODUCTION_VIEW: 'production.view',
    PRODUCTION_MANAGE: 'production.manage',

    // Publishing
    PUBLISHING_VIEW: 'publishing.view',
    PUBLISHING_MANAGE: 'publishing.manage',

    // Clients
    CLIENTS_VIEW: 'clients.view',
    CLIENTS_MANAGE: 'clients.manage',

    // Reports
    REPORTS_VIEW: 'reports.view',
    REPORTS_EXPORT: 'reports.export',

    // Approvals
    APPROVALS_CONCEPT_PRELIMINARY: 'approvals.concept_preliminary',
    APPROVALS_CONCEPT_FINAL: 'approvals.concept_final',
    APPROVALS_EXPORT: 'approvals.export',
    APPROVALS_PUBLISHING: 'approvals.publishing',
    APPROVALS_UNBLOCK: 'approvals.unblock',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role → Permission Matrix ───
// This defines the DEFAULT permissions for each role.
// The DB can override these via RolePermission records.
// Role names are lowercase with underscores matching the DB seed.

const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
    ceo: Object.values(PERMISSIONS), // Full access
    coo: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.SETTINGS_ROLES_MANAGE), // Everything except role management
    admin: Object.values(PERMISSIONS), // Full access

    // Department Heads
    department_head: [
        PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
    ],
    account_manager: [
        PERMISSIONS.MARKETING_VIEW, PERMISSIONS.CREATIVE_VIEW, PERMISSIONS.PRODUCTION_VIEW, PERMISSIONS.PUBLISHING_VIEW,
        PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_MANAGE,
        PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.APPROVALS_CONCEPT_FINAL,
    ],
    marketing_manager: [
        PERMISSIONS.MARKETING_VIEW, PERMISSIONS.MARKETING_MANAGE,
        PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_MANAGE,
        PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
    ],
    creative_director: [
        PERMISSIONS.CREATIVE_VIEW, PERMISSIONS.CREATIVE_MANAGE,
        PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.APPROVALS_CONCEPT_PRELIMINARY, PERMISSIONS.APPROVALS_UNBLOCK,
    ],
    production_manager: [
        PERMISSIONS.PRODUCTION_VIEW, PERMISSIONS.PRODUCTION_MANAGE,
        PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.REPORTS_VIEW,
    ],
    publishing_manager: [
        PERMISSIONS.PUBLISHING_VIEW, PERMISSIONS.PUBLISHING_MANAGE,
        PERMISSIONS.CLIENTS_VIEW,
        PERMISSIONS.APPROVALS_PUBLISHING,
    ],

    // Staff roles
    staff: [
        PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.REPORTS_VIEW,
    ],
    reviewer: [
        PERMISSIONS.CLIENTS_VIEW,
    ],
    viewer: [
        PERMISSIONS.CLIENTS_VIEW,
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
 * C-level / admin can view everything. Others need to be department members.
 */
export function canViewDepartment(
    userRole: string,
    userDepartments: string[],
    targetDepartmentId: string
): boolean {
    if (['ceo', 'coo', 'admin'].includes(userRole)) return true;
    return userDepartments.includes(targetDepartmentId);
}

/**
 * Check if a user can approve a specific scope
 */
export function canApprove(
    userRole: string,
    scope: 'concept_preliminary' | 'concept_final' | 'export' | 'publishing' | 'unblock'
): boolean {
    const permMap: Record<string, PermissionCode> = {
        concept_preliminary: PERMISSIONS.APPROVALS_CONCEPT_PRELIMINARY,
        concept_final: PERMISSIONS.APPROVALS_CONCEPT_FINAL,
        export: PERMISSIONS.APPROVALS_EXPORT,
        publishing: PERMISSIONS.APPROVALS_PUBLISHING,
        unblock: PERMISSIONS.APPROVALS_UNBLOCK,
    };
    return roleHasPermission(userRole, permMap[scope]);
}

// ─── Settings Access Roles (lowercase, matching DB seed) ───

export const SETTINGS_ACCESS: Record<string, string[]> = {
    organization: ['ceo', 'coo'],
    departments: ['ceo', 'coo', 'admin'],
    users: ['ceo', 'coo', 'admin'],
    roles: ['ceo', 'coo'],
    positions: ['ceo', 'coo', 'admin'],
    approvals: ['ceo', 'coo'],
    integrations: ['ceo', 'coo', 'admin'],
    audit: ['ceo', 'coo', 'admin'],
};
