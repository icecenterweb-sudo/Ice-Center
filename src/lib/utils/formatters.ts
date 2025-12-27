// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format price with Persian number formatting
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('fa-IR').format(price);
}

/**
 * Calculate discount percentage
 */
export function getDiscount(price: number, listPrice: number | null): number | null {
    if (!listPrice || listPrice <= price) return null;
    return Math.round(((listPrice - price) / listPrice) * 100);
}

/**
 * Format product count with Persian numbers
 */
export function formatCount(count: number): string {
    return new Intl.NumberFormat('fa-IR').format(count);
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Price range presets for filters
 */
export const PRICE_RANGES = [
    { label: 'زیر ۱ میلیون', min: 0, max: 1000000 },
    { label: '۱ تا ۵ میلیون', min: 1000000, max: 5000000 },
    { label: '۵ تا ۱۰ میلیون', min: 5000000, max: 10000000 },
    { label: '۱۰ تا ۲۰ میلیون', min: 10000000, max: 20000000 },
    { label: 'بالای ۲۰ میلیون', min: 20000000, max: Infinity },
];

/**
 * Availability options for filters
 */
export const AVAILABILITY_OPTIONS = [
    { value: 'IN_STOCK', label: 'موجود در انبار', color: 'text-green-600' },
    { value: 'LOW_STOCK', label: 'موجودی کم', color: 'text-yellow-600' },
    { value: 'OUT_OF_STOCK', label: 'ناموجود', color: 'text-red-600' },
];

/**
 * Sort options for product listing
 */
export const SORT_OPTIONS = [
    { value: 'newest', label: 'جدیدترین' },
    { value: 'price-asc', label: 'ارزان‌ترین' },
    { value: 'price-desc', label: 'گران‌ترین' },
];
