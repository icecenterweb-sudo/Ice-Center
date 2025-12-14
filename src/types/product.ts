import { Product, ProductVariant } from '@prisma/client';

/**
 * Product with its variants included
 */
export interface ProductWithVariants extends Product {
    variants: ProductVariant[];
}

/**
 * Installment terms structure
 */
export interface InstallmentTerms {
    months: number;
    downPaymentPercent?: number;
    description: string;
    conditions?: string[];
}

/**
 * Product pricing information
 * Handles both products with and without variants
 */
export interface ProductPricing {
    price: number;
    listPrice?: number;
    hasVariants: boolean;
    priceRange?: {
        min: number;
        max: number;
    };
}

/**
 * Helper to get pricing info from a product
 */
export function getProductPricing(product: ProductWithVariants): ProductPricing {
    const hasVariants = product.variants && product.variants.length > 0;

    if (!hasVariants) {
        return {
            price: product.price,
            listPrice: product.listPrice || undefined,
            hasVariants: false,
        };
    }

    const activeVariants = product.variants.filter((v) => v.isActive);
    const prices = activeVariants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
        price: minPrice,
        listPrice: product.listPrice || undefined,
        hasVariants: true,
        priceRange:
            minPrice !== maxPrice
                ? {
                    min: minPrice,
                    max: maxPrice,
                }
                : undefined,
    };
}

/**
 * Get the default variant for a product
 */
export function getDefaultVariant(product: ProductWithVariants): ProductVariant | null {
    if (!product.variants || product.variants.length === 0) {
        return null;
    }

    // Find the variant marked as default
    const defaultVariant = product.variants.find((v) => v.isDefault && v.isActive);
    if (defaultVariant) {
        return defaultVariant;
    }

    // Fallback to first active variant
    return product.variants.find((v) => v.isActive) || null;
}

/**
 * Parse installment terms from JSON
 */
export function parseInstallmentTerms(product: Product): InstallmentTerms | null {
    if (!product.installmentEnabled || !product.installmentTerms) {
        return null;
    }

    try {
        return product.installmentTerms as unknown as InstallmentTerms;
    } catch {
        return null;
    }
}
