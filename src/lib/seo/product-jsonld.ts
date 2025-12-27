// ============================================
// PRODUCT JSON-LD GENERATORS
// ============================================

interface ProductJsonLdParams {
    name: string;
    slug: string;
    description: string;
    price: number;
    listPrice?: number | null;
    images: string[];
    sku?: string | null;
    brand: string;
    warranty: string;
    rating: number;
    reviewCount: number;
    inventoryStatus: string;
    categoryName: string;
    subcategoryName: string;
}

interface BreadcrumbItem {
    name: string;
    url: string;
}

/**
 * Get Schema.org availability URL from inventory status
 */
function getAvailabilitySchema(status: string): string {
    switch (status) {
        case 'IN_STOCK':
            return 'https://schema.org/InStock';
        case 'LOW_STOCK':
            return 'https://schema.org/LimitedAvailability';
        case 'OUT_OF_STOCK':
            return 'https://schema.org/OutOfStock';
        default:
            return 'https://schema.org/InStock';
    }
}

/**
 * Generate Breadcrumb JSON-LD for product page
 */
export function generateProductBreadcrumbJsonLd(items: BreadcrumbItem[]) {
    return {
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.name,
            'item': item.url
        }))
    };
}

/**
 * Generate full Product JSON-LD Schema
 */
export function generateProductSchemaJsonLd(product: ProductJsonLdParams) {
    const baseUrl = 'https://ice-center.ir';

    const schema: Record<string, any> = {
        '@type': 'Product',
        'name': product.name,
        'description': product.description || `${product.name} - خرید از آیس سنتر`,
        'url': `${baseUrl}/products/${product.slug}`,
        'image': product.images.length > 0 ? product.images : undefined,
        'sku': product.sku || undefined,
        'brand': {
            '@type': 'Brand',
            'name': product.brand
        },
        'offers': {
            '@type': 'Offer',
            'price': product.price,
            'priceCurrency': 'IRR',
            'availability': getAvailabilitySchema(product.inventoryStatus),
            'seller': {
                '@type': 'Organization',
                'name': 'آیس سنتر'
            },
            'warranty': product.warranty
        }
    };

    // Add aggregate rating if available
    if (product.rating > 0 && product.reviewCount > 0) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            'ratingValue': product.rating,
            'reviewCount': product.reviewCount,
            'bestRating': 5,
            'worstRating': 1
        };
    }

    return schema;
}

/**
 * Generate complete JSON-LD graph for product page
 */
export function generateProductPageJsonLd(params: {
    product: ProductJsonLdParams;
    categorySlug?: string;
}) {
    const { product, categorySlug } = params;
    const baseUrl = 'https://ice-center.ir';

    // Build breadcrumb items
    const breadcrumbs: BreadcrumbItem[] = [
        { name: 'آیس سنتر', url: baseUrl },
        { name: 'محصولات', url: `${baseUrl}/categories` },
    ];

    if (product.categoryName && categorySlug) {
        breadcrumbs.push({
            name: product.categoryName,
            url: `${baseUrl}/categories/${categorySlug}`
        });
    }

    breadcrumbs.push({
        name: product.name,
        url: `${baseUrl}/products/${product.slug}`
    });

    return {
        '@context': 'https://schema.org',
        '@graph': [
            generateProductBreadcrumbJsonLd(breadcrumbs),
            generateProductSchemaJsonLd(product)
        ]
    };
}
