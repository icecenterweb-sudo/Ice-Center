/**
 * PRODUCT PAGE CACHED QUERIES
 * 
 * ⚠️ Follows same pattern as homepage.ts
 * ⚠️ Static data is cached (60s TTL), dynamic data fetched fresh
 * ⚠️ Time logic (new Date()) is INSIDE cached functions, not in UI
 * ⚠️ Cache keys include slug for per-product caching
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { getProductPricing } from '@/lib/offers/pricing';

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
        id: number | null;
        name: string | null;
        endDate: Date | null;
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
export async function getCachedProductStatic(slug: string): Promise<ProductStaticData | null> {
    'use cache';
    cacheLife({
        stale: 60,
        revalidate: 60,
        expire: 120,
    });
    cacheTag('product', `product:${slug}`);

    let decodedSlug = slug;
    try {
        decodedSlug = decodeURIComponent(slug);
    } catch {
        decodedSlug = slug;
    }

    const cleanSlug = decodedSlug.trim();

    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: cleanSlug },
                { slug },
            ],
            isActive: true,
        },
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

    const pricing = getProductPricing(product);

    return {
        id: product.id,
        price: product.price,
        listPrice: product.listPrice,
        stock: product.stock,
        inventoryStatus: product.inventoryStatus,
        rating: product.rating,
        reviewCount: product.reviewCount,
        effectivePrice: pricing.effectivePrice,
        originalPrice: pricing.originalPrice,
        discountPercent: pricing.discountPercent,
        hasOffer: pricing.hasOffer,
        activeOffer: pricing.activeOffer,
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
