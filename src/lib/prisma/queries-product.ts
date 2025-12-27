import { prisma } from '@/lib/db';

// ============================================
// PRODUCT QUERIES
// ============================================

/**
 * Get product by slug with full details
 */
export async function getProductBySlug(slug: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                }
            }
        });

        return product;
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
