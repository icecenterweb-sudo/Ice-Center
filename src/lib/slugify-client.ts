/**
 * Canonical SEO-friendly slug generation (Client and Server safe).
 * Supports English, Persian characters, Persian/Arabic digits, and ZWNJ normalization.
 */

const PERSIAN_ARABIC_DIGITS: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Canonical regex matching valid slugs (Persian letters, lowercase ASCII alphanumeric, and hyphens).
 */
export const CANONICAL_SLUG_REGEX = /^[a-z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF-]+$/;

/**
 * Validates if a string is a valid slug according to the canonical policy.
 */
export function isValidSlug(slug: string): boolean {
    if (!slug || typeof slug !== 'string') return false;
    const trimmed = slug.trim();
    if (trimmed.length === 0 || trimmed.startsWith('-') || trimmed.endsWith('-')) return false;
    return CANONICAL_SLUG_REGEX.test(trimmed);
}

/**
 * Generate a clean, canonical, SEO-friendly slug.
 */
export function slugify(text: string): string {
    if (!text) return '';

    return text
        .toString()
        .toLowerCase()
        .trim()
        // Convert Persian and Arabic digits to ASCII digits
        .replace(/[۰-۹٠-٩]/g, (d) => PERSIAN_ARABIC_DIGITS[d] || d)
        // Normalize ZWNJ (\u200c), whitespace, punctuation, and separators to a single hyphen
        .replace(/[\u200c\u200C\s_+\/\\#.,;:!?~`'"|(){}\[\]<>=%*&^$@!]+/g, '-')
        // Strip any remaining characters that are not letters, digits, or hyphens
        .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF-]/g, '')
        // Collapse multiple consecutive hyphens into one
        .replace(/-+/g, '-')
        // Remove leading and trailing hyphens
        .replace(/^-+|-+$/g, '');
}
