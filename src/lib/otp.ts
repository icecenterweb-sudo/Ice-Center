import { prisma } from '@/lib/db'

// OTP Configuration
export const OTP_EXPIRY_MINUTES = 2
export const MAX_ATTEMPTS = 3
export const RATE_LIMIT_COOLDOWN_SECONDS = 60

/**
 * Generate a random 4-digit OTP code
 */
export function generateOtpCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Check if a new OTP can be sent to this phone number
 * Returns whether allowed and wait time if not
 */
export async function canSendOtp(phone: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
    const cooldownTime = new Date(Date.now() - RATE_LIMIT_COOLDOWN_SECONDS * 1000)

    // Find the most recent OTP request for this phone
    const recentRequest = await prisma.otpRequest.findFirst({
        where: {
            phone,
            createdAt: { gte: cooldownTime },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (recentRequest) {
        const elapsedSeconds = Math.floor((Date.now() - recentRequest.createdAt.getTime()) / 1000)
        const waitSeconds = RATE_LIMIT_COOLDOWN_SECONDS - elapsedSeconds

        if (waitSeconds > 0) {
            return { allowed: false, waitSeconds }
        }
    }

    return { allowed: true }
}

/**
 * Store a new OTP request in the database
 */
export async function storeOtp(phone: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await prisma.otpRequest.create({
        data: {
            phone,
            code,
            expiresAt,
            verified: false,
            attempts: 0,
        },
    })
}

interface VerifyOtpResult {
    valid: boolean
    error?: string
    userId?: number
    isNewUser?: boolean
}

/**
 * Verify an OTP code for a phone number
 * Creates or updates user on successful verification
 */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    // Find the latest unexpired, unverified OTP request for this phone
    const otpRequest = await prisma.otpRequest.findFirst({
        where: {
            phone,
            verified: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (!otpRequest) {
        return { valid: false, error: 'کد تأیید منقضی شده یا یافت نشد' }
    }

    // Check max attempts
    if (otpRequest.attempts >= MAX_ATTEMPTS) {
        return { valid: false, error: 'تعداد تلاش‌های مجاز تمام شده است' }
    }

    // Check if code matches
    if (otpRequest.code !== code) {
        // Increment attempts
        await prisma.otpRequest.update({
            where: { id: otpRequest.id },
            data: { attempts: otpRequest.attempts + 1 },
        })

        const remainingAttempts = MAX_ATTEMPTS - otpRequest.attempts - 1
        return {
            valid: false,
            error: `کد تأیید اشتباه است. ${remainingAttempts} تلاش باقی‌مانده`
        }
    }

    // Mark OTP as verified
    await prisma.otpRequest.update({
        where: { id: otpRequest.id },
        data: { verified: true },
    })

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } })
    let isNewUser = false

    if (!user) {
        user = await prisma.user.create({
            data: {
                phone,
                isVerified: true,
            },
        })
        isNewUser = true
    } else if (!user.isVerified) {
        // Mark existing user as verified
        user = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        })
    }

    return {
        valid: true,
        userId: user.id,
        isNewUser,
    }
}

/**
 * Clean up expired OTP requests (can be called periodically)
 */
export async function cleanupExpiredOtps(): Promise<number> {
    const result = await prisma.otpRequest.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    })
    return result.count
}
