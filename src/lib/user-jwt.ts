import { SignJWT, jwtVerify } from 'jose'

// Secret key for user JWT signing (separate from admin)
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'
)

const JWT_EXPIRY = '30d' // 30 days

export interface UserTokenPayload {
    userId: number
    phone: string
}

/**
 * Generate JWT token for user
 */
export async function generateUserToken(payload: UserTokenPayload): Promise<string> {
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
