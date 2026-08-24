import { tomanToIrr } from './currency';
import { getAvailabilitySchema } from './availability';

// ============================================
// JSON-LD STRUCTURED DATA GENERATORS
// ============================================

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface Product {
    name: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
    inventoryStatus: string;
}

interface CollectionPageParams {
    name: string;
    description: string;
    url: string;
    totalCount: number;
    products: Product[];
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]) {
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
 * Generate CollectionPage JSON-LD schema with products
 */
export function generateCollectionPageJsonLd({
    name,
    description,
    url,
    totalCount,
    products
}: CollectionPageParams) {
    return {
        '@type': 'CollectionPage',
        'name': name,
        'description': description,
        'url': url,
        'numberOfItems': totalCount,
        'mainEntity': {
            '@type': 'ItemList',
            'numberOfItems': totalCount,
            'itemListElement': products.slice(0, 10).map((product, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'item': generateProductJsonLd(product)
            }))
        }
    };
}

/**
 * Generate Product JSON-LD schema
 */
export function generateProductJsonLd(product: Product) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ice-center.ir';
    return {
        '@type': 'Product',
        'name': product.name,
        'url': `${baseUrl}/products/${product.slug}`,
        'image': product.thumbnail || undefined,
        'offers': {
            '@type': 'Offer',
            'price': tomanToIrr(product.price),
            'priceCurrency': 'IRR',
            'availability': getAvailabilitySchema(product.inventoryStatus)
        }
    };
}

/**
 * Generate complete JSON-LD graph for category pages
 */
export function generateCategoryJsonLd(params: {
    breadcrumbs: BreadcrumbItem[];
    collection: CollectionPageParams;
}) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            generateBreadcrumbJsonLd(params.breadcrumbs),
            generateCollectionPageJsonLd(params.collection)
        ]
    };
}
