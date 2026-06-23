import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidIranianMobile, normalizePhone } from '@/lib/sms'
import { verifyOtp } from '@/lib/otp'
import { generateUserToken, USER_TOKEN_COOKIE, getTokenCookieOptionsForRequest } from '@/lib/jwt'
import { recordAnalyticsEvent } from '@/lib/analytics'
import { toEnglishDigits } from '@/lib/persian'

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

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            isNewUser: result.isNewUser,
        })

        response.cookies.set(
            USER_TOKEN_COOKIE,
            token,
            getTokenCookieOptionsForRequest(request)
        )

        return response

    } catch (error) {
        console.error('Verify OTP error:', error)
        return NextResponse.json(
            { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
            { status: 500 }
        )
    }
}
