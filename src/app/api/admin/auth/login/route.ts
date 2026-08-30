import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ADMIN_TOKEN_COOKIE, generateAdminToken, getAdminTokenCookieOptionsForRequest } from '@/lib/jwt'
import { recordAnalyticsEvent } from '@/lib/analytics'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter'
import { hashOtp } from '@/lib/otp'
import { logSystemError } from '@/lib/error-logger'

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json().catch(() => ({})) as { phone?: string; otp?: string }

        // Validate input
        if (!phone || !otp) {
            return NextResponse.json(
                { error: 'شماره موبایل و کد تأیید الزامی هستند' },
                { status: 400 }
            )
        }

        // Rate limiting per IP (Redis-backed, works in serverless)
        const clientIp = getClientIp(request);
        const ipRateLimit = await checkRateLimit(`admin-login:ip:${clientIp}`, RATE_LIMITS.strict);
        if (!ipRateLimit.allowed) {
            return NextResponse.json(
                { error: `تعداد تلاش‌ها بیش از حد مجاز است. لطفاً ${ipRateLimit.resetIn} ثانیه دیگر تلاش کنید.` },
                { status: 429 }
            )
        }

        // Rate limiting per phone (prevents brute force on a specific account)
        const phoneRateLimit = await checkRateLimit(`admin-login:phone:${phone}`, {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 5,
        });
        if (!phoneRateLimit.allowed) {
            return NextResponse.json(
                { error: `تعداد تلاش‌های ناموفق بیش از حد است. لطفاً ${phoneRateLimit.resetIn} ثانیه دیگر تلاش کنید.` },
                { status: 429 }
            )
        }

        // Check if admin exists first
        const admin = await prisma.admin.findUnique({
            where: { phone },
        })

        if (!admin) {
            return NextResponse.json(
                { error: 'اعتبارنامه‌ها نامعتبر هستند' },
                { status: 401 }
            )
        }

        // Verify OTP against database — atomic check-and-mark transaction that
        // prevents two concurrent requests with the same code from both
        // succeeding (mirrors the pattern in src/lib/otp.ts #31)
        const otpResult = await prisma.$transaction(async (tx) => {
            const validOtp = await tx.otpRequest.findFirst({
                where: {
                    phone,
                    verified: false,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (!validOtp) {
                return { ok: false as const, error: 'کد تأیید نامعتبر یا منقضی شده است' };
            }

            // Enforce attempt cap (#31)
            const MAX_ADMIN_ATTEMPTS = 3;
            if (validOtp.attempts >= MAX_ADMIN_ATTEMPTS) {
                return { ok: false as const, error: 'تعداد تلاش‌های مجاز تمام شده است. لطفاً کد جدید دریافت کنید.' };
            }

            if (validOtp.code !== hashOtp(otp)) {
                // Increment OTP attempts
                await tx.otpRequest.update({
                    where: { id: validOtp.id },
                    data: { attempts: validOtp.attempts + 1 }
                });

                const remaining = MAX_ADMIN_ATTEMPTS - validOtp.attempts - 1;
                return {
                    ok: false as const,
                    error: remaining > 0
                        ? `کد تأیید اشتباه است (${remaining} تلاش باقی‌مانده)`
                        : 'تعداد تلاش‌های مجاز تمام شده است'
                };
            }

            // Mark OTP as verified
            await tx.otpRequest.update({
                where: { id: validOtp.id },
                data: { verified: true }
            });

            return { ok: true as const };
        }, { isolationLevel: 'ReadCommitted' });

        if (!otpResult.ok) {
            return NextResponse.json({ error: otpResult.error }, { status: 401 });
        }

        // Check if admin is active
        if (admin.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'حساب کاربری ادمین شما غیرفعال یا مسدود است' },
                { status: 403 }
            )
        }

        // Generate JWT token
        const primaryRole = admin.roles[0] || 'ADMIN';
        const token = await generateAdminToken({
            adminId: admin.id,
            phone: admin.phone,
            role: primaryRole,
            roles: admin.roles,
        })

        // Create response
        const response = NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                phone: admin.phone,
                role: primaryRole,
                roles: admin.roles,
            },
        })

        response.cookies.set(
            ADMIN_TOKEN_COOKIE,
            token,
            getAdminTokenCookieOptionsForRequest(request)
        )

        await recordAnalyticsEvent({
            type: 'ADMIN_LOGIN',
            request,
            path: '/admin/login',
            referrer: request.headers.get('referer'),
            adminId: admin.id,
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        await logSystemError(error, '/api/admin/auth/login', 'ERROR')
        return NextResponse.json(
            { error: 'خطای داخلی سرور در پردازش ورود ادمین' },
            { status: 500 }
        )
    }
}
