import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateAdminToken } from '@/lib/jwt'
import { recordAnalyticsEvent } from '@/lib/analytics'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json()

        // Validate input
        if (!phone || !otp) {
            return NextResponse.json(
                { error: 'Phone and OTP are required' },
                { status: 400 }
            )
        }

        // Rate limiting per IP (Redis-backed, works in serverless)
        const clientIp = getClientIp(request);
        const ipRateLimit = await checkRateLimit(`admin-login:ip:${clientIp}`, RATE_LIMITS.strict);
        if (!ipRateLimit.allowed) {
            return NextResponse.json(
                { error: `Too many attempts. Try again in ${ipRateLimit.resetIn} seconds.` },
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
                { error: `Too many failed attempts. Try again in ${phoneRateLimit.resetIn} seconds.` },
                { status: 429 }
            )
        }

        // Check if admin exists first
        const admin = await prisma.admin.findUnique({
            where: { phone },
        })

        if (!admin) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Verify OTP against database (proper OTP validation)
        const validOtp = await prisma.otpRequest.findFirst({
            where: {
                phone,
                verified: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!validOtp || validOtp.code !== otp) {
            // Increment OTP attempts if exists
            if (validOtp) {
                await prisma.otpRequest.update({
                    where: { id: validOtp.id },
                    data: { attempts: validOtp.attempts + 1 }
                });
            }

            return NextResponse.json(
                { error: 'Invalid or expired OTP code' },
                { status: 401 }
            )
        }

        // Mark OTP as verified
        await prisma.otpRequest.update({
            where: { id: validOtp.id },
            data: { verified: true }
        });

        // Check if admin is active
        if (admin.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Admin account is blocked' },
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

        // Set httpOnly cookie
        const isProduction = process.env.NODE_ENV === 'production'
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })

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
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
