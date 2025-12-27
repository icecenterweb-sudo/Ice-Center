import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';
import { getCategoryBySlug, getSubcategoriesByCategoryId, getProducts, getAvailableBrands } from '@/lib/prisma/queries-category';
import { generateCategoryJsonLd } from '@/lib/seo/jsonld';

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

// Force Node.js runtime (not Edge) for Prisma adapter compatibility
export const runtime = 'nodejs';

// Revalidate every 60 seconds
export const revalidate = 60;




export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);

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

    const category = await getCategoryBySlug(slug);
    if (!category) notFound();

    const subcategories = await getSubcategoriesByCategoryId(category.id);

    // Parse filter parameters
    const page = parseInt(sp.page || '1');
    const sort = sp.sort || 'newest';
    const subcategoryId = sp.subcategory ? parseInt(sp.subcategory) : undefined;
    const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
    const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;
    const brands = sp.brands ? sp.brands.split(',').filter(Boolean) : undefined;
    const availability = sp.availability ? sp.availability.split(',').filter(Boolean) : undefined;
    const onlyDiscount = sp.discount === 'true';

    // Get available brands in this category
    const availableBrands = await getAvailableBrands(category.id, subcategoryId);

    const { products, totalCount, totalPages, currentPage } = await getProducts({
        categoryId: category.id,
        subcategoryId,
        sort,
        page,
        minPrice,
        maxPrice,
        brands,
        availability,
        onlyDiscount,
    });

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
                        'item': 'https://ice-center.ir'
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': 'همه محصولات',
                        'item': 'https://ice-center.ir/categories'
                    },
                    {
                        '@type': 'ListItem',
                        'position': 3,
                        'name': category.name,
                        'item': `https://ice-center.ir/categories/${category.slug}`
                    }
                ]
            },
            {
                '@type': 'CollectionPage',
                'name': `${category.name} | آیس سنتر`,
                'description': category.description || `خرید ${category.name}`,
                'url': `https://ice-center.ir/categories/${category.slug}`,
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
                            'url': `https://ice-center.ir/products/${product.slug}`,
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
