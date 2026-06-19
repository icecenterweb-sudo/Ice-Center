import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { InventoryStatus } from '@prisma/client';

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
}: ProductFilterParams): Promise<ProductResult> {
    const skip = (page - 1) * limit;
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

    // Discount filter - now uses hasActiveOffer OR legacy listPrice
    if (onlyDiscount) {
        where.OR = [
            { hasActiveOffer: true },
            { listPrice: { not: null } }
        ];
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    if (sort === 'price-desc') orderBy = { price: 'desc' };

    // Fetch products with offer data
    const allProducts = await prisma.product.findMany({
        where,
        orderBy,
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
    });

    // Calculate effective prices for each product
    const productsWithPricing = allProducts.map(product => {
        // Base price is listPrice (original) or price
        const basePrice = product.listPrice || product.price;
        const activeOfferProduct = product.offerProducts[0];
        const activeOffer = activeOfferProduct?.offer;

        let effectivePrice = product.price; // Default to current price
        let discountPercent = 0;
        let hasOffer = false;

        if (activeOffer) {
            // Calculate from offer
            const discountValue = activeOfferProduct.customDiscountValue ?? activeOffer.discountValue;

            if (activeOffer.discountType === 'PERCENTAGE') {
                effectivePrice = basePrice * (1 - discountValue / 100);
                discountPercent = Math.round(discountValue);
            } else {
                effectivePrice = basePrice - discountValue;
                discountPercent = Math.round((discountValue / basePrice) * 100);
            }
            hasOffer = true;
        } else if (product.listPrice && product.listPrice > product.price) {
            // Legacy discount (listPrice > price)
            effectivePrice = product.price;
            discountPercent = Math.round(((product.listPrice - product.price) / product.listPrice) * 100);
            hasOffer = true;
        }

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Math.round(effectivePrice), // Effective/selling price
            listPrice: hasOffer ? basePrice : null, // Original price (for strikethrough)
            thumbnail: product.thumbnail,
            inventoryStatus: product.inventoryStatus,
            brand: product.brand,
            discountPercent, // For badge display
            hasOffer, // For filtering/badges
        };
    });

    // Apply discount filter post-processing
    let filteredProducts = productsWithPricing;
    if (onlyDiscount) {
        filteredProducts = productsWithPricing.filter(p => p.hasOffer);
    }

    const totalCount = filteredProducts.length;
    const products = filteredProducts.slice(skip, skip + limit);

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
