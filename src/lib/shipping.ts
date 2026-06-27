/**
 * Shipping cost configuration.
 * Flat fee with free shipping over a threshold.
 * Values are in Toman.
 */
export const SHIPPING_COST = 150000; // 150,000 Toman flat fee
export const FREE_SHIPPING_THRESHOLD = 5000000; // Free over 5,000,000 Toman

/**
 * Calculate shipping cost based on cart subtotal.
 * Returns 0 if subtotal meets the free-shipping threshold.
 */
export function calculateShippingCost(subtotal: number): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return SHIPPING_COST;
}
