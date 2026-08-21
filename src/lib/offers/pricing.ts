/**
 * Offer Pricing Utilities
 * 
 * Core logic for calculating effective prices from offers.
 * This is the single source of truth for all price calculations.
 */

import { DiscountType } from '@prisma/client';

// Types for offer pricing
export interface OfferDiscount {
    discountType: DiscountType;
    discountValue: number;
    maxDiscountCap?: number | null;
}

export interface ProductPricing {
    basePrice: number;       // Original price (Product.price or Product.listPrice)
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
    const originalPrice = product.basePrice;

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
        const percent = Math.min(Math.max(offer.discountValue, 0), 100);
        discountAmount = originalPrice * (percent / 100);

        // Apply cap if exists
        if (offer.maxDiscountCap && discountAmount > offer.maxDiscountCap) {
            discountAmount = offer.maxDiscountCap;
        }
    } else {
        // Fixed amount discount
        discountAmount = offer.discountValue;
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
    price: number;
    listPrice: number | null;
    offerProducts?: Array<{
        customDiscountValue?: number | null;
        offer: {
            id?: number;
            name?: string;
            discountType: DiscountType;
            discountValue: number;
            maxDiscountCap?: number | null;
            endDate?: Date;
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

export function getProductPricing(product: DbProductForPricing): CalculatedPricing {
    const basePrice = product.listPrice || product.price;
    const activeOfferProduct = product.offerProducts?.[0];
    const activeOffer = activeOfferProduct?.offer;

    if (activeOffer) {
        const offerDiscount: OfferDiscount = {
            discountType: activeOffer.discountType,
            discountValue: Number(activeOfferProduct.customDiscountValue ?? activeOffer.discountValue),
            maxDiscountCap: activeOffer.maxDiscountCap ? Number(activeOffer.maxDiscountCap) : null,
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
                endDate: activeOffer.endDate || null,
                badgeText: activeOffer.badgeText || null,
            }
        };
    }

    if (product.listPrice && product.listPrice > product.price) {
        return {
            effectivePrice: product.price,
            originalPrice: product.listPrice,
            discountPercent: Math.round(((product.listPrice - product.price) / product.listPrice) * 100),
            hasOffer: true,
            activeOffer: null
        };
    }

    return {
        effectivePrice: product.price,
        originalPrice: product.price,
        discountPercent: 0,
        hasOffer: false,
        activeOffer: null
    };
}
