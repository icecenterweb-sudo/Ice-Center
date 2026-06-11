import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateAdminToken } from '@/lib/jwt'
import { recordAnalyticsEvent } from '@/lib/analytics'

// Rate limiting: Track failed attempts per phone
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

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

        // Rate limiting check
        const attempts = failedAttempts.get(phone);
        if (attempts && attempts.count >= MAX_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
            const lockoutMs = LOCKOUT_MINUTES * 60 * 1000;

            if (timeSinceLastAttempt < lockoutMs) {
                const remainingMinutes = Math.ceil((lockoutMs - timeSinceLastAttempt) / 60000);
                return NextResponse.json(
                    { error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` },
                    { status: 429 }
                )
            } else {
                // Reset after lockout period
                failedAttempts.delete(phone);
            }
        }

        // Check if admin exists first
        const admin = await prisma.admin.findUnique({
            where: { phone },
        })

        if (!admin) {
            // Track failed attempt (don't reveal if phone exists)
            trackFailedAttempt(phone);
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
            // Track failed attempt
            trackFailedAttempt(phone);

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

        // Clear failed attempts on success
        failedAttempts.delete(phone);

        // Generate JWT token
        const token = await generateAdminToken({
            adminId: admin.id,
            phone: admin.phone,
            role: admin.role,
        })

        // Create response
        const response = NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                phone: admin.phone,
                role: admin.role,
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

function trackFailedAttempt(phone: string) {
    const attempts = failedAttempts.get(phone);
    if (attempts) {
        attempts.count++;
        attempts.lastAttempt = new Date();
    } else {
        failedAttempts.set(phone, { count: 1, lastAttempt: new Date() });
    }
}
