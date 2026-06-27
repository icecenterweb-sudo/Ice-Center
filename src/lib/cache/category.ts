/**
 * CATEGORY PAGE CACHED QUERIES
 * 
 * Multi-layer caching architecture for category pages:
 * - STATIC (30-60 min): Category info, subcategories, brands
 * - SEMI-DYNAMIC (5 min): Base product listing (stable sort, no filters)
 * - DYNAMIC (no cache): Filtered/sorted/paginated queries
 * 
 * ⚠️ Time logic (new Date()) is INSIDE cached functions
 * ⚠️ Filters operate on top of cached data when possible
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { InventoryStatus, Prisma } from '@prisma/client';
import { getProductPricing } from '@/lib/offers/pricing';

// ============================================
// Cache Configuration (Configurable TTLs)
// ============================================

const CACHE_TTL_STATIC = 1800;      // 30 minutes for category/subcategory info
const CACHE_TTL_BRANDS = 600;       // 10 minutes for brand list
const CACHE_TTL_PRODUCTS = 300;     // 5 minutes for base product listing

// ============================================
// Types
// ============================================

export interface CachedCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
}

export interface CachedSubcategory {
    id: number;
    name: string;
    slug: string;
    productCount: number;
}

export interface CachedProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    inventoryStatus: InventoryStatus;
    brand: string | null;
    discountPercent: number;
    hasOffer: boolean;
    createdAt: Date;
    subcategoryId: number | null;
}

// ============================================
// STATIC LAYER (30 min TTL)
// ============================================

/**
 * Get category by slug (cached)
 * TTL: 30 minutes
 */
export async function getCachedCategoryBySlug(slug: string): Promise<CachedCategory | null> {
    'use cache';
    cacheLife({
        stale: CACHE_TTL_STATIC,
        revalidate: CACHE_TTL_STATIC,
        expire: CACHE_TTL_STATIC * 2
    });
    cacheTag(`category:${slug}`);

    const category = await prisma.category.findFirst({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
        },
    });
    return category;
}

/**
 * Get subcategories with product counts (cached)
 * TTL: 30 minutes
 */
export async function getCachedSubcategories(categoryId: number): Promise<CachedSubcategory[]> {
    'use cache';
    cacheLife({
        stale: CACHE_TTL_STATIC,
        revalidate: CACHE_TTL_STATIC,
        expire: CACHE_TTL_STATIC * 2
    });
    cacheTag(`category:${categoryId}`, `subcategories:${categoryId}`);

    const subcategories = await prisma.subcategory.findMany({
        where: { categoryId },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
        orderBy: { name: 'asc' },
    });

    return subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        productCount: sub._count.products,
    }));
}

/**
 * Get available brands for a category (cached)
 * TTL: 10 minutes
 */
export async function getCachedBrands(categoryId: number, subcategoryId?: number): Promise<string[]> {
    'use cache';
    cacheLife({
        stale: CACHE_TTL_BRANDS,
        revalidate: CACHE_TTL_BRANDS,
        expire: CACHE_TTL_BRANDS * 2
    });
    cacheTag(`category:${categoryId}`, `brands:${categoryId}`);

    const where: Prisma.ProductWhereInput = { isActive: true, brand: { not: null } };

    if (subcategoryId) {
        where.subcategoryId = subcategoryId;
    } else {
        const subcategoryIds = await prisma.subcategory
            .findMany({
                where: { categoryId },
                select: { id: true },
            })
            .then((subs) => subs.map((s) => s.id));
        where.subcategoryId = { in: subcategoryIds };
    }

    const results = await prisma.product.findMany({
        where,
        select: { brand: true },
        distinct: ['brand'],
    });

    return results
        .map((r) => r.brand)
        .filter((b): b is string => b !== null)
        .sort();
}

// ============================================
// SEMI-DYNAMIC LAYER (5 min TTL)
// ============================================

/**
 * Get base product listing for a category (cached)
 * Stable sort: createdAt desc (newest first)
 * No filters applied - filters operate on this data
 * TTL: 5 minutes
 */
