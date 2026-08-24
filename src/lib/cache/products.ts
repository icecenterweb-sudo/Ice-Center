import redis from '@/lib/redis'
import prisma from '@/lib/db'

// Cache TTL in seconds (2 minutes)
const PRODUCTS_CACHE_TTL = 120

// Redis key for shared cache version
const REDIS_VERSION_KEY = 'products:version'

// Local fallback in case Redis is not configured
let localVersionFallback = 1

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

/**
 * Get current shared cache version from Redis
 */
export async function getProductsCacheVersion(): Promise<number> {
    if (!redis) return localVersionFallback

    try {
        const v = await redis.get<number | string>(REDIS_VERSION_KEY)
        if (v !== null && v !== undefined) {
            const parsed = typeof v === 'number' ? v : parseInt(String(v), 10)
            if (!isNaN(parsed) && parsed > 0) {
                return parsed
            }
        }
        // Initialize version if missing
        await redis.set(REDIS_VERSION_KEY, 1)
        return 1
    } catch {
        return localVersionFallback
    }
}

// Cache key generator with version
export const CACHE_KEYS = {
    productList: (version: number, page: number, limit: number, search?: string) =>
        `products:v${version}:list:${page}:${limit}:${search || 'all'}`,
    productBySlug: (version: number, slug: string) => `products:v${version}:slug:${slug}`,
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
    const version = await getProductsCacheVersion()
    const cacheKey = CACHE_KEYS.productList(version, page, limit, search)

    try {
        // 1. Try to get from cache
        const cached = redis
            ? await redis.get<{ products: CachedProduct[]; total: number }>(cacheKey)
            : null

        if (cached) {
            return { ...cached, fromCache: true }
        }

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
        const formattedProducts: CachedProduct[] = products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            listPrice: p.listPrice ? Number(p.listPrice) : null,
            thumbnail: p.thumbnail,
            inventoryStatus: p.inventoryStatus,
            hasActiveOffer: p.hasActiveOffer,
        }))
        const data = { products: formattedProducts, total }
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

        const formattedProducts: CachedProduct[] = products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            listPrice: p.listPrice ? Number(p.listPrice) : null,
            thumbnail: p.thumbnail,
            inventoryStatus: p.inventoryStatus,
            hasActiveOffer: p.hasActiveOffer,
        }))

        return { products: formattedProducts, total, fromCache: false }
    }
}

/**
 * Invalidate products cache using Redis-backed version increment
 * Atomic INCR ensures multi-instance safety and survives process restarts.
 */
export async function invalidateProductsCache(): Promise<number> {
    try {
        localVersionFallback++

        if (redis) {
            const newVersion = await redis.incr(REDIS_VERSION_KEY)

            // Optionally clean up old keys in background using SCAN (non-blocking)
            cleanupOldCacheKeys(newVersion).catch(err =>
                console.error('[Cache] Background cleanup error:', err)
            )

            return newVersion
        }

        return localVersionFallback
    } catch (error) {
        console.error('[Cache] Invalidation error:', error)
        return localVersionFallback
    }
}

/**
 * Clean up old cache keys using SCAN (non-blocking)
 * SCAN is O(1) per call and iterates incrementally
 */
async function cleanupOldCacheKeys(currentVersion: number): Promise<void> {
    if (!redis) return

    try {
        let cursor: number | string = 0
        const keysToDelete: string[] = []
        const currentVersionPrefix = `products:v${currentVersion}:`

        do {
            const result: [string | number, string[]] = await redis.scan(cursor, {
                match: 'products:*',
                count: 100
            })

            cursor = result[0]
            const keys: string[] = result[1]

            // Filter out current version keys and the version key itself
            for (const key of keys) {
                if (key !== REDIS_VERSION_KEY && !key.startsWith(currentVersionPrefix)) {
                    keysToDelete.push(key)
                }
            }
        } while (cursor !== 0 && cursor !== '0')

        // Delete old keys in batches
        if (keysToDelete.length > 0) {
            for (let i = 0; i < keysToDelete.length; i += 100) {
                const batch = keysToDelete.slice(i, i + 100)
                await redis.del(...batch)
            }
        }
    } catch (error) {
        console.error('[Cache] Cleanup error:', error)
    }
}
