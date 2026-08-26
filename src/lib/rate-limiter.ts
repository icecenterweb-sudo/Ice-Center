import redis from '@/lib/redis'

/**
 * Rate Limiter Utility
 * Uses Upstash Redis as primary rate limiter with an in-memory Map fallback.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store fallback (only used when Redis is unavailable)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Lazy cleanup: prune expired entries when the store grows large
function pruneExpiredEntries() {
    if (rateLimitStore.size < 1000) return;
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}

export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;  // Seconds until reset
}

/**
 * Check rate limit using Redis (Upstash)
 * Uses INCR + EXPIRE atomically to avoid TOCTOU race conditions.
 */
async function checkRedisRateLimit(
    key: string,
    config: RateLimitConfig
): Promise<RateLimitResult | null> {
    if (!redis) return null

    try {
        const redisKey = `ratelimit:${key}`
        const expireSeconds = Math.ceil(config.windowMs / 1000)

        // INCR is atomic: if key doesn't exist, Redis creates it with value 1
        const count = await redis.incr(redisKey)

        // Set expiry only on the first request (when count === 1)
        if (count === 1) {
            await redis.expire(redisKey, expireSeconds)
        }

        const ttl = await redis.ttl(redisKey)

        if (count > config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: ttl > 0 ? ttl : expireSeconds,
            }
        }

        return {
            allowed: true,
            remaining: Math.max(0, config.maxRequests - count),
            resetIn: ttl > 0 ? ttl : expireSeconds,
        }
    } catch (error) {
        console.warn('Redis rate limit error, falling back to memory:', error)
        return null // Fallback to in-memory
    }
}

/**
 * Check rate limit using in-memory Map
 */
function checkMemoryRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    pruneExpiredEntries();
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or window expired
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 0,
            resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000)
        };
    }

    // Increment count
    entry.count++;

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000)
    };
}

/**
 * Check rate limit for a given identifier (IP, userId, etc.)
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const redisResult = await checkRedisRateLimit(identifier, config)
    if (redisResult !== null) {
        return redisResult
    }
    return checkMemoryRateLimit(identifier, config)
}

/**
 * Get client IP from request safely.
 * When behind reverse proxies (Vercel, Nginx, Cloudflare), intermediate proxies append
 * the connecting client's IP to the right of `x-forwarded-for`. The leftmost value can
 * be easily forged/spoofed by client headers.
 * 
 * We evaluate trusted proxy hops from the right of `x-forwarded-for` (default: 1 hop)
 * or fall back to `x-real-ip` (which is typically set directly by the reverse proxy).
 */
export function getClientIp(request: Request): string {
    const realIp = request.headers.get('x-real-ip');
    const forwarded = request.headers.get('x-forwarded-for');

    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
        if (ips.length > 0) {
            const rawHops = process.env.TRUSTED_PROXY_HOPS;
            const hops = rawHops ? Math.max(1, parseInt(rawHops, 10) || 1) : 1;
            // Select IP from the right based on trusted proxy count
            const index = Math.max(0, ips.length - hops);
            return ips[index];
        }
    }

    if (realIp) {
        return realIp.trim();
    }

    return 'unknown';
}

// Preset configurations
export const RATE_LIMITS = {
    // Strict: 30 requests per minute (login, OTP)
    strict: { windowMs: 60000, maxRequests: 30 },

    // Normal: 60 requests per minute (product lists, search)
    normal: { windowMs: 60000, maxRequests: 60 },

    // Relaxed: 120 requests per minute (general API)
    relaxed: { windowMs: 60000, maxRequests: 120 },

    // Very strict: 10 requests per minute (sensitive operations)
    veryStrict: { windowMs: 60000, maxRequests: 10 },
};
