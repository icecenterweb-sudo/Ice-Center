/**
 * Offer Database Queries
 * 
 * All database operations for the Offer system.
 * Uses query-time filtering for accuracy (not relying solely on flags).
 */

import { prisma } from '@/lib/db';
import { connection } from 'next/server';
import { getProductPricing } from './pricing';

/**
 * Get active offers for the homepage carousel
 * Returns all products from featured, active, currently valid offers
 * Each product becomes a separate carousel item
 */
export async function getCarouselOffers(limit = 12) {
    // Use connection() to opt out of prerendering for time-sensitive data
    await connection();
    const now = new Date();

    const offers = await prisma.offer.findMany({
        where: {
            isActive: true,
            isFeatured: true,
            startDate: { lte: now },
            endDate: { gt: now },
        },
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            price: true,       // Using existing price field as base
                            listPrice: true,   // Original price if discounted
                            thumbnail: true,
                            stock: true,
                            isActive: true,
                        }
                    }
                }
                // Removed take: 1 to get ALL products per offer
            }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    // Flatten: each product in each offer becomes a separate carousel item
    const items: Array<{
        id: number;
        name: string;
        endDate: Date;
        badgeText: string | null;
        badgeColor: string | null;
        product: {
            id: number;
            title: string;
            slug: string;
            image: string | null;
            price: number;
            oldPrice: number;
            discount: number;
            inStock: boolean;
        };
    }> = [];

    for (const offer of offers) {
        for (const offerProduct of offer.products) {
            const product = offerProduct.product;

            // Skip inactive products
            if (!product.isActive) continue;

            const pricing = getProductPricing({
                price: product.price,
                listPrice: product.listPrice,
                offerProducts: [{
                    customDiscountValue: offerProduct.customDiscountValue,
                    offer: {
                        discountType: offer.discountType,
                        discountValue: offer.discountValue,
                        maxDiscountCap: offer.maxDiscountCap
                    }
                }]
            });

            items.push({
                id: offer.id,
                name: offer.name,
                endDate: offer.endDate,
                badgeText: offer.badgeText,
                badgeColor: offer.badgeColor,
                product: {
                    id: product.id,
                    title: product.name,
                    slug: product.slug,
                    image: product.thumbnail,
                    price: pricing.effectivePrice,
                    oldPrice: pricing.originalPrice,
                    discount: pricing.discountPercent,
                    inStock: product.stock > 0,
                }
            });

            // Stop if we've reached the limit
            if (items.length >= limit) break;
        }
        if (items.length >= limit) break;
    }

    return items;
}

/**
 * Get product with its active offer (if any)
 * Use for product detail pages
 */
export async function getProductWithActiveOffer(productId: number) {
    const now = new Date();

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            offerProducts: {
                where: {
                    offer: {
                        isActive: true,
                        startDate: { lte: now },
                        endDate: { gt: now },
                    }
                },
                include: {
                    offer: {
                        select: {
                            id: true,
                            name: true,
                            discountType: true,
                            discountValue: true,
                            maxDiscountCap: true,
                            endDate: true,
                            badgeText: true,
                            badgeColor: true,
                        }
                    }
                },
                orderBy: {
                    offer: { priority: 'desc' }
                },
                take: 1  // Highest priority offer only
            },
            subcategory: {
                include: { category: true }
            }
        }
    });

    if (!product) return null;

    const activeOfferProduct = product.offerProducts[0];
    const activeOffer = activeOfferProduct?.offer;

    const pricing = getProductPricing(product);

    return {
        ...product,
        effectivePrice: pricing.effectivePrice,
        originalPrice: pricing.originalPrice,
        discountPercent: pricing.discountPercent,
        discountAmount: pricing.originalPrice - pricing.effectivePrice,
        hasOffer: pricing.hasOffer,
        activeOffer: pricing.activeOffer ? {
            ...pricing.activeOffer,
            badgeColor: activeOffer?.badgeColor || null,
        } : null,
    };
}

/**
 * Get products for category page with offer prices
 * Uses optimized query with selective fields
 */
export async function getCategoryProductsWithPrices(
    categoryId: number,
    options: { page?: number; limit?: number } = {}
) {
    const { page = 1, limit = 24 } = options;
    const now = new Date();

    const products = await prisma.product.findMany({
        where: {
            subcategory: { categoryId },
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            listPrice: true,
            thumbnail: true,
            stock: true,
            hasActiveOffer: true,
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
                            maxDiscountCap: true,
                        }
                    }
                },
                orderBy: { offer: { priority: 'desc' } },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    // Calculate effective prices
    return products.map(product => {
        const pricing = getProductPricing(product);

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            thumbnail: product.thumbnail,
            effectivePrice: pricing.effectivePrice,
            originalPrice: pricing.originalPrice,
            discountPercent: pricing.discountPercent,
            hasOffer: pricing.hasOffer,
            inStock: product.stock > 0,
        };
    });
}

