import { prisma } from '@/lib/db';
import { getProductPricing } from '@/lib/offers/pricing';

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

        const pricing = getProductPricing(product as any);

        // Return product with pricing info
        return {
            ...product,
            effectivePrice: pricing.effectivePrice,
            originalPrice: pricing.originalPrice,
            discountPercent: pricing.discountPercent,
            hasOffer: pricing.hasOffer,
            activeOffer: pricing.activeOffer,
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
 * Get product reviews (approved only, for public display)
 */
export async function getProductReviews(productId: number) {
    return await prisma.productReview.findMany({
        where: { productId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            user: {
                select: { firstName: true, lastName: true },
            },
        },
    });
}
