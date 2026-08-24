/**
 * Offer Pricing Utilities
 * 
 * Core logic for calculating effective prices from offers.
 * This is the single source of truth for all price calculations.
 */

import { DiscountType, Prisma } from '@prisma/client';

export type DecimalLike = number | Prisma.Decimal | string;

// Types for offer pricing
export interface OfferDiscount {
    discountType: DiscountType;
    discountValue: DecimalLike;
    maxDiscountCap?: DecimalLike | null;
}

export interface ProductPricing {
    basePrice: DecimalLike;       // Original selling price (Product.price)
    activeOffer?: OfferDiscount | null;
}

export interface EffectivePricing {
    effectivePrice: number;      // Final price after discount
    originalPrice: number;       // Original price for display
    discountAmount: number;      // How much was saved
    discountPercent: number;     // Percentage saved (for badges)
    hasOffer: boolean;           // Whether an active offer is applied
}

/**
 * Calculate effective price from base price and active offer
 * 
 * This function is the SINGLE SOURCE OF TRUTH for price calculations.
 * Use it everywhere: carousel, product page, cart, checkout.
 */
export function calculateEffectivePrice(product: ProductPricing): EffectivePricing {
    const originalPrice = Number(product.basePrice);

    // No active offer? Return base price
    if (!product.activeOffer) {
        return {
            effectivePrice: originalPrice,
            originalPrice,
            discountAmount: 0,
            discountPercent: 0,
            hasOffer: false,
        };
    }

    const offer = product.activeOffer;
    let discountAmount: number;

    if (offer.discountType === 'PERCENTAGE') {
        // Clamp the percentage to [0, 100] defensively. Write-path validation should
        // already guarantee this, but clamping here keeps effectivePrice >= 0 for any
        // bad/legacy data reaching the price engine from any source.
        const discountVal = Number(offer.discountValue);
        const percent = Math.min(Math.max(discountVal, 0), 100);
        discountAmount = originalPrice * (percent / 100);

        // Apply cap if exists (nullish check: a cap of 0 is legitimate and must clamp)
        if (offer.maxDiscountCap != null) {
            const cap = Number(offer.maxDiscountCap);
            if (discountAmount > cap) {
                discountAmount = cap;
            }
        }
    } else {
        // Fixed amount discount
        discountAmount = Number(offer.discountValue);
    }

    // Ensure we don't go below zero
    const effectivePrice = Math.max(0, originalPrice - discountAmount);

    // Calculate percentage for badges
    const discountPercent = originalPrice > 0
        ? Math.round((discountAmount / originalPrice) * 100)
        : 0;

    return {
        effectivePrice: Math.round(effectivePrice), // Round to avoid floating point issues
        originalPrice,
        discountAmount: Math.round(discountAmount),
        discountPercent,
        hasOffer: true,
    };
}

/**
 * Check if an offer is currently active (time-based)
 * 
 * Use this in queries OR to validate before applying discount.
 * Always use this for checkout to ensure offer hasn't expired.
 */
export function isOfferActive(offer: {
    isActive: boolean;
    startDate: Date | string;
    endDate: Date | string;
}, now: Date = new Date()): boolean {
    if (!offer.isActive) return false;

    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    return now >= start && now < end;
}

/**
 * Calculate time remaining until offer ends
 * Returns { hours, minutes, seconds } or null if expired
 */
export function getOfferTimeRemaining(endDate: Date | string): {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
} | null {
    const end = new Date(endDate);
    const now = new Date();

    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return null;

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, totalSeconds };
}

/**
 * Get the earliest ending offer from a list
 * Useful for carousel timer display
 */
export function getEarliestEndDate(offers: Array<{ endDate: Date | string }>): Date | null {
    if (offers.length === 0) return null;

    const timestamps = offers.map(o => new Date(o.endDate).getTime());
    const earliest = Math.min(...timestamps);

    return new Date(earliest);
}

export interface DbProductForPricing {
    price: DecimalLike;
    listPrice?: DecimalLike | null;
    offerProducts?: Array<{
        customDiscountValue?: DecimalLike | null;
        offer: {
            id?: number;
            name?: string;
            discountType: DiscountType;
            discountValue: DecimalLike;
            maxDiscountCap?: DecimalLike | null;
            startDate?: Date | string;
            endDate?: Date | string;
            isActive?: boolean;
            badgeText?: string | null;
        };
    }>;
}

export interface CalculatedPricing {
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

export function getProductPricing(product: DbProductForPricing, now: Date = new Date()): CalculatedPricing {
    // Offers always discount the actual selling price (`price`).
    // `listPrice` is display-only (strikethrough MSRP) and must never be
    // used as the discount base — doing so can RAISE the effective price
    // above the normal selling price when listPrice > price.
    const basePrice = Number(product.price);
    const listPrice = product.listPrice != null ? Number(product.listPrice) : null;
    const activeOfferProduct = product.offerProducts?.[0];
    const activeOffer = activeOfferProduct?.offer;

    // Validate offer freshness at query/eval time (#23)
    const isCurrentlyActive = activeOffer && (
        (activeOffer.isActive === undefined || activeOffer.isActive) &&
        (!activeOffer.startDate || now >= new Date(activeOffer.startDate)) &&
        (!activeOffer.endDate || now < new Date(activeOffer.endDate))
    );

    if (isCurrentlyActive && activeOffer) {
        const offerDiscount: OfferDiscount = {
            discountType: activeOffer.discountType,
            discountValue: activeOfferProduct.customDiscountValue ?? activeOffer.discountValue,
            maxDiscountCap: activeOffer.maxDiscountCap != null ? activeOffer.maxDiscountCap : null,
        };
        const pricing = calculateEffectivePrice({ basePrice, activeOffer: offerDiscount });
        return {
            effectivePrice: pricing.effectivePrice,
            originalPrice: pricing.originalPrice,
            discountPercent: pricing.discountPercent,
            hasOffer: true,
            activeOffer: {
                id: activeOffer.id || null,
                name: activeOffer.name || null,
                endDate: activeOffer.endDate ? new Date(activeOffer.endDate) : null,
                badgeText: activeOffer.badgeText || null,
            }
        };
    }

    if (listPrice !== null && listPrice > basePrice) {
        return {
            effectivePrice: basePrice,
            originalPrice: listPrice,
            discountPercent: Math.round(((listPrice - basePrice) / listPrice) * 100),
            hasOffer: true,
            activeOffer: null
        };
    }

    return {
        effectivePrice: basePrice,
        originalPrice: basePrice,
        discountPercent: 0,
        hasOffer: false,
        activeOffer: null
    };
}

/**
 * Resolve the unit price for an order line from a fetched price-info row.
 *
 * Nullish-safe on purpose: a legitimate `effectivePrice === 0` (100% discount)
 * must stay 0 — only a MISSING priceInfo row falls back to the product price.
 */
export function resolveUnitPrice(
    priceInfo: { effectivePrice: number } | null | undefined,
    fallbackPrice: DecimalLike
): number {
    return priceInfo?.effectivePrice ?? Number(fallbackPrice);
}
