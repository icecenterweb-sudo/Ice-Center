import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdminToken, ADMIN_TOKEN_COOKIE, type AdminTokenPayload } from '@/lib/jwt'

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
        select: { id: true, phone: true, role: true, status: true },
    })

    if (!admin || admin.status !== 'ACTIVE' || admin.phone !== payload.phone || admin.role !== payload.role) {
        const response = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        response.cookies.delete(ADMIN_TOKEN_COOKIE)
        return { ok: false, response }
    }

    return { ok: true, payload }
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
        select: { id: true, phone: true, role: true, status: true },
    })

    if (!admin || admin.status !== 'ACTIVE' || admin.phone !== payload.phone || admin.role !== payload.role) {
        throw new Error('دسترسی غیرمجاز.')
    }

    return payload
}
