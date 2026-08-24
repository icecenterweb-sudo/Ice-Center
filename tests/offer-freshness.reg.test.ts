import { suite, it } from './runner';
import assert from 'node:assert/strict';
import { getProductPricing, isOfferActive } from '../src/lib/offers/pricing';

suite('Batch 2 #23 — Time-based Offer freshness / cron independence', () => {
    it('isOfferActive returns true during active window', () => {
        const now = new Date('2026-06-15T12:00:00Z');
        const active = isOfferActive({
            isActive: true,
            startDate: '2026-06-01T00:00:00Z',
            endDate: '2026-06-30T23:59:59Z',
        }, now);
        assert.equal(active, true);
    });

    it('isOfferActive returns false before startDate', () => {
        const now = new Date('2026-05-15T12:00:00Z');
        const active = isOfferActive({
            isActive: true,
            startDate: '2026-06-01T00:00:00Z',
            endDate: '2026-06-30T23:59:59Z',
        }, now);
        assert.equal(active, false);
    });

    it('isOfferActive returns false after endDate', () => {
        const now = new Date('2026-07-01T00:00:00Z');
        const active = isOfferActive({
            isActive: true,
            startDate: '2026-06-01T00:00:00Z',
            endDate: '2026-06-30T23:59:59Z',
        }, now);
        assert.equal(active, false);
    });

    it('getProductPricing evaluates offer freshness even if DB join returned expired offer', () => {
        const now = new Date('2026-07-05T12:00:00Z');
        const pricing = getProductPricing({
            price: 1000000,
            listPrice: null,
            offerProducts: [
                {
                    customDiscountValue: null,
                    offer: {
                        discountType: 'PERCENTAGE',
                        discountValue: 20,
                        startDate: new Date('2026-06-01T00:00:00Z'),
                        endDate: new Date('2026-06-30T23:59:59Z'), // expired!
                        isActive: true,
                    },
                },
            ],
        }, now);

        // Expired offer is ignored by the pricing engine
        assert.equal(pricing.effectivePrice, 1000000);
        assert.equal(pricing.hasOffer, false);
        assert.equal(pricing.discountPercent, 0);
    });

    it('getProductPricing applies offer if currently active', () => {
        const now = new Date('2026-06-15T12:00:00Z');
        const pricing = getProductPricing({
            price: 1000000,
            listPrice: null,
            offerProducts: [
                {
                    customDiscountValue: null,
                    offer: {
                        id: 5,
                        name: 'Summer Sale',
                        discountType: 'PERCENTAGE',
                        discountValue: 20,
                        startDate: new Date('2026-06-01T00:00:00Z'),
                        endDate: new Date('2026-06-30T23:59:59Z'),
                        isActive: true,
                    },
                },
            ],
        }, now);

        assert.equal(pricing.effectivePrice, 800000);
        assert.equal(pricing.hasOffer, true);
        assert.equal(pricing.discountPercent, 20);
        assert.equal(pricing.activeOffer?.name, 'Summer Sale');
    });
});
