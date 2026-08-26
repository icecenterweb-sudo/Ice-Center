/**
 * Admin role permissions — pure utility module (no server-only imports).
 * Safe to import in both Server and Client Components.
 */

/**
 * Role-based access mapping for each admin section.
 * SUPER_ADMIN bypasses all checks (handled in canAccessSection).
 */
export const ROLE_PERMISSIONS = {
    DASHBOARD: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'BLOG_WRITER', 'SUPPORT_ADMIN', 'INVENTORY_MANAGER', 'ADMIN', 'EDITOR'],
    PRODUCTS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'INVENTORY_MANAGER', 'EDITOR', 'ADMIN'],
    OFFERS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'ADMIN'],
    CATEGORIES: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'INVENTORY_MANAGER', 'EDITOR', 'ADMIN'],
    BLOG: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'BLOG_WRITER', 'ADMIN'],
    ANALYTICS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'ADMIN'],
    APPEARANCE: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'EDITOR', 'ADMIN'],
    SETTINGS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'ADMIN'],
    USERS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'],
    ORDERS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'SUPPORT_ADMIN', 'INVENTORY_MANAGER', 'ADMIN'],
    SUPPORT: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'],
    ERRORS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'ADMIN'],
    ADMIN_MANAGEMENT: ['SUPER_ADMIN', 'GENERAL_MANAGER'],
    COMMENTS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'INVENTORY_MANAGER', 'EDITOR', 'BLOG_WRITER', 'ADMIN'],
    BANNERS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'EDITOR', 'ADMIN'],
    COUPONS: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'ADMIN'],
    SLIDES: ['SUPER_ADMIN', 'GENERAL_MANAGER', 'EDITOR', 'ADMIN'],
} as const;

export type AdminSection = keyof typeof ROLE_PERMISSIONS;

/**
 * Check if a list of admin roles allows access to a given section.
 */
export function canAccessSection(roles: string[] | undefined, section: AdminSection): boolean {
    if (!roles || roles.length === 0) return false; // Fail closed by default if roles not populated
    if (roles.includes('SUPER_ADMIN')) return true;
    const allowedRoles = ROLE_PERMISSIONS[section] as readonly string[];
    return roles.some(role => allowedRoles.includes(role));
}

/**
 * Check if a list of admin roles includes any of the required roles.
 * SUPER_ADMIN has bypass permissions.
 */
export function hasAdminRole(roles: string[] | undefined, requiredRoles: string[]): boolean {
    if (!roles) return false;
    if (roles.includes('SUPER_ADMIN')) return true;
    return requiredRoles.some(role => roles.includes(role));
}
