import { revalidatePath, revalidateTag } from 'next/cache';
import { invalidateProductsCache } from './products';
import { prisma } from '@/lib/db';

const CACHE_PROFILE = { expire: 600 };

/**
 * Centralized Cache Invalidation Service
 * 
 * Maps mutations to ALL affected Next.js cache tags, Next.js page paths,
 * and Redis versioned caches.
 */

export interface ProductInvalidationContext {
    id: number;
    slug?: string | null;
    oldSlug?: string | null;
    subcategoryId?: number | null;
    oldSubcategoryId?: number | null;
    categoryId?: number | null;
    oldCategoryId?: number | null;
}

export interface CategoryInvalidationContext {
    id: number;
    slug?: string | null;
    oldSlug?: string | null;
}

export interface SubcategoryInvalidationContext {
    id: number;
    categoryId: number;
    oldCategoryId?: number | null;
    categorySlug?: string | null;
    oldCategorySlug?: string | null;
}

export interface OfferInvalidationContext {
    id?: number;
    productIds?: number[];
    categoryIds?: number[];
}

/**
 * Safely call revalidateTag with error handling
 */
export function safeRevalidateTag(tag: string): void {
    try {
        revalidateTag(tag, CACHE_PROFILE);
    } catch {
        // Fallback in contexts where Next.js cache tags are not bound
    }
}

/**
 * Safely call revalidatePath with error handling
 */
export function safeRevalidatePath(path: string): void {
    try {
        revalidatePath(path);
    } catch {
        // Fallback
    }
}

/**
 * Invalidate all caches affected by a Product mutation (create, update, delete, toggle, variant)
 */
export async function invalidateProductCache(ctx: ProductInvalidationContext): Promise<void> {
    // 1. Homepage & global product listing tags
    safeRevalidateTag('homepage');
    safeRevalidateTag('products');
    safeRevalidateTag('product');

    // 2. Specific product slug tags
    if (ctx.slug) {
        safeRevalidateTag(`product:${ctx.slug}`);
        safeRevalidatePath(`/products/${ctx.slug}`);
    }
    if (ctx.oldSlug && ctx.oldSlug !== ctx.slug) {
        safeRevalidateTag(`product:${ctx.oldSlug}`);
        safeRevalidatePath(`/products/${ctx.oldSlug}`);
    }

    // 3. Category & Subcategory tags for current & old categories
    const categoryIds = new Set<number>();
    if (ctx.categoryId) categoryIds.add(ctx.categoryId);
    if (ctx.oldCategoryId) categoryIds.add(ctx.oldCategoryId);

    // If categoryId not provided directly, attempt resolution from subcategory
    const subcategoryIds = [ctx.subcategoryId, ctx.oldSubcategoryId].filter((id): id is number => typeof id === 'number');
    if (subcategoryIds.length > 0 && categoryIds.size === 0) {
        try {
            const subs = await prisma.subcategory.findMany({
                where: { id: { in: subcategoryIds } },
                select: { categoryId: true, category: { select: { slug: true } } },
            });
            for (const sub of subs) {
                categoryIds.add(sub.categoryId);
                if (sub.category?.slug) {
                    safeRevalidateTag(`category:${sub.category.slug}`);
                    safeRevalidatePath(`/categories/${sub.category.slug}`);
                }
            }
        } catch {
            // DB fallback
        }
    }

    for (const catId of categoryIds) {
        safeRevalidateTag(`category:${catId}`);
        safeRevalidateTag(`products:category:${catId}`);
        safeRevalidateTag(`subcategories:${catId}`);
        safeRevalidateTag(`brands:${catId}`); // B2 fix: ensure brand cache is invalidated
    }

    // 4. Invalidate admin and public paths
    safeRevalidatePath('/admin/dashboard/products');
    safeRevalidatePath('/admin/dashboard/categories');
    safeRevalidatePath('/products');
    safeRevalidatePath('/categories');
    safeRevalidatePath('/');

    // 5. Invalidate Redis product list cache (#6)
    await invalidateProductsCache();
}

