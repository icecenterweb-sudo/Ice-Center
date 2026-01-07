/**
 * PRODUCT PAGE CACHED QUERIES
 * 
 * ⚠️ Follows same pattern as homepage.ts
 * ⚠️ Static data is cached (60s TTL), dynamic data fetched fresh
 * ⚠️ Time logic (new Date()) is INSIDE cached functions, not in UI
 * ⚠️ Cache keys include slug for per-product caching
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';

// ============================================
// Cache Configuration
// ============================================

const PRODUCT_CACHE_TTL = 60; // 60 seconds as suggested

// ============================================
// Types
// ============================================

export interface ProductStaticData {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    description: string | null;
    brand: string | null;
    model: string | null;
    manufacturingCountry: string | null;
    condition: string;
    powerSource: string | null;
    voltage: string | null;
    phase: number | null;
    power: string | null;
    powerConsumption: number | null;
    coolingSystem: string | null;
    width: number | null;
    depth: number | null;
    height: number | null;
    weightNet: number | null;
    weightGross: number | null;
    images: string[];
    thumbnail: string | null;
    files: string[];
    tags: string[];
    specifications: unknown;
    features: string[];
    warranty: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    keywords: string[];
    subcategory: {
        id: number;
        name: string;
        slug: string;
        category: {
            id: number;
            name: string;
            slug: string;
        } | null;
    } | null;
}

export interface ProductDynamicData {
    id: number;
    price: number;
    listPrice: number | null;
    stock: number;
    inventoryStatus: string;
    rating: number | null;
    reviewCount: number;
    // Calculated offer pricing
    effectivePrice: number;
    originalPrice: number;
    discountPercent: number;
    hasOffer: boolean;
    activeOffer: {
        id: number;
        name: string;
        endDate: Date;
        badgeText: string | null;
    } | null;
}

// ============================================
// Cached Static Data Query
// ============================================

/**
 * Get static product data - specs, images, description, brand, features
 * This data doesn't change frequently and is safe to cache
 * 
 * Cache key: ['product-static', slug] - unique per product
 * Tags: ['product', `product:${slug}`] - granular invalidation
 */
export function getCachedProductStatic(slug: string) {
    return unstable_cache(
        async (): Promise<ProductStaticData | null> => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[CACHE] product-static:${slug} - fetching fresh data`);
            }

            const product = await prisma.product.findUnique({
                where: { slug },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    sku: true,
                    description: true,
                    brand: true,
                    model: true,
                    manufacturingCountry: true,
                    condition: true,
                    powerSource: true,
                    voltage: true,
                    phase: true,
                    power: true,
                    powerConsumption: true,
                    coolingSystem: true,
                    width: true,
                    depth: true,
                    height: true,
                    weightNet: true,
                    weightGross: true,
                    images: true,
                    thumbnail: true,
                    files: true,
                    tags: true,
                    specifications: true,
                    features: true,
                    warranty: true,
                    metaTitle: true,
                    metaDescription: true,
                    keywords: true,
                    subcategory: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                }
                            }
                        }
                    }
                }
            });

            return product;
        },
        ['product-static', slug],
        {
            revalidate: PRODUCT_CACHE_TTL,
            tags: ['product', `product:${slug}`]
        }
    )();
}

// ============================================
// Dynamic Data Query (No Cache)
// ============================================

/**
 * Get dynamic product data - price, stock, active offers
 * This data is real-time truth for Cart & Checkout
 * NO CACHING - always fresh
 */
export async function getProductDynamicData(productId: number): Promise<ProductDynamicData | null> {
    const now = new Date();

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            price: true,
            listPrice: true,
            stock: true,
            inventoryStatus: true,
            rating: true,
            reviewCount: true,
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
                            priority: true,
                        }
                    }
                },
                orderBy: { offer: { priority: 'desc' } },
                take: 1
            }
        }
    });

    if (!product) return null;

    // Calculate effective pricing
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
        // Legacy discount (listPrice > price)
        effectivePrice = product.price;
        discountPercent = Math.round(((product.listPrice - product.price) / product.listPrice) * 100);
        hasOffer = true;
    }

    return {
        id: product.id,
        price: product.price,
        listPrice: product.listPrice,
        stock: product.stock,
        inventoryStatus: product.inventoryStatus,
        rating: product.rating,
        reviewCount: product.reviewCount,
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
}

// ============================================
// Combined Query Helper
// ============================================

/**
 * Get full product data with cached static + fresh dynamic
 * Use this for the Product Detail page
 */
export async function getProductWithCaching(slug: string) {
    // First get cached static data
    const staticData = await getCachedProductStatic(slug);

    if (!staticData) return null;

    // Then get fresh dynamic data
    const dynamicData = await getProductDynamicData(staticData.id);

    if (!dynamicData) return null;

    // Merge both
    return {
        ...staticData,
        ...dynamicData,
    };
}

// ============================================
// Cache Revalidation Helper
// ============================================

/**
 * Revalidate product cache when product is updated
 * Call this from admin product edit actions
 */

