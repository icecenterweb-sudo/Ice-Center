import { suite, it } from './runner';
import assert from 'node:assert/strict';
import {
    getProductPricing,
    calculateEffectivePrice,
} from '../src/lib/offers/pricing';

const PCT = (v: number, cap: number | null = null) => ({
    customDiscountValue: null as number | null,
    offer: { discountType: 'PERCENTAGE' as never, discountValue: v, maxDiscountCap: cap },
});
const FIXED = (v: number) => ({
    customDiscountValue: null as number | null,
    offer: { discountType: 'FIXED_AMOUNT' as never, discountValue: v, maxDiscountCap: null },
});

suite('Batch1 #1 — offer pricing uses product.price as base', () => {
    it('percentage offer discounts the SELLING price even when listPrice > price', () => {
        const r = getProductPricing({ price: 900000, listPrice: 1200000, offerProducts: [PCT(10)] });
        assert.equal(r.effectivePrice, 810000);
        assert.equal(r.originalPrice, 900000);
        assert.equal(r.discountPercent, 10);
        assert.equal(r.hasOffer, true);
    });

    it('a weak offer can never RAISE the price above the normal selling price', () => {
        const r = getProductPricing({ price: 900000, listPrice: 1200000, offerProducts: [PCT(5)] });
        assert.ok(r.effectivePrice <= 900000, `expected <= 900000, got ${r.effectivePrice}`);
    });

    it('listPrice < price: offer still bases on selling price', () => {
        const r = getProductPricing({ price: 900000, listPrice: 800000, offerProducts: [PCT(10)] });
        assert.equal(r.effectivePrice, 810000);
        assert.equal(r.originalPrice, 900000);
    });

    it('inactive/expired offer (empty prefiltered join): falls back to price, listPrice shown as strikethrough', () => {
        const r = getProductPricing({ price: 900000, listPrice: 1200000, offerProducts: [] });
        assert.equal(r.effectivePrice, 900000);
        assert.equal(r.originalPrice, 1200000);
        assert.equal(r.discountPercent, 25);
        assert.equal(r.hasOffer, true);
        assert.equal(r.activeOffer, null);
    });

    it('missing offer join entirely behaves like no offer', () => {
        const r = getProductPricing({ price: 900000, listPrice: null });
        assert.equal(r.effectivePrice, 900000);
        assert.equal(r.hasOffer, false);
        assert.equal(r.discountPercent, 0);
    });

    it('maxDiscountCap = 0 clamps discount to ZERO (nullish handling)', () => {
        const r = calculateEffectivePrice({
            basePrice: 100000,
            activeOffer: { discountType: 'PERCENTAGE', discountValue: 50, maxDiscountCap: 0 },
        });
        assert.equal(r.effectivePrice, 100000);
        assert.equal(r.discountAmount, 0);
        assert.equal(r.discountPercent, 0);
    });

    it('maxDiscountCap normal clamp still works', () => {
        const r = calculateEffectivePrice({
            basePrice: 100000,
            activeOffer: { discountType: 'PERCENTAGE', discountValue: 50, maxDiscountCap: 30000 },
        });
        assert.equal(r.effectivePrice, 70000);
        assert.equal(r.discountPercent, 30);
    });

    it('100% percentage discount yields effectivePrice 0', () => {
        const r = getProductPricing({ price: 900000, listPrice: null, offerProducts: [PCT(100)] });
        assert.equal(r.effectivePrice, 0);
        assert.equal(r.discountPercent, 100);
    });

    it('fixed-amount discount applies to selling price and floors at zero', () => {
        const okCase = getProductPricing({ price: 50000, listPrice: null, offerProducts: [FIXED(20000)] });
        assert.equal(okCase.effectivePrice, 30000);

        const floorCase = calculateEffectivePrice({
            basePrice: 50000,
            activeOffer: { discountType: 'FIXED_AMOUNT', discountValue: 999999, maxDiscountCap: null },
        });
        assert.equal(floorCase.effectivePrice, 0);
    });

    it('rounding stays integer-safe for odd prices', () => {
        const r = getProductPricing({ price: 999, listPrice: null, offerProducts: [PCT(33)] });
        assert.equal(Number.isInteger(r.effectivePrice), true);
        assert.equal(r.effectivePrice, Math.round(999 * 0.67));
    });
});
