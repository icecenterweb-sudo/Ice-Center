/**
 * Persian/Farsi Utility Functions
 * Handles number conversion and formatting for Persian language support
 */

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts English digits to Persian digits
 * @param input - String or number to convert
 * @returns String with Persian digits
 */
export function toPersianNumber(input: string | number): string {
    const str = input.toString();
    return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Converts Persian/Arabic digits to English digits
 * @param input - String with Persian/Arabic digits
 * @returns String with English digits
 */
export function toEnglishNumber(input: string): string {
    let result = input;

    // Convert Persian digits
    persianDigits.forEach((digit, index) => {
        result = result.replace(new RegExp(digit, 'g'), index.toString());
    });

    // Convert Arabic digits
    arabicDigits.forEach((digit, index) => {
        result = result.replace(new RegExp(digit, 'g'), index.toString());
    });

    return result;
}

/**
 * Formats a number as Persian currency (Toman)
 * @param amount - Number to format
 * @param currency - Currency unit (default: 'تومان')
 * @returns Formatted currency string
 */
export function formatPersianCurrency(
    amount: number | string,
    currency: string = 'تومان'
): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return '۰ ' + currency;

    // Format with thousand separators
    const formatted = numAmount.toLocaleString('en-US');
    const persianFormatted = toPersianNumber(formatted);

    return `${persianFormatted} ${currency}`;
}

/**
 * Formats a number with thousand separators in Persian
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatPersianNumber(num: number | string): string {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(numValue)) return '۰';

    const formatted = numValue.toLocaleString('en-US');
    return toPersianNumber(formatted);
}

/**
 * Shortens large numbers with K, M, B suffixes in Persian
 * @param num - Number to shorten
 * @returns Shortened number string
 */
export function shortPersianNumber(num: number): string {
    if (num >= 1000000000) {
        return toPersianNumber((num / 1000000000).toFixed(1)) + ' میلیارد';
    }
    if (num >= 1000000) {
        return toPersianNumber((num / 1000000).toFixed(1)) + ' میلیون';
    }
    if (num >= 1000) {
        return toPersianNumber((num / 1000).toFixed(1)) + ' هزار';
    }
    return toPersianNumber(num);
}
