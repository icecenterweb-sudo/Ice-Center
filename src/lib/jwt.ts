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

export interface AdminTokenPayload {
    adminId: number
    phone: string
    role: string
}

/**
 * Generate JWT token for admin
 */
export async function generateAdminToken(payload: AdminTokenPayload): Promise<string> {
    const JWT_SECRET = getJwtSecret();

    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(JWT_SECRET)

    return token
}

/**
 * Verify and decode JWT token
 * Returns payload if valid, null if invalid
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
    try {
        const JWT_SECRET = getJwtSecret();
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as AdminTokenPayload
    } catch {
        return null
    }
}
