import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/sms'
import { isValidIranianMobile, normalizePhone } from '@/lib/sms'
import { canSendOtp, storeOtp } from '@/lib/otp'

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json()

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

        const normalizedPhone = normalizePhone(phone)

        // Check rate limit
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
        return NextResponse.json(
            { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
            { status: 500 }
        )
    }
}
