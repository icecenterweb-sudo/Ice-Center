import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';
import { serializeJsonLd } from '@/lib/json-ld';
import {
    getCachedCategoryBySlug,
    getCachedSubcategories,
    getCachedBrands,
    getCachedBaseProducts,
    applyFiltersToProducts,
    getFreshFilteredProducts,
} from '@/lib/cache/category';
import type { CachedProduct } from '@/lib/cache/category';
import { InventoryStatus } from '@prisma/client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ice-center.ir';

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{
        page?: string;
        sort?: string;
        subcategory?: string;
        minPrice?: string;
        maxPrice?: string;
        brands?: string;
        availability?: string;
        discount?: string;
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = await getCachedCategoryBySlug(slug);

    if (!category) {
        return { title: 'دسته‌بندی یافت نشد' };
    }

    return {
        title: `${category.name} | آیس سنتر`,
        description: category.description || `خرید ${category.name} - آیس سنتر`,
        openGraph: {
            title: `${category.name} | آیس سنتر`,
            description: category.description || `خرید ${category.name}`,
            type: 'website',
        },
        alternates: { canonical: `/categories/${slug}` }
    };
}

export default async function CategoryPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const sp = await searchParams;

    // STATIC LAYER: Cached category info (30 min TTL)
    const category = await getCachedCategoryBySlug(slug);
    if (!category) notFound();

    // STATIC LAYER: Cached subcategories (30 min TTL)
    const subcategories = await getCachedSubcategories(category.id);

    // Parse filter parameters
    const page = parseInt(sp.page || '1');
    const sort = sp.sort || 'newest';
    const subcategoryId = sp.subcategory ? parseInt(sp.subcategory) : undefined;
    const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
    const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;
    const brands = sp.brands ? sp.brands.split(',').filter(Boolean) : undefined;
    const availability = sp.availability ? sp.availability.split(',').filter(Boolean) as InventoryStatus[] : undefined;
    const onlyDiscount = sp.discount === 'true';

    // STATIC LAYER: Cached brands (10 min TTL)
    const availableBrands = await getCachedBrands(category.id, subcategoryId);

    // Determine if we should use cached filtering or fresh query
    // Use fresh query for subcategory filter (different data set)
    // Use cached + client-side filtering for other filters
    const hasSubcategoryFilter = subcategoryId !== undefined;

    let products: CachedProduct[];
    let totalCount: number;
    let totalPages: number;
    let currentPage: number;

    if (hasSubcategoryFilter) {
        // DYNAMIC: Fresh query needed for subcategory (different product set)
        const result = await getFreshFilteredProducts(category.id, {
            subcategoryId,
            minPrice,
            maxPrice,
            brands,
            availability,
            onlyDiscount,
            sort,
            page,
            limit: 12,
        });
        products = result.products;
        totalCount = result.totalCount;
        totalPages = result.totalPages;
        currentPage = result.currentPage;
    } else {
        // SEMI-DYNAMIC: Use cached base products + client-side filtering
        const baseProducts = await getCachedBaseProducts(category.id);
        const result = applyFiltersToProducts(baseProducts, {
            minPrice,
            maxPrice,
            brands,
            availability,
            onlyDiscount,
            sort,
            page,
            limit: 12,
        });
        products = result.products;
        totalCount = result.totalCount;
        totalPages = result.totalPages;
        currentPage = result.currentPage;
    }

    // Transform subcategories for client component
    const subcategoriesForClient = subcategories.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        _count: { products: s.productCount }
    }));

    // Transform products for client component
    const productsForClient = products.map(p => ({
        ...p,
        subcategory: null
    }));

    // JSON-LD Structured Data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'آیس سنتر',
                        'item': `${SITE_URL}`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': 'همه محصولات',
                        'item': `${SITE_URL}/categories`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 3,
                        'name': category.name,
                        'item': `${SITE_URL}/categories/${category.slug}`
                    }
                ]
            },
            {
                '@type': 'CollectionPage',
                'name': `${category.name} | آیس سنتر`,
                'description': category.description || `خرید ${category.name}`,
                'url': `${SITE_URL}/categories/${category.slug}`,
                'numberOfItems': totalCount,
                'mainEntity': {
                    '@type': 'ItemList',
                    'numberOfItems': totalCount,
                    'itemListElement': products.slice(0, 10).map((product, index) => ({
                        '@type': 'ListItem',
                        'position': index + 1,
                        'item': {
                            '@type': 'Product',
                            'name': product.name,
                            'url': `${SITE_URL}/products/${product.slug}`,
                            'image': product.thumbnail || undefined,
                            'offers': {
                                '@type': 'Offer',
                                'price': product.price,
                                'priceCurrency': 'IRR',
                                'availability': product.inventoryStatus === 'IN_STOCK'
                                    ? 'https://schema.org/InStock'
                                    : product.inventoryStatus === 'LOW_STOCK'
                                        ? 'https://schema.org/LimitedAvailability'
                                        : 'https://schema.org/OutOfStock'
                            }
                        }
                    }))
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            <CategoryClient
                category={{
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    image: category.image,
                }}
                subcategories={subcategoriesForClient}
                initialProducts={productsForClient}
                initialTotalCount={totalCount}
                initialTotalPages={totalPages}
                initialCurrentPage={currentPage}
                initialSort={sort}
                initialSubcategoryId={subcategoryId}
                availableBrands={availableBrands}
            />
        </>
    );
}