/**
 * Invalidate all caches affected by a Category mutation (create, update, delete)
 */
export async function invalidateCategoryCache(ctx: CategoryInvalidationContext): Promise<void> {
    safeRevalidateTag('homepage');
    safeRevalidateTag('categories');

    if (ctx.id) {
        safeRevalidateTag(`category:${ctx.id}`);
        safeRevalidateTag(`products:category:${ctx.id}`);
        safeRevalidateTag(`subcategories:${ctx.id}`);
        safeRevalidateTag(`brands:${ctx.id}`);
    }

    if (ctx.slug) {
        safeRevalidateTag(`category:${ctx.slug}`);
        safeRevalidatePath(`/categories/${ctx.slug}`);
    }

    if (ctx.oldSlug && ctx.oldSlug !== ctx.slug) {
        safeRevalidateTag(`category:${ctx.oldSlug}`);
        safeRevalidatePath(`/categories/${ctx.oldSlug}`);
    }

    safeRevalidatePath('/admin/dashboard/categories');
    safeRevalidatePath('/categories');
    safeRevalidatePath('/');
}

/**
 * Invalidate all caches affected by a Subcategory mutation (create, update, move, delete)
 */
export async function invalidateSubcategoryCache(ctx: SubcategoryInvalidationContext): Promise<void> {
    safeRevalidateTag('homepage');
    safeRevalidateTag('categories');

    const catIds = new Set<number>([ctx.categoryId]);
    if (ctx.oldCategoryId) catIds.add(ctx.oldCategoryId);

    for (const catId of catIds) {
        safeRevalidateTag(`category:${catId}`);
        safeRevalidateTag(`subcategories:${catId}`);
        safeRevalidateTag(`products:category:${catId}`);
        safeRevalidateTag(`brands:${catId}`);
    }

    if (ctx.categorySlug) {
        safeRevalidateTag(`category:${ctx.categorySlug}`);
        safeRevalidatePath(`/categories/${ctx.categorySlug}`);
    }
    if (ctx.oldCategorySlug && ctx.oldCategorySlug !== ctx.categorySlug) {
        safeRevalidateTag(`category:${ctx.oldCategorySlug}`);
        safeRevalidatePath(`/categories/${ctx.oldCategorySlug}`);
    }

    safeRevalidatePath('/admin/dashboard/categories');
    safeRevalidatePath('/categories');
    safeRevalidatePath('/');
}

/**
 * Invalidate all caches affected by an Offer mutation (create, update, delete)
 */
export async function invalidateOfferCache(ctx: OfferInvalidationContext = {}): Promise<void> {
    safeRevalidateTag('homepage');
    safeRevalidateTag('offers');
    safeRevalidateTag('products');

    if (ctx.categoryIds) {
        for (const catId of ctx.categoryIds) {
            safeRevalidateTag(`category:${catId}`);
            safeRevalidateTag(`products:category:${catId}`);
            safeRevalidateTag(`brands:${catId}`);
        }
    }

    if (ctx.productIds && ctx.productIds.length > 0) {
        try {
            const products = await prisma.product.findMany({
                where: { id: { in: ctx.productIds } },
                select: {
                    id: true,
                    slug: true,
                    subcategory: { select: { categoryId: true, category: { select: { slug: true } } } },
                },
            });
            for (const p of products) {
                safeRevalidateTag(`product:${p.slug}`);
                safeRevalidatePath(`/products/${p.slug}`);
                if (p.subcategory?.categoryId) {
                    safeRevalidateTag(`category:${p.subcategory.categoryId}`);
                    safeRevalidateTag(`products:category:${p.subcategory.categoryId}`);
                    safeRevalidateTag(`brands:${p.subcategory.categoryId}`);
                }
                if (p.subcategory?.category?.slug) {
                    safeRevalidateTag(`category:${p.subcategory.category.slug}`);
                }
            }
        } catch {
            // DB fallback
        }
    }

    safeRevalidatePath('/admin/dashboard/offers');
    safeRevalidatePath('/offers');
    safeRevalidatePath('/');

    await invalidateProductsCache();
}
