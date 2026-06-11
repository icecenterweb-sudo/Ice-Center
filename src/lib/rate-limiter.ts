import redis from '@/lib/redis'

/**
 * Rate Limiter Utility
 * Uses Upstash Redis as primary rate limiter with an in-memory Map fallback.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store fallback
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old in-memory entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean every minute

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
 */
async function checkRedisRateLimit(
    key: string,
    config: RateLimitConfig
): Promise<RateLimitResult | null> {
    if (!redis) return null

    try {
        const redisKey = `ratelimit:${key}`
        const count = await redis.get<number>(redisKey)

        if (count === null) {
            // First request in the window. Set key to 1 and expire it after windowMs (converted to seconds)
            const expireSeconds = Math.ceil(config.windowMs / 1000)
            await redis.set(redisKey, 1, { ex: expireSeconds })
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetIn: expireSeconds,
            }
        }

        if (count >= config.maxRequests) {
            // Limit exceeded. Get TTL.
            const ttl = await redis.ttl(redisKey)
            return {
                allowed: false,
                remaining: 0,
                resetIn: ttl > 0 ? ttl : Math.ceil(config.windowMs / 1000),
            }
        }

        // Increment the key count
        const newCount = await redis.incr(redisKey)
        const ttl = await redis.ttl(redisKey)

        return {
            allowed: true,
            remaining: Math.max(0, config.maxRequests - newCount),
            resetIn: ttl > 0 ? ttl : Math.ceil(config.windowMs / 1000),
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
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
    // Try various headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback
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
