/**
 * Iranian currency conversion for SEO / JSON-LD schemas.
 * Internal prices in Ice-Center are stored in Toman (IRT).
 * Schema.org / JSON-LD standard ISO 4217 code for Iranian currency is IRR (Rial).
 * 1 Toman = 10 Rials.
 */
export function tomanToIrr(toman: number): number {
    if (typeof toman !== 'number' || isNaN(toman)) return 0;
    return Math.round(toman * 10);
}
