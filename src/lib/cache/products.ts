import redis from '@/lib/redis'
import prisma from '@/lib/db'

// Cache TTL in seconds (2 minutes)
const PRODUCTS_CACHE_TTL = 120

// Cache version - increment this to invalidate all caches
let CACHE_VERSION = 1;

// Type for cached product list (only fields we need for carousels/listings)
export type CachedProduct = {
    id: number
    name: string
    slug: string
    price: number
    listPrice: number | null
    thumbnail: string | null
    inventoryStatus: string
    hasActiveOffer: boolean
}

// Cache key generator with version
const CACHE_KEYS = {
    productList: (page: number, limit: number, search?: string) =>
        `products:v${CACHE_VERSION}:list:${page}:${limit}:${search || 'all'}`,
    productBySlug: (slug: string) => `products:v${CACHE_VERSION}:slug:${slug}`,
}

/**
 * Get products with caching
 * Checks Redis cache first, falls back to DB, then caches the result
 */
export async function getProductsCached(options: {
    page?: number
    limit?: number
    search?: string
} = {}): Promise<{ products: CachedProduct[]; total: number; fromCache: boolean }> {
    const { page = 1, limit = 20, search } = options
    const cacheKey = CACHE_KEYS.productList(page, limit, search)

    try {
        // 1. Try to get from cache
        const cached = redis
            ? await redis.get<{ products: CachedProduct[]; total: number }>(cacheKey)
            : null

        if (cached) {
            console.log(`[Cache] HIT: ${cacheKey}`)
            return { ...cached, fromCache: true }
        }

        console.log(`[Cache] MISS: ${cacheKey}`)

        // 2. Cache miss - query database
        const skip = (page - 1) * limit

        // Build where clause for search
        const where = {
            isActive: true,
            ...(search && {
                name: {
                    contains: search,
                    mode: 'insensitive' as const,
                },
            }),
        }

        // Run count and query in parallel
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    listPrice: true,
                    thumbnail: true,
                    inventoryStatus: true,
                    hasActiveOffer: true,
                },
            }),
            prisma.product.count({ where }),
        ])

        // 3. Store in cache with TTL
        const data = { products, total }
        if (redis) {
            await redis.set(cacheKey, data, { ex: PRODUCTS_CACHE_TTL })
        }

        return { ...data, fromCache: false }

    } catch (error) {
        console.error('[Cache] Error:', error)

        // Fallback to direct DB query if cache fails
        const skip = (page - 1) * limit
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    listPrice: true,
                    thumbnail: true,
                    inventoryStatus: true,
                    hasActiveOffer: true,
                },
            }),
            prisma.product.count({ where: { isActive: true } }),
        ])

        return { products, total, fromCache: false }
    }
}

/**
 * Invalidate products cache using versioned keys
 * Instead of using KEYS (O(N) blocking), we increment version
 * Old keys will naturally expire via TTL
 */
export async function invalidateProductsCache(): Promise<void> {
    try {
        // Simply increment version - old keys become orphaned and expire via TTL
        CACHE_VERSION++;
        console.log(`[Cache] Invalidated by incrementing version to ${CACHE_VERSION}`)

        // Optionally clean up old keys in background using SCAN (non-blocking)
        // This is fire-and-forget, doesn't block the request
        cleanupOldCacheKeys().catch(err =>
            console.error('[Cache] Background cleanup error:', err)
        );
    } catch (error) {
        console.error('[Cache] Invalidation error:', error)
    }
}

/**
 * Clean up old cache keys using SCAN (non-blocking)
 * SCAN is O(1) per call and iterates incrementally
 */
async function cleanupOldCacheKeys(): Promise<void> {
    if (!redis) return

    try {
        let cursor: number | string = 0;
        const keysToDelete: string[] = [];
        const currentVersionPrefix = `products:v${CACHE_VERSION}:`;

        do {
            // SCAN is non-blocking unlike KEYS
            const result: [string | number, string[]] = await redis.scan(cursor, {
                match: 'products:*',
                count: 100
            });

            cursor = result[0];
            const keys: string[] = result[1];

            // Filter out current version keys, collect old ones for deletion
            for (const key of keys) {
                if (!key.startsWith(currentVersionPrefix)) {
                    keysToDelete.push(key);
                }
            }
        } while (cursor !== 0 && cursor !== '0');

        // Delete old keys in batches
        if (keysToDelete.length > 0) {
            // Delete in batches of 100 to avoid too many args
            for (let i = 0; i < keysToDelete.length; i += 100) {
                const batch = keysToDelete.slice(i, i + 100);
                await redis.del(...batch);
            }
            console.log(`[Cache] Cleaned up ${keysToDelete.length} old cache keys`);
        }
    } catch (error) {
        console.error('[Cache] Cleanup error:', error);
    }
}
