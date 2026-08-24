import { SignJWT, jwtVerify } from 'jose'

/**
 * Unified JWT utility for both Admin and User tokens.
 * Uses a `type` claim to differentiate token audiences, preventing
 * a user token from being accepted as an admin token and vice versa.
 */

// ============================================
// Secret & Config
// ============================================

let cachedJwtSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
    if (cachedJwtSecret) return cachedJwtSecret;

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required. Set it to a strong random string of at least 32 characters.');
    }

    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long for security.');
    }

    cachedJwtSecret = new TextEncoder().encode(secret);
    return cachedJwtSecret;
}

// Perform startup verification if env variable is set
try {
    if (process.env.JWT_SECRET) {
        getJwtSecret();
    }
} catch (error) {
    console.error('⚠️ [JWT Config Error]:', error);
}

const JWT_EXPIRY = '30d' // 30 days
const ADMIN_JWT_EXPIRY = '7d' // 7 days — shorter window limits blast radius of a leaked admin token

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

    const expiry = tokenType === 'admin' ? ADMIN_JWT_EXPIRY : JWT_EXPIRY;

    const token = await new SignJWT(fullPayload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiry)
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
    // In production always mark auth cookies Secure — x-forwarded-proto is
    // client-spooferable and must never be able to downgrade cookie security (#34)
    if (process.env.NODE_ENV === 'production') return true;

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

// Admin cookie: shorter maxAge to match the 7-day admin JWT expiry above.
export function getAdminTokenCookieOptions(secure: boolean) {
    return {
        ...getTokenCookieOptions(secure),
        maxAge: 60 * 60 * 24 * 7, // 7 days
    }
}

export function getAdminTokenCookieOptionsForRequest(request: Request) {
    return getAdminTokenCookieOptions(isSecureRequest(request))
}
