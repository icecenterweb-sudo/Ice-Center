/**
 * Offer Database Queries
 * 
 * All database operations for the Offer system.
 * Uses query-time filtering for accuracy (not relying solely on flags).
 */

import { prisma } from '@/lib/db';
import { calculateEffectivePrice, isOfferActive, type OfferDiscount } from './pricing';

/**
 * Get active offers for the homepage carousel
 * Returns all products from featured, active, currently valid offers
 * Each product becomes a separate carousel item
 */
export async function getCarouselOffers(limit = 12) {
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

            // Use listPrice if available, otherwise use price as base
            const basePrice = product.listPrice || product.price;

            const offerDiscount: OfferDiscount = {
                discountType: offer.discountType,
                discountValue: Number(offerProduct.customDiscountValue ?? offer.discountValue),
                maxDiscountCap: offer.maxDiscountCap ? Number(offer.maxDiscountCap) : null,
            };

            const pricing = calculateEffectivePrice({
                basePrice,
                activeOffer: offerDiscount,
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

    // Calculate effective price
    const basePrice = product.listPrice || product.price;

    let pricing;
    if (activeOffer) {
        const offerDiscount: OfferDiscount = {
            discountType: activeOffer.discountType,
            discountValue: Number(activeOfferProduct.customDiscountValue ?? activeOffer.discountValue),
            maxDiscountCap: activeOffer.maxDiscountCap ? Number(activeOffer.maxDiscountCap) : null,
        };
        pricing = calculateEffectivePrice({ basePrice, activeOffer: offerDiscount });
    } else {
        pricing = calculateEffectivePrice({ basePrice, activeOffer: null });
    }

    return {
        ...product,
        effectivePrice: pricing.effectivePrice,
        originalPrice: pricing.originalPrice,
        discountPercent: pricing.discountPercent,
        discountAmount: pricing.discountAmount,
        hasOffer: pricing.hasOffer,
        activeOffer: activeOffer ? {
            id: activeOffer.id,
            name: activeOffer.name,
            endDate: activeOffer.endDate,
            badgeText: activeOffer.badgeText,
            badgeColor: activeOffer.badgeColor,
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
        const basePrice = product.listPrice || product.price;
        const activeOfferProduct = product.offerProducts[0];
        const activeOffer = activeOfferProduct?.offer;

        let pricing;
        if (activeOffer) {
            const offerDiscount: OfferDiscount = {
                discountType: activeOffer.discountType,
                discountValue: Number(activeOfferProduct.customDiscountValue ?? activeOffer.discountValue),
                maxDiscountCap: activeOffer.maxDiscountCap ? Number(activeOffer.maxDiscountCap) : null,
            };
            pricing = calculateEffectivePrice({ basePrice, activeOffer: offerDiscount });
        } else {
            pricing = calculateEffectivePrice({ basePrice, activeOffer: null });
        }

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
        const basePrice = product.listPrice || product.price;
        const activeOfferProduct = product.offerProducts[0];
        const activeOffer = activeOfferProduct?.offer;

        let pricing;
        if (activeOffer) {
            const offerDiscount: OfferDiscount = {
                discountType: activeOffer.discountType,
                discountValue: Number(activeOfferProduct.customDiscountValue ?? activeOffer.discountValue),
                maxDiscountCap: activeOffer.maxDiscountCap ? Number(activeOffer.maxDiscountCap) : null,
            };
            pricing = calculateEffectivePrice({ basePrice, activeOffer: offerDiscount });
        } else {
            pricing = calculateEffectivePrice({ basePrice, activeOffer: null });
        }

        return {
            productId: product.id,
            productName: product.name,
            effectivePrice: pricing.effectivePrice,
            originalPrice: pricing.originalPrice,
            discountPercent: pricing.discountPercent,
            hasOffer: pricing.hasOffer,
            offerId: activeOffer?.id || null,
            offerEndDate: activeOffer?.endDate || null,
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
 * Sync all offer flags (for cron job)
 * Checks offers that started or ended recently
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

    // Get unique product IDs
    const productIds = new Set<number>();
    for (const offer of affectedOffers) {
        for (const { productId } of offer.products) {
            productIds.add(productId);
        }
    }

    // Update each product's flag
    const results = { updated: 0, errors: 0 };
    for (const productId of productIds) {
        try {
            await updateProductOfferFlag(productId);
            results.updated++;
        } catch (error) {
            console.error(`Failed to update offer flag for product ${productId}:`, error);
            results.errors++;
        }
    }

    return results;
}