export async function getCachedBaseProducts(categoryId: number): Promise<CachedProduct[]> {
    'use cache';
    cacheLife({
        stale: CACHE_TTL_PRODUCTS,
        revalidate: CACHE_TTL_PRODUCTS,
        expire: CACHE_TTL_PRODUCTS * 2
    });
    cacheTag(`category:${categoryId}`, `products:category:${categoryId}`);

    const now = new Date();

    // Get all subcategory IDs for this category
    const subcategoryIds = await prisma.subcategory
        .findMany({
            where: { categoryId },
            select: { id: true },
        })
        .then((subs) => subs.map((s) => s.id));

    // Fetch all products with STABLE SORT (createdAt desc)
    const allProducts = await prisma.product.findMany({
        where: {
            isActive: true,
            subcategoryId: { in: subcategoryIds },
        },
        orderBy: { createdAt: 'desc' }, // Stable sort
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            listPrice: true,
            thumbnail: true,
            inventoryStatus: true,
            brand: true,
            hasActiveOffer: true,
            createdAt: true,
            subcategoryId: true,
            offerProducts: {
                where: {
                    offer: {
                        isActive: true,
                        startDate: { lte: now },
                        endDate: { gt: now },
                    },
                },
                select: {
                    customDiscountValue: true,
                    offer: {
                        select: {
                            discountType: true,
                            discountValue: true,
                        },
                    },
                },
                orderBy: { offer: { priority: 'desc' } },
                take: 1,
            },
        },
    });

    // Calculate effective prices
    const productsWithPricing: CachedProduct[] = allProducts.map((product) => {
        const pricing = getProductPricing(product);

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: pricing.effectivePrice,
            listPrice: pricing.hasOffer ? pricing.originalPrice : null,
            thumbnail: product.thumbnail,
            inventoryStatus: product.inventoryStatus,
            brand: product.brand,
            discountPercent: pricing.discountPercent,
            hasOffer: pricing.hasOffer,
            createdAt: product.createdAt,
            subcategoryId: product.subcategoryId,
        };
    });

    return productsWithPricing;
}

// ============================================
// DYNAMIC LAYER (No Cache) - Filter Operations
// ============================================

export interface FilterParams {
    subcategoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    availability?: InventoryStatus[];
    onlyDiscount?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
}

/**
 * Apply filters to cached product list (client-side filtering)
 * This operates on the cached base products
 */
export function applyFiltersToProducts(
    products: CachedProduct[],
    params: FilterParams
): { products: CachedProduct[]; totalCount: number; totalPages: number; currentPage: number } {
    const {
        subcategoryId,
        minPrice,
        maxPrice,
        brands,
        availability,
        onlyDiscount,
        sort = 'newest',
        page = 1,
        limit = 12,
    } = params;

    let filtered = [...products];

    // Subcategory filter
    if (subcategoryId !== undefined) {
        filtered = filtered.filter((p) => p.subcategoryId === subcategoryId);
    }

    // Price filter
    if (minPrice !== undefined) {
        filtered = filtered.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
        filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    // Brand filter
    if (brands && brands.length > 0) {
        filtered = filtered.filter((p) => p.brand && brands.includes(p.brand));
    }

    // Availability filter
    if (availability && availability.length > 0) {
        filtered = filtered.filter((p) => availability.includes(p.inventoryStatus));
    }

    // Discount filter
    if (onlyDiscount) {
        filtered = filtered.filter((p) => p.hasOffer);
    }

    // Sorting
    if (sort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    }

    // Pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const paginatedProducts = filtered.slice(skip, skip + limit);

    return {
        products: paginatedProducts,
        totalCount,
        totalPages,
        currentPage: page,
    };
}

/**
 * Fresh query for filtered products (server-side)
 * Use when client-side filtering isn't sufficient (large datasets, complex filters)
 * This bypasses the cache and queries the DB directly
 */
export async function getFreshFilteredProducts(
    categoryId: number,
    params: FilterParams
): Promise<{ products: CachedProduct[]; totalCount: number; totalPages: number; currentPage: number }> {
    // Import and call the original query function
    const { getProducts } = await import('@/lib/prisma/queries-category');

    const result = await getProducts({
        categoryId,
        subcategoryId: params.subcategoryId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        brands: params.brands,
        availability: params.availability,
        onlyDiscount: params.onlyDiscount,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
    });

    // Transform to CachedProduct format
    const products: CachedProduct[] = result.products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        listPrice: p.listPrice,
        thumbnail: p.thumbnail,
        inventoryStatus: p.inventoryStatus,
        brand: p.brand,
        discountPercent: p.discountPercent || 0,
        hasOffer: p.hasOffer || false,
        createdAt: new Date(), // Not available from original query
        subcategoryId: p.subcategoryId,
    }));

    return {
        products,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
    };
}
