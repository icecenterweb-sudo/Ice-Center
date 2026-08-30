import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyUserToken, USER_TOKEN_COOKIE, type UserTokenPayload } from '@/lib/jwt';

type UserAuthResult =
    | { ok: true; payload: UserTokenPayload }
    | { ok: false; response: NextResponse };

/**
 * Require user authentication for API routes.
 * Reads the user_token cookie, verifies the JWT, and returns either the
 * decoded payload or a ready-to-send 401 NextResponse.
 *
 * Consolidates the "read cookie → verify → 401" boilerplate previously
 * duplicated across orders/wishlist/notifications/coupons/reviews routes.
 * (User-side counterpart of requireAdmin() in admin-auth.ts.)
 *
 * Usage:
 *   const auth = await requireUser();
 *   if (!auth.ok) return auth.response;
 *   const payload = auth.payload;
 */
export async function requireUser(): Promise<UserAuthResult> {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;

    if (!token) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 }),
        };
    }

    const payload = await verifyUserToken(token);
    if (!payload || !payload.userId) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 }),
        };
    }

    return { ok: true, payload };
}
