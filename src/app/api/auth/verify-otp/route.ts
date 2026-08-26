import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidIranianMobile, normalizePhone } from '@/lib/sms'
import { verifyOtp } from '@/lib/otp'
import {
    generateUserToken,
    USER_TOKEN_COOKIE,
    generateAdminToken,
    ADMIN_TOKEN_COOKIE,
    getTokenCookieOptionsForRequest,
    getAdminTokenCookieOptionsForRequest,
} from '@/lib/jwt'
import { recordAnalyticsEvent } from '@/lib/analytics'
import { toEnglishDigits } from '@/lib/persian'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { logSystemError } from '@/lib/error-logger'

export async function POST(request: NextRequest) {
    try {
        const { phone, code, source } = await request.json()
        const normalizedCode = typeof code === 'string' ? toEnglishDigits(code).replace(/\D/g, '') : ''

        // Validate input
        if (!phone || !code) {
            return NextResponse.json(
                { error: 'شماره موبایل و کد تأیید الزامی است' },
                { status: 400 }
            )
        }

        // Validate phone format
        if (!isValidIranianMobile(phone)) {
            return NextResponse.json(
                { error: 'فرمت شماره موبایل نامعتبر است' },
                { status: 400 }
            )
        }

        // Validate code format (4 digits)
        if (!/^\d{4}$/.test(normalizedCode)) {
            return NextResponse.json(
                { error: 'کد تأیید باید ۴ رقم باشد' },
                { status: 400 }
            )
        }

        // Rate limiting per IP (Redis-backed, works in serverless)
        const clientIp = getClientIp(request)
        const ipRateLimit = await checkRateLimit(`verify-otp:ip:${clientIp}`, {
            windowMs: 5 * 60 * 1000, // 5 minutes
            maxRequests: 5,
        })
        if (!ipRateLimit.allowed) {
            return NextResponse.json(
                { error: `تلاش‌های زیادی. لطفاً ${ipRateLimit.resetIn} ثانیه دیگر تلاش کنید.` },
                { status: 429 }
            )
        }

        const normalizedPhone = normalizePhone(phone)

        // Verify OTP
        const result = await verifyOtp(normalizedPhone, normalizedCode)

        if (!result.valid) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            )
        }

        // Fetch user data
        const user = await prisma.user.findUnique({
            where: { id: result.userId },
            select: {
                id: true,
                phone: true,
                firstName: true,
                lastName: true,
                isVerified: true,
                status: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        // Check if user is blocked
        if (user.status === 'BLOCKED') {
            return NextResponse.json(
                { error: 'حساب کاربری شما مسدود شده است' },
                { status: 403 }
            )
        }

        await recordAnalyticsEvent({
            type: 'USER_LOGIN',
            request,
            path: '/auth',
            referrer: request.headers.get('referer'),
            source: typeof source === 'string' ? source : null,
            userId: user.id,
        })

        // Generate JWT token
        const token = await generateUserToken({
            userId: user.id,
            phone: user.phone,
        })

        // Check if user is an active admin for Single Sign-On
        const admin = await prisma.admin.findUnique({
            where: { phone: user.phone },
            select: { id: true, phone: true, roles: true, status: true }
        })

        const isAdmin = !!(admin && admin.status === 'ACTIVE')

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin,
                adminRoles: isAdmin ? admin.roles : [],
            },
            isNewUser: result.isNewUser,
        })

        response.cookies.set(
            USER_TOKEN_COOKIE,
            token,
            getTokenCookieOptionsForRequest(request)
        )

        if (isAdmin && admin) {
            const primaryRole = admin.roles[0] || 'ADMIN'
            const adminToken = await generateAdminToken({
                adminId: admin.id,
                phone: admin.phone,
                role: primaryRole,
                roles: admin.roles,
            })

            response.cookies.set(
                ADMIN_TOKEN_COOKIE,
                adminToken,
                getAdminTokenCookieOptionsForRequest(request)
            )
        }

        return response

    } catch (error) {
        console.error('Verify OTP error:', error)
        await logSystemError(error, '/api/auth/verify-otp', 'ERROR')
        return NextResponse.json(
            { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
            { status: 500 }
        )
    }
}
