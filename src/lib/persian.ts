/**
 * Persian/Farsi Utility Functions
 * Canonical source for all Persian number conversion and formatting.
 * 
 * Replaces both:
 * - src/lib/numbers.ts (toPersianDigits, toEnglishDigits)
 * - src/utils/persian.ts (toPersianNumber, toEnglishNumber, formatPersianCurrency, etc.)
 */

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts English digits to Persian digits.
 * Works on both strings and numbers.
 */
export function toPersianDigits(input: string | number): string {
    if (input === null || input === undefined) return '';
    return input.toString().replace(/[0-9]/g, (digit) =>
        String.fromCharCode(0x06F0 + parseInt(digit, 10))
    );
}

// Alias for backward compatibility
export const toPersianNumber = toPersianDigits;

/**
 * Converts Persian/Arabic digits to English digits.
 */
export function toEnglishDigits(input: string | number): string {
    if (input === null || input === undefined) return '';
    return input
        .toString()
        .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
        .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

// Alias for backward compatibility
export const toEnglishNumber = toEnglishDigits;

/**
 * Formats a number as Persian currency (Toman).
 */
export function formatPersianCurrency(
    amount: number | string,
    currency: string = 'تومان'
): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return '۰ ' + currency;

    const formatted = numAmount.toLocaleString('en-US');
    const persianFormatted = toPersianDigits(formatted);

    return `${persianFormatted} ${currency}`;
}

/**
 * Formats a number with thousand separators in Persian.
 */
export function formatPersianNumber(num: number | string): string {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(numValue)) return '۰';

    const formatted = numValue.toLocaleString('en-US');
    return toPersianDigits(formatted);
}

/**
 * Shortens large numbers with Persian suffixes.
 */
export function shortPersianNumber(num: number): string {
    if (num >= 1000000000) {
        return toPersianDigits((num / 1000000000).toFixed(1)) + ' میلیارد';
    }
    if (num >= 1000000) {
        return toPersianDigits((num / 1000000).toFixed(1)) + ' میلیون';
    }
    if (num >= 1000) {
        return toPersianDigits((num / 1000).toFixed(1)) + ' هزار';
    }
    return toPersianDigits(num);
}
