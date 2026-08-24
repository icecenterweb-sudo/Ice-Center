import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { InventoryStatus } from '@prisma/client';
import { getProductPricing } from '@/lib/offers/pricing';

// ============================================
// TYPES
// ============================================

export interface ProductFilterParams {
    page?: number;
    limit?: number;
    sort?: string;
    categoryId?: number;
    subcategoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    availability?: InventoryStatus[];
    onlyDiscount?: boolean;
    search?: string;
}

export interface ProductResult {
    products: {
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
        subcategoryId: number | null;
    }[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

// ============================================
// CATEGORY QUERIES
// ============================================

/**
 * Get all categories with product counts
 * Uses _count to avoid N+1 queries
 */
export async function getAllCategories() {
    return prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            description: true,
            _count: {
                select: {
                    subcategories: {
                        where: {
                            products: {
                                some: { isActive: true }
                            }
                        }
                    }
                }
            },
            subcategories: {
                select: {
                    _count: {
                        select: {
                            products: {
                                where: { isActive: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    }).then(categories => categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        description: cat.description,
        productCount: cat.subcategories.reduce((sum, sub) => sum + sub._count.products, 0)
    })));
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
    return await prisma.category.findFirst({
        where: { slug }
    });
}

/**
 * Get subcategories for a category with product counts
 * Uses _count to avoid N+1 queries
 */
export async function getSubcategoriesByCategoryId(categoryId: number) {
    return prisma.subcategory.findMany({
        where: { categoryId },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: {
                select: {
                    products: {
                        where: { isActive: true }
                    }
                }
            }
        }
    }).then(subs => subs.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        productCount: sub._count.products
    })));
}

// ============================================
// PRODUCT QUERIES
// ============================================

/**
 * Get products with filtering, sorting, and pagination
 * Now includes offer-based pricing with effectivePrice calculation
 */
export async function getProducts({
    page = 1,
    limit = 12,
    sort = 'newest',
    categoryId,
    subcategoryId,
    minPrice,
    maxPrice,
    brands,
    availability,
    onlyDiscount,
    search,
}: ProductFilterParams): Promise<ProductResult> {
    const safePage = Math.min(Math.max(1, page), 100);
    const skip = (safePage - 1) * limit;
    const now = new Date();

    // Build where clause
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Category filter (get all subcategories for that category)
    if (categoryId && !subcategoryId) {
        const subcategoryIds = await prisma.subcategory.findMany({
            where: { categoryId },
            select: { id: true }
        }).then(subs => subs.map(s => s.id));
        where.subcategoryId = { in: subcategoryIds };
    }

    // Subcategory filter
    if (subcategoryId) {
        where.subcategoryId = subcategoryId;
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Brand filter
    if (brands && brands.length > 0) {
        where.brand = { in: brands };
    }

    // Availability filter
    if (availability && availability.length > 0) {
        where.inventoryStatus = { in: availability };
    }

    // Discount filter - query-time active offer check or legacy listPrice (#23)
    if (onlyDiscount) {
        where.OR = [
            {
                offerProducts: {
                    some: {
                        offer: {
                            isActive: true,
                            startDate: { lte: now },
                            endDate: { gt: now },
                        }
                    }
                }
            },
            {
                AND: [
                    { listPrice: { not: null } },
                    { listPrice: { gt: 0 } },
                ]
            }
        ];
    }

    // Search filter — matches name, slug, brand, model, tags
    // Uses AND to not conflict with discount filter's OR
    if (search && search.trim().length > 0) {
        const q = search.trim();
        const searchConditions = [
            { name: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
            { brand: { contains: q, mode: 'insensitive' as const } },
            { model: { contains: q, mode: 'insensitive' as const } },
            { tags: { has: q } },
            { keywords: { has: q } },
        ];
        // Wrap search in AND so it doesn't merge with discount's OR
        where.AND = [
            ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
            { OR: searchConditions },
        ];
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    if (sort === 'price-desc') orderBy = { price: 'desc' };

    // Get total count and paginated products in parallel
    const [totalCount, dbProducts] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            orderBy,
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
                brand: true,
                hasActiveOffer: true,
                subcategoryId: true,
                // Include active offers for price calculation
                offerProducts: {
                    where: {
                        offer: {
                            isActive: true,
                            startDate: { lte: now },
                            endDate: { gt: now },
                        }
                    },
                    select: {
                        customDiscountValue: true,
                        offer: {
                            select: {
                                discountType: true,
                                discountValue: true,
                            }
                        }
                    },
                    orderBy: { offer: { priority: 'desc' } },
                    take: 1
                }
            }
        })
    ]);

    // Calculate effective prices for each product on the current page
    const products = dbProducts.map(product => {
        const pricing = getProductPricing(product);

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: pricing.effectivePrice, // Effective/selling price
            listPrice: pricing.hasOffer ? pricing.originalPrice : null, // Original price (for strikethrough)
            thumbnail: product.thumbnail,
            inventoryStatus: product.inventoryStatus,
            brand: product.brand,
            discountPercent: pricing.discountPercent, // For badge display
            hasOffer: pricing.hasOffer, // For filtering/badges
            subcategoryId: product.subcategoryId,
        };
    });

    return {
        products,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
    };
}

/**
 * Get available brands for filtering
 */
export async function getAvailableBrands(categoryId?: number, subcategoryId?: number) {
    const where: Prisma.ProductWhereInput = { isActive: true, brand: { not: null } };

    if (subcategoryId) {
        where.subcategoryId = subcategoryId;
    } else if (categoryId) {
        const subcategoryIds = await prisma.subcategory.findMany({
            where: { categoryId },
            select: { id: true }
        }).then(subs => subs.map(s => s.id));
        where.subcategoryId = { in: subcategoryIds };
    }

    return prisma.product.findMany({
        where,
        select: { brand: true },
        distinct: ['brand']
    }).then(results => results.map(r => r.brand).filter((b): b is string => b !== null).sort());
}
