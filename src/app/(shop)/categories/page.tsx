import { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';
import { getAllCategories, getProducts, getAvailableBrands } from '@/lib/prisma/queries-category';
import { generateCategoryJsonLd } from '@/lib/seo/jsonld';

type Props = {
    searchParams: Promise<{
        page?: string;
        sort?: string;
        category?: string;
        minPrice?: string;
        maxPrice?: string;
        brands?: string;
        availability?: string;
        discount?: string;
    }>;
};

export const runtime = 'nodejs';
export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
    title: 'همه محصولات | آیس سنتر',
    description: 'مشاهده همه محصولات - دستگاه بستنی قیفی، یخچال، فریزر، آبمیوه‌گیری و تجهیزات صنعتی',
    openGraph: {
        title: 'همه محصولات | آیس سنتر',
        description: 'مشاهده همه محصولات',
        type: 'website',
    },
    alternates: { canonical: '/categories' }
};


export default async function CategoriesPage({ searchParams }: Props) {
    const sp = await searchParams;

    const page = parseInt(sp.page || '1');
    const sort = sp.sort || 'newest';
    const categoryId = sp.category ? parseInt(sp.category) : undefined;
    const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
    const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;
    const brands = sp.brands ? sp.brands.split(',').filter(Boolean) : undefined;
    const availability = sp.availability ? sp.availability.split(',').filter(Boolean) : undefined;
    const onlyDiscount = sp.discount === 'true';

    const [categories, availableBrands, { products, totalCount, totalPages, currentPage }] = await Promise.all([
        getAllCategories(),
        getAvailableBrands(categoryId),
        getProducts({ page, sort, categoryId, minPrice, maxPrice, brands, availability, onlyDiscount })
    ]);

    // JSON-LD Structured Data
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
                    }
                ]
            },
            {
                '@type': 'CollectionPage',
                'name': 'همه محصولات | آیس سنتر',
                'description': 'مشاهده همه محصولات - دستگاه بستنی قیفی، یخچال، فریزر، آبمیوه‌گیری و تجهیزات صنعتی',
                'url': 'https://ice-center.ir/categories',
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
            <CategoriesClient
                categories={categories}
                products={products}
                totalCount={totalCount}
                totalPages={totalPages}
                currentPage={currentPage}
                currentSort={sort}
                availableBrands={availableBrands}
                selectedCategoryId={categoryId}
            />
        </>
    );
}
