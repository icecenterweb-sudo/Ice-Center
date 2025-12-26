import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Only protect /admin/dashboard/* routes
    if (pathname.startsWith('/admin/dashboard')) {
        const token = request.cookies.get('admin_token')?.value

        // No token - redirect to login
        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // Verify token
        const payload = await verifyAdminToken(token)

        // Invalid token - redirect to login
        if (!payload) {
            const response = NextResponse.redirect(new URL('/admin/login', request.url))
            response.cookies.delete('admin_token')
            return response
        }

        // Token valid - allow access
        return NextResponse.next()
    }

    // All other routes - allow access
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
    ],
}
