import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyAdminToken, ADMIN_TOKEN_COOKIE, type AdminTokenPayload } from '@/lib/jwt'
import { AdminRole } from '@prisma/client'
import { ROLE_PERMISSIONS, canAccessSection, hasAdminRole, type AdminSection } from '@/lib/admin-roles'

// Re-export client-safe role utilities for backward compatibility
export { ROLE_PERMISSIONS, canAccessSection, hasAdminRole }
export type { AdminSection }

type AdminAuthResult =
    | { ok: true; payload: AdminTokenPayload }
    | { ok: false; response: NextResponse }

function getCookieValue(request: Request, name: string): string | undefined {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return undefined

    for (const cookie of cookieHeader.split(';')) {
        const [rawName, ...rawValue] = cookie.trim().split('=')
        if (rawName === name) {
            return decodeURIComponent(rawValue.join('='))
        }
    }

    return undefined
}

/**
 * Require admin authentication for API routes.
 * Validates the admin token from cookies and checks the admin status in DB.
 */
export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
    const token = getCookieValue(request, ADMIN_TOKEN_COOKIE)

    if (!token) {
        return {
            ok: false,
            response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
        }
    }

    const payload = await verifyAdminToken(token)
    if (!payload) {
        const response = NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        response.cookies.delete(ADMIN_TOKEN_COOKIE)
        return { ok: false, response }
    }

    const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        select: { id: true, phone: true, roles: true, status: true },
    })

    if (!admin || admin.status !== 'ACTIVE' || admin.phone !== payload.phone || !admin.roles.includes(payload.role as AdminRole)) {
        const response = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        response.cookies.delete(ADMIN_TOKEN_COOKIE)
        return { ok: false, response }
    }

    return { ok: true, payload: { ...payload, roles: admin.roles } }
}

/**
 * Require admin authentication for Server Actions.
 * Uses next/headers cookies() instead of request object.
 * Call at the top of every admin server action.
 */
export async function requireAdminAction(): Promise<AdminTokenPayload> {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value

    if (!token) {
        throw new Error('احراز هویت نشده‌اید. لطفاً وارد شوید.')
    }

    const payload = await verifyAdminToken(token)
    if (!payload) {
        throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.')
    }

    const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        select: { id: true, phone: true, roles: true, status: true },
    })

    if (!admin || admin.status !== 'ACTIVE' || admin.phone !== payload.phone || !admin.roles.includes(payload.role as AdminRole)) {
        throw new Error('دسترسی غیرمجاز.')
    }

    return { ...payload, roles: admin.roles }
}

/**
 * Require admin authentication + specific role for Server Actions.
 * Throws if the admin doesn't have the required role.
 */
export async function requireRoleAction(section: AdminSection): Promise<AdminTokenPayload> {
    const payload = await requireAdminAction();
    const requiredRoles = ROLE_PERMISSIONS[section] as readonly string[];
    if (!hasAdminRole(payload.roles, [...requiredRoles])) {
        throw new Error('شما دسترسی لازم برای این عملیات را ندارید.');
    }
    return payload;
}

/**
 * Require admin authentication + specific role for Server Component Pages.
 * Redirects to dashboard with forbidden parameter if permission is lacking.
 */
export async function requireRolePage(section: AdminSection): Promise<AdminTokenPayload> {
    try {
        return await requireRoleAction(section);
    } catch {
        redirect('/admin/dashboard?forbidden=' + section);
    }
}

/**
 * Require admin authentication + specific role for API routes.
 * Returns a NextResponse (403) if the admin doesn't have the required role.
 */
export async function requireRole(
    request: Request,
    section: AdminSection
): Promise<AdminAuthResult> {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth;

    const requiredRoles = ROLE_PERMISSIONS[section] as readonly string[];
    if (!hasAdminRole(auth.payload.roles, [...requiredRoles])) {
        return {
            ok: false,
            response: NextResponse.json(
                { success: false, error: 'Forbidden: insufficient role' },
                { status: 403 }
            ),
        };
    }
    return auth;
}