/**
 * Get fresh prices for cart items
 * CRITICAL: Always use this for cart/checkout, never cached data
 */
export async function getCartItemPrices(productIds: number[]) {
    const now = new Date();

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            name: true,
            price: true,
            listPrice: true,
            stock: true,
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
                            id: true,
                            name: true,
                            discountType: true,
                            discountValue: true,
                            maxDiscountCap: true,
                            endDate: true,
                        }
                    }
                },
                orderBy: { offer: { priority: 'desc' } },
                take: 1
            }
        }
    });

    return products.map(product => {
        const pricing = getProductPricing(product);

        return {
            productId: product.id,
            productName: product.name,
            effectivePrice: pricing.effectivePrice,
            originalPrice: pricing.originalPrice,
            discountPercent: pricing.discountPercent,
            hasOffer: pricing.hasOffer,
            offerId: pricing.activeOffer?.id || null,
            offerEndDate: pricing.activeOffer?.endDate || null,
            inStock: product.stock > 0,
        };
    });
}

/**
 * Update hasActiveOffer flag for a product
 * Call this when offers change
 */
export async function updateProductOfferFlag(productId: number) {
    const now = new Date();

    const hasOffer = await prisma.offerProduct.count({
        where: {
            productId,
            offer: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gt: now },
            }
        }
    }) > 0;

    await prisma.product.update({
        where: { id: productId },
        data: { hasActiveOffer: hasOffer }
    });

    return hasOffer;
}

/**
 * Synchronize hasActiveOffer flags for a specific set of product IDs in batch
 */
export async function syncOfferFlagsForProductIds(
    productIds: number[],
    txClient?: {
        offerProduct: { findMany: typeof prisma.offerProduct.findMany };
        product: { updateMany: typeof prisma.product.updateMany };
    }
): Promise<void> {
    if (productIds.length === 0) return;
    const client = txClient || prisma;
    const now = new Date();

    const productsWithActiveOffers = await client.offerProduct.findMany({
        where: {
            productId: { in: productIds },
            offer: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gt: now },
            }
        },
        select: { productId: true },
        distinct: ['productId'],
    });

    const activeProductIds = new Set(productsWithActiveOffers.map(p => p.productId));
    const toTrue = productIds.filter(id => activeProductIds.has(id));
    const toFalse = productIds.filter(id => !activeProductIds.has(id));

    if (toTrue.length > 0) {
        await client.product.updateMany({
            where: { id: { in: toTrue } },
            data: { hasActiveOffer: true }
        });
    }

    if (toFalse.length > 0) {
        await client.product.updateMany({
            where: { id: { in: toFalse } },
            data: { hasActiveOffer: false }
        });
    }
}

/**
 * Sync all offer flags (for cron job)
 * Uses batch updates instead of N+1 queries
 */
export async function syncOfferFlags(minutesWindow = 5) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - minutesWindow * 60 * 1000);

    // Find offers that started or ended in the window
    const affectedOffers = await prisma.offer.findMany({
        where: {
            OR: [
                // Started in window
                { startDate: { gte: windowStart, lte: now } },
                // Ended in window
                { endDate: { gte: windowStart, lte: now } },
            ]
        },
        include: {
            products: { select: { productId: true } }
        }
    });

    // Get unique product IDs that might be affected
    const affectedProductIds = new Set<number>();
    for (const offer of affectedOffers) {
        for (const { productId } of offer.products) {
            affectedProductIds.add(productId);
        }
    }

    if (affectedProductIds.size === 0) {
        return { updated: 0, errors: 0 };
    }

    const productIdArray = Array.from(affectedProductIds);

    // BATCH UPDATE: Find which products actually have active offers now
    const productsWithActiveOffers = await prisma.offerProduct.findMany({
        where: {
            productId: { in: productIdArray },
            offer: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gt: now },
            }
        },
        select: { productId: true },
        distinct: ['productId'],
    });

    const activeProductIds = productsWithActiveOffers.map(p => p.productId);
    const inactiveProductIds = productIdArray.filter(id => !activeProductIds.includes(id));

    // BATCH UPDATE: Set hasActiveOffer = true for active, false for inactive
    const results = { updated: 0, errors: 0 };

    try {
        await prisma.$transaction([
            // Set true for products with active offers
            ...(activeProductIds.length > 0 ? [
                prisma.product.updateMany({
                    where: { id: { in: activeProductIds } },
                    data: { hasActiveOffer: true }
                })
            ] : []),
            // Set false for products without active offers
            ...(inactiveProductIds.length > 0 ? [
                prisma.product.updateMany({
                    where: { id: { in: inactiveProductIds } },
                    data: { hasActiveOffer: false }
                })
            ] : []),
        ]);

        results.updated = productIdArray.length;
    } catch (error) {
        console.error('Failed to batch update offer flags:', error);
        results.errors = productIdArray.length;
    }

    return results;
}
