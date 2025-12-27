import { prisma } from '@/lib/db';

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
    availability?: string[];
    onlyDiscount?: boolean;
}

export interface ProductResult {
    products: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

// ============================================
// CATEGORY QUERIES
// ============================================

/**
 * Get all categories with product counts
 */
export async function getAllCategories() {
    const categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true, image: true, description: true },
        orderBy: { name: 'asc' }
    });

    const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => ({
            ...cat,
            productCount: await prisma.product.count({
                where: {
                    subcategory: { categoryId: cat.id },
                    isActive: true
                }
            })
        }))
    );

    return categoriesWithCounts;
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
 */
export async function getSubcategoriesByCategoryId(categoryId: number) {
    const subcategories = await prisma.subcategory.findMany({
        where: { categoryId },
        select: { id: true, name: true, slug: true }
    });

    const withCounts = await Promise.all(
        subcategories.map(async (sub) => ({
            ...sub,
            productCount: await prisma.product.count({
                where: { subcategoryId: sub.id, isActive: true }
            })
        }))
    );

    return withCounts;
}

// ============================================
// PRODUCT QUERIES
// ============================================

/**
 * Get products with filtering, sorting, and pagination
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

    // Build where clause
    const where: any = { isActive: true };

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

    // Discount filter
    if (onlyDiscount) {
        where.listPrice = { not: null };
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    if (sort === 'price-desc') orderBy = { price: 'desc' };

    // Fetch products
    let allProducts = await prisma.product.findMany({
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
        }
    });

    // Apply discount filter (listPrice > price)
    if (onlyDiscount) {
        allProducts = allProducts.filter(p => p.listPrice && p.listPrice > p.price);
    }

    const totalCount = allProducts.length;
    const products = allProducts.slice(skip, skip + limit);

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
    const where: any = { isActive: true, brand: { not: null } };

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
