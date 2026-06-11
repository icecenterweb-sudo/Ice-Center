import { prisma } from '@/lib/db'

// OTP Configuration
export const OTP_EXPIRY_MINUTES = 2
export const MAX_ATTEMPTS = 3
export const RATE_LIMIT_COOLDOWN_SECONDS = 60

/**
 * Generate a random 4-digit OTP code
 */
export function generateOtpCode(): string {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return (1000 + (array[0] % 9000)).toString()
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
 * USES TRANSACTION to prevent race conditions
 */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    // Use transaction to prevent race conditions
    return prisma.$transaction(async (tx) => {
        // Find the latest unexpired, unverified OTP request for this phone
        const otpRequest = await tx.otpRequest.findFirst({
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
            // Increment attempts within transaction
            await tx.otpRequest.update({
                where: { id: otpRequest.id },
                data: { attempts: otpRequest.attempts + 1 },
            })

            const remainingAttempts = MAX_ATTEMPTS - otpRequest.attempts - 1
            return {
                valid: false,
                error: `کد تأیید اشتباه است. ${remainingAttempts} تلاش باقی‌مانده`
            }
        }

        // Mark OTP as verified within transaction
        await tx.otpRequest.update({
            where: { id: otpRequest.id },
            data: { verified: true },
        })

        // Use upsert to prevent race condition on user creation
        const user = await tx.user.upsert({
            where: { phone },
            update: { isVerified: true },
            create: {
                phone,
                isVerified: true
            },
        })

        // Check if this was a new user by comparing createdAt with updatedAt
        // If they're very close (within 1 second), it's a new user
        const isNewUser = Math.abs(user.createdAt.getTime() - user.updatedAt.getTime()) < 1000

        return {
            valid: true,
            userId: user.id,
            isNewUser,
        }
    }, {
        // Set isolation level for stronger consistency
        isolationLevel: 'Serializable',
        maxWait: 5000, // 5 seconds max wait for transaction lock
        timeout: 10000, // 10 seconds timeout for entire transaction
    })
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
