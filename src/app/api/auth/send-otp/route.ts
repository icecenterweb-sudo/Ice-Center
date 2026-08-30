import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/sms'
import { isValidIranianMobile, normalizePhone } from '@/lib/sms'
import { canSendOtp, storeOtp } from '@/lib/otp'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { logSystemError } from '@/lib/error-logger'

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json().catch(() => ({})) as { phone?: string }

        // Validate input
        if (!phone) {
            return NextResponse.json(
                { error: 'شماره موبایل الزامی است' },
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

        // Rate limit by IP (max 5 OTP requests per 10 minutes)
        const clientIp = getClientIp(request)
        const ipRateLimit = await checkRateLimit(`send-otp:ip:${clientIp}`, {
            windowMs: 10 * 60 * 1000,
            maxRequests: 5,
        })
        if (!ipRateLimit.allowed) {
            return NextResponse.json(
                { error: `تعداد درخواست بیش از حد مجاز از این IP. لطفاً ${ipRateLimit.resetIn} ثانیه دیگر تلاش کنید.` },
                { status: 429 }
            )
        }

        const normalizedPhone = normalizePhone(phone)

        // Check rate limit per phone
        const rateCheck = await canSendOtp(normalizedPhone)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    error: `لطفاً ${rateCheck.waitSeconds} ثانیه صبر کنید`,
                    waitSeconds: rateCheck.waitSeconds
                },
                { status: 429 }
            )
        }

        // Send OTP via SMS service
        const smsResult = await sendOtp(normalizedPhone)

        if (!smsResult.success || !smsResult.code) {
            console.error('SMS send failed:', smsResult.error)
            await logSystemError(smsResult.error || 'SMS send failed', '/api/auth/send-otp [SMS]', 'WARNING')
            return NextResponse.json(
                { error: 'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید' },
                { status: 500 }
            )
        }

        // Store OTP in database
        await storeOtp(normalizedPhone, smsResult.code)

        return NextResponse.json({
            success: true,
            message: 'کد تأیید ارسال شد',
            phone: normalizedPhone,
        })

    } catch (error) {
        console.error('Send OTP error:', error)
        await logSystemError(error, '/api/auth/send-otp', 'ERROR')
        return NextResponse.json(
            { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
            { status: 500 }
        )
    }
}
