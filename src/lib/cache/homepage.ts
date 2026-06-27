/**
 * HOMEPAGE CACHED QUERIES
 * 
 * ⚠️ This file is COMPLETELY ISOLATED from dynamic query files
 * ⚠️ Do NOT import from lib/offers/queries.ts or lib/blog/queries.ts
 * ⚠️ All queries use prisma directly with "use cache" directive
 * ⚠️ Time logic (new Date()) is INSIDE cached functions, not in UI
 */

import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { BannerPosition, DiscountType } from '@prisma/client';
import { getProductPricing } from '@/lib/offers/pricing';

// ============================================
// Types
// ============================================

type DBProduct = {
    id: number;
    name: string;
    slug: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    hasActiveOffer?: boolean;
    offerProducts?: Array<{
        customDiscountValue: number | null;
        offer: { discountType: DiscountType; discountValue: number };
    }>;
};

export interface SlideForDisplay {
    id: number;
    desktopImage: string;
    mobileImage: string;
    alt: string;
    link: string;
}

export interface CategoryForDisplay {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    productCount: number;
}

export interface ProductForDisplay {
    id: number;
    title: string;
    image: string;
    price: number;
    oldPrice?: number;
    href: string;
}

export interface CategoryWithProducts {
    id: number;
    name: string;
    slug: string;
    products: ProductForDisplay[];
}

export interface BannerForDisplay {
    id: number;
    title: string;
    desktopImage: string;
    mobileImage: string;
    alt: string;
    link: string;
}

export interface BlogPostForDisplay {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    coverImage: string | null;
    summary: string | null;
    publishedAt: Date | null;
}

// ============================================
// Helper Functions (inside cached boundary)
// ============================================

function transformProducts(products: DBProduct[]): ProductForDisplay[] {
    return products.map((p) => {
        const pricing = getProductPricing(p);

        return {
            id: p.id,
            title: p.name,
            image: p.thumbnail || '/no-image.svg',
            price: pricing.effectivePrice,
            oldPrice: pricing.hasOffer ? pricing.originalPrice : undefined,
            href: `/products/${p.slug}`,
        };
    });
}

function resolveLink(banner: {
    link: string | null;
    product: { slug: string } | null;
    category: { slug: string } | null;
}): string {
    if (banner.link) return banner.link;
    if (banner.product) return `/products/${banner.product.slug}`;
    if (banner.category) return `/categories/${banner.category.slug}`;
    return '#';
}

// ============================================
// Cached Queries
// ============================================

/**
 * Get hero slides for homepage
 */
export async function getCachedSlides(): Promise<SlideForDisplay[]> {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'slides');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] slides - fetching fresh data');
    }

    const slides = await prisma.slide.findMany({
        where: { isActive: true },
        include: {
            product: { select: { id: true, slug: true } },
            category: { select: { id: true, slug: true } },
        },
        orderBy: { order: 'asc' },
    });

    return slides.map(slide => ({
        id: slide.id,
        desktopImage: slide.desktopImage,
        mobileImage: slide.mobileImage,
        alt: slide.alt,
        link: slide.link ||
            (slide.product ? `/products/${slide.product.slug}` : null) ||
            (slide.category ? `/categories/${slide.category.slug}` : '#'),
    }));
}

/**
 * Get categories with product counts for homepage
 */
export async function getCachedCategories(): Promise<CategoryForDisplay[]> {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'categories');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] categories - fetching fresh data');
    }

    const categories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            subcategories: {
                select: {
                    _count: { select: { products: true } }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        productCount: category.subcategories.reduce((sum, sub) => sum + sub._count.products, 0)
    }));
}

/**
 * Get featured offers for homepage carousel
 * Note: new Date() is INSIDE cached function - acceptable 5 min delay
 */
