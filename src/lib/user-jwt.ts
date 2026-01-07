import { SignJWT, jwtVerify } from 'jose'

/**
 * Get JWT secret - validates at runtime, not module load
 * This allows build to succeed while still enforcing security at runtime
 */
function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required. Set it to a strong random string of at least 32 characters.');
    }

    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long for security.');
    }

    return new TextEncoder().encode(secret);
}

const JWT_EXPIRY = '30d' // 30 days

export interface UserTokenPayload {
    userId: number
    phone: string
}

/**
 * Generate JWT token for user
 */
export async function generateUserToken(payload: UserTokenPayload): Promise<string> {
    const JWT_SECRET = getJwtSecret();

    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(JWT_SECRET)

    return token
}

/**
 * Verify and decode user JWT token
 * Returns payload if valid, null if invalid
 */
export async function verifyUserToken(token: string): Promise<UserTokenPayload | null> {
    try {
        const JWT_SECRET = getJwtSecret();
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as UserTokenPayload
    } catch {
        return null
    }
}

/**
 * Cookie name for user session token
 */
export const USER_TOKEN_COOKIE = 'user_token'

/**
 * Get cookie options for user token
 */
export function getUserTokenCookieOptions(isProduction: boolean) {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    }
}
