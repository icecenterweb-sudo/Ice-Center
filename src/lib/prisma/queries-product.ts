import { prisma } from '@/lib/db';

// ============================================
// PRODUCT QUERIES
// ============================================

/**
 * Get product by slug with full details including offer pricing
 */
export async function getProductBySlug(slug: string) {
    try {
        const now = new Date();

        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                },
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
                                endDate: true,
                                badgeText: true,
                            }
                        }
                    },
                    orderBy: { offer: { priority: 'desc' } },
                    take: 1
                }
            }
        });

        if (!product) return null;

        // Calculate effective price
        const basePrice = product.listPrice || product.price;
        const activeOfferProduct = product.offerProducts[0];
        const activeOffer = activeOfferProduct?.offer;

        let effectivePrice = product.price;
        let discountPercent = 0;
        let hasOffer = false;

        if (activeOffer) {
            const discountValue = activeOfferProduct.customDiscountValue ?? activeOffer.discountValue;

            if (activeOffer.discountType === 'PERCENTAGE') {
                effectivePrice = basePrice * (1 - Number(discountValue) / 100);
                discountPercent = Math.round(Number(discountValue));
            } else {
                effectivePrice = basePrice - Number(discountValue);
                discountPercent = Math.round((Number(discountValue) / basePrice) * 100);
            }
            hasOffer = true;
        } else if (product.listPrice && product.listPrice > product.price) {
            // Legacy discount
            effectivePrice = product.price;
            discountPercent = Math.round(((product.listPrice - product.price) / product.listPrice) * 100);
            hasOffer = true;
        }

        // Return product with pricing info
        return {
            ...product,
            effectivePrice: Math.round(effectivePrice),
            originalPrice: hasOffer ? basePrice : product.price,
            discountPercent,
            hasOffer,
            activeOffer: activeOffer ? {
                id: activeOffer.id,
                name: activeOffer.name,
                endDate: activeOffer.endDate,
                badgeText: activeOffer.badgeText,
            } : null,
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

/**
 * Get similar products (same subcategory, excluding current product)
 */
export async function getSimilarProducts(productId: number, subcategoryId: number, limit = 8) {
    return await prisma.product.findMany({
        where: {
            subcategoryId,
            id: { not: productId },
            isActive: true
        },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            listPrice: true,
            thumbnail: true,
            inventoryStatus: true,
            brand: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Get product reviews
 */
export async function getProductReviews(productId: number) {
    // Placeholder for future reviews implementation
    return [];
}