export async function getCachedOffers() {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'offers');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] offers - fetching fresh data');
    }

    const now = new Date(); // Time logic inside cache

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
                            price: true,
                            listPrice: true,
                            thumbnail: true,
                            stock: true,
                            isActive: true,
                        }
                    }
                }
            }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    // Transform to carousel format
    const items = offers.flatMap(offer =>
        offer.products
            .filter(op => op.product.isActive && op.product.stock > 0)
            .map(op => {
                const product = op.product;
                const pricing = getProductPricing({
                    price: product.price,
                    listPrice: product.listPrice,
                    offerProducts: [{
                        customDiscountValue: op.customDiscountValue,
                        offer: {
                            discountType: offer.discountType,
                            discountValue: offer.discountValue,
                            maxDiscountCap: offer.maxDiscountCap
                        }
                    }]
                });

                return {
                    id: offer.id,
                    name: offer.name,
                    endDate: offer.endDate,
                    badgeText: offer.badgeText,
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
                };
            })
    ).slice(0, 12);

    return items;
}

/**
 * Get products by category for homepage carousels
 * Note: new Date() is INSIDE cached function
 */
export async function getCachedCategoryProducts(): Promise<{ categories: CategoryWithProducts[]; newestProducts: ProductForDisplay[] }> {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'products');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] category-products - fetching fresh data');
    }

    const now = new Date(); // Time logic inside cache

    const categories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            subcategories: {
                select: {
                    products: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            price: true,
                            listPrice: true,
                            thumbnail: true,
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
                                        }
                                    }
                                },
                                take: 1
                            }
                        },
                        take: 12,
                    },
                }
            }
        },
        orderBy: { name: 'asc' },
        take: 6
    });

    const categoriesWithProducts = categories
        .map(category => {
            const products = category.subcategories.flatMap(sub => sub.products);
            return {
                id: category.id,
                name: category.name,
                slug: category.slug,
                products: transformProducts(products),
            };
        })
        .filter(cat => cat.products.length > 0);

    const newestProducts = categoriesWithProducts.flatMap(cat => cat.products).slice(0, 12);

    return { categories: categoriesWithProducts, newestProducts };
}

/**
 * Get banners by position
 */
async function getBannersByPosition(position: BannerPosition): Promise<BannerForDisplay[]> {
    try {
        const banners = await prisma.banner.findMany({
            where: {
                position,
                isActive: true,
            },
            include: {
                product: { select: { slug: true } },
                category: { select: { slug: true } },
            },
            orderBy: { order: 'asc' },
        });

        return banners.map((banner) => ({
            id: banner.id,
            title: banner.title,
            desktopImage: banner.desktopImage,
            mobileImage: banner.mobileImage,
            alt: banner.alt,
            link: resolveLink(banner),
        }));
    } catch (error) {
        if ((error as { code?: string })?.code === 'P2021') {
            console.warn('Banner table does not exist yet.');
            return [];
        }
        throw error;
    }
}

export async function getCachedSingleBanners(): Promise<BannerForDisplay[]> {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'banners');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] single-banners - fetching fresh data');
    }
    return getBannersByPosition('SINGLE_FULL');
}

export async function getCachedDoubleBanners(): Promise<BannerForDisplay[]> {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'banners');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] double-banners - fetching fresh data');
    }
    return getBannersByPosition('DOUBLE');
}

/**
 * Get recent blog posts for homepage
 * Note: new Date() is INSIDE cached function
 */
export async function getCachedBlogPosts(limit = 6): Promise<BlogPostForDisplay[]> {
    'use cache';
    cacheLife({
        stale: 300,
        revalidate: 300,
        expire: 600,
    });
    cacheTag('homepage', 'blog');

    if (process.env.NODE_ENV === 'development') {
        console.log('[CACHE] blog-posts - fetching fresh data');
    }

    const now = new Date(); // Time logic inside cache

    return prisma.blogPost.findMany({
        where: {
            status: 'PUBLISHED',
            publishedAt: { lte: now },
        },
        select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            coverImage: true,
            summary: true,
            publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });
}
