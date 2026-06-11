/**
 * @deprecated Use '@/lib/jwt' instead. This file is kept for backward compatibility.
 */
export {
    generateUserToken,
    verifyUserToken,
    USER_TOKEN_COOKIE,
    getTokenCookieOptions as getUserTokenCookieOptions,
    type UserTokenPayload,
} from '@/lib/jwt'
