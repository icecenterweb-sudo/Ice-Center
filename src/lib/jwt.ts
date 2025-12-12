import { SignJWT, jwtVerify } from 'jose'

// Secret key for JWT signing (should be in .env in production)
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'
)

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
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as AdminTokenPayload
    } catch (error) {
        return null
    }
}
