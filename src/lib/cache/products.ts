import redis from '@/lib/redis'
import prisma from '@/lib/db'

// Cache TTL in seconds (2 minutes)
const PRODUCTS_CACHE_TTL = 120

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

// Cache key generator
const CACHE_KEYS = {
    productList: (page: number, limit: number, search?: string) =>
        `products:list:${page}:${limit}:${search || 'all'}`,
    productBySlug: (slug: string) => `products:slug:${slug}`,
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
        const cached = await redis.get<{ products: CachedProduct[]; total: number }>(cacheKey)

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
        await redis.set(cacheKey, data, { ex: PRODUCTS_CACHE_TTL })

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
 * Invalidate products cache
 * Call this when products are created/updated/deleted
 */
export async function invalidateProductsCache(): Promise<void> {
    try {
        // Get all product cache keys and delete them
        const keys = await redis.keys('products:*')
        if (keys.length > 0) {
            await redis.del(...keys)
            console.log(`[Cache] Invalidated ${keys.length} product cache keys`)
        }
    } catch (error) {
        console.error('[Cache] Invalidation error:', error)
    }
}
