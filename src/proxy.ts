import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, verifyUserToken, ADMIN_TOKEN_COOKIE, USER_TOKEN_COOKIE } from '@/lib/jwt'

/**
 * Next.js Proxy — Edge-level route protection.
 * (Renamed from middleware.ts to proxy.ts as per Next.js 16 convention)
 *
 * Protects:
 * - /admin/dashboard/** — Requires valid admin token
 * - /api/admin/** (except /api/admin/auth/**) — Requires valid admin token
 * - /profile/** — Requires valid user token
 * - /checkout/** — Requires valid user token
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ============================================
    // Admin Dashboard Pages — Redirect to login
    // ============================================
    if (pathname.startsWith('/admin/dashboard')) {
        const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        const payload = await verifyAdminToken(token)
        if (!payload) {
            const response = NextResponse.redirect(new URL('/admin/login', request.url))
            response.cookies.delete(ADMIN_TOKEN_COOKIE)
            return response
        }

        return NextResponse.next()
    }

    // ============================================
    // Admin API Routes — Return 401 JSON
    // (skip /api/admin/auth/* so login works)
    // ============================================
    if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
        const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyAdminToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        return NextResponse.next()
    }

    // ============================================
    // User Protected Pages — Redirect to auth
    // ============================================
    if (pathname.startsWith('/profile') || pathname.startsWith('/checkout')) {
        const token = request.cookies.get(USER_TOKEN_COOKIE)?.value

        if (!token) {
            const loginUrl = new URL('/auth', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }

        const payload = await verifyUserToken(token)
        if (!payload) {
            const loginUrl = new URL('/auth', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            const response = NextResponse.redirect(loginUrl)
            response.cookies.delete(USER_TOKEN_COOKIE)
            return response
        }

        return NextResponse.next()
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Admin routes
        '/admin/dashboard/:path*',
        '/api/admin/:path*',
        // User protected routes
        '/profile/:path*',
        '/checkout/:path*',
    ],
}
