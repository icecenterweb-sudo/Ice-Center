import { SignJWT, jwtVerify } from 'jose'

/**
 * Unified JWT utility for both Admin and User tokens.
 * Uses a `type` claim to differentiate token audiences, preventing
 * a user token from being accepted as an admin token and vice versa.
 */

// ============================================
// Secret & Config
// ============================================

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

// ============================================
// Token Types
// ============================================

export type TokenType = 'admin' | 'user'

export interface AdminTokenPayload {
    type: 'admin'
    adminId: number
    phone: string
    role: string
    roles: string[]
}

export interface UserTokenPayload {
    type: 'user'
    userId: number
    phone: string
}

type TokenPayloadMap = {
    admin: AdminTokenPayload
    user: UserTokenPayload
}

// ============================================
// Generate Token
// ============================================

export async function generateToken<T extends TokenType>(
    tokenType: T,
    payload: Omit<TokenPayloadMap[T], 'type'>
): Promise<string> {
    const JWT_SECRET = getJwtSecret();

    const fullPayload = { ...payload, type: tokenType };

    const token = await new SignJWT(fullPayload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(JWT_SECRET)

    return token
}

// ============================================
// Verify Token
// ============================================

export async function verifyToken<T extends TokenType>(
    tokenType: T,
    token: string
): Promise<TokenPayloadMap[T] | null> {
    try {
        const JWT_SECRET = getJwtSecret();
        const { payload } = await jwtVerify(token, JWT_SECRET)

        // Ensure the token type matches what we expect
        if (payload.type !== tokenType) {
            return null
        }

        return payload as unknown as TokenPayloadMap[T]
    } catch {
        return null
    }
}

// ============================================
// Convenience functions (backward compatible)
// ============================================

export async function generateAdminToken(payload: Omit<AdminTokenPayload, 'type'>): Promise<string> {
    return generateToken('admin', payload)
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
    return verifyToken('admin', token)
}

export async function generateUserToken(payload: Omit<UserTokenPayload, 'type'>): Promise<string> {
    return generateToken('user', payload)
}

export async function verifyUserToken(token: string): Promise<UserTokenPayload | null> {
    return verifyToken('user', token)
}

// ============================================
// Cookie Configuration
// ============================================

export const ADMIN_TOKEN_COOKIE = 'admin_token'
export const USER_TOKEN_COOKIE = 'user_token'

export function isSecureRequest(request: Request): boolean {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    if (forwardedProto) {
        return forwardedProto === 'https'
    }

    return new URL(request.url).protocol === 'https:'
}

export function getTokenCookieOptions(secure: boolean) {
    return {
        httpOnly: true,
        secure,
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    }
}

export function getTokenCookieOptionsForRequest(request: Request) {
    return getTokenCookieOptions(isSecureRequest(request))
}
