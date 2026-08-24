import assert from 'node:assert';
import { Prisma } from '@prisma/client';
import { suite, it } from './runner';
import { calculateEffectivePrice, getProductPricing, resolveUnitPrice } from '../src/lib/offers/pricing';
import { calculateCouponDiscount, validateCouponRules } from '../src/lib/coupons';

suite('Finding #12: Decimal Money Migration & Precision', () => {
    it('handles integer percentage discount on Decimal base price', () => {
        const basePrice = new Prisma.Decimal('1500000.00');
        const discountValue = new Prisma.Decimal('20.00');

        const result = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue,
            },
        });

        assert.strictEqual(result.hasOffer, true);
        assert.strictEqual(result.originalPrice, 1500000);
        assert.strictEqual(result.discountAmount, 300000);
        assert.strictEqual(result.effectivePrice, 1200000);
        assert.strictEqual(result.discountPercent, 20);
    });

    it('handles fractional percentage discount without floating point error (e.g. 15.5%)', () => {
        const basePrice = new Prisma.Decimal('2000000.00');
        const discountValue = new Prisma.Decimal('15.50');

        const result = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue,
            },
        });

        assert.strictEqual(result.hasOffer, true);
        assert.strictEqual(result.originalPrice, 2000000);
        assert.strictEqual(result.discountAmount, 310000);
        assert.strictEqual(result.effectivePrice, 1690000);
        assert.strictEqual(result.discountPercent, 16);
    });

    it('applies maxDiscountCap with Decimal precision correctly', () => {
        const basePrice = new Prisma.Decimal('10000000.00');
        const discountValue = new Prisma.Decimal('50.00'); // 50% would be 5,000,000
        const maxDiscountCap = new Prisma.Decimal('1000000.00'); // Cap at 1,000,000

        const result = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue,
                maxDiscountCap,
            },
        });

        assert.strictEqual(result.discountAmount, 1000000);
        assert.strictEqual(result.effectivePrice, 9000000);
        assert.strictEqual(result.discountPercent, 10);
    });

    it('handles fixed amount discounts with Decimal values up to billions', () => {
        const basePrice = new Prisma.Decimal('550000000.00'); // 550M Toman
        const discountValue = new Prisma.Decimal('50000000.00'); // 50M Toman discount

        const result = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'FIXED_AMOUNT',
                discountValue,
            },
        });

        assert.strictEqual(result.originalPrice, 550000000);
        assert.strictEqual(result.discountAmount, 50000000);
        assert.strictEqual(result.effectivePrice, 500000000);
        assert.strictEqual(result.discountPercent, 9);
    });

    it('handles zero discount and 100% discount with Decimal values', () => {
        const basePrice = new Prisma.Decimal('450000.00');

        const zeroResult = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue: new Prisma.Decimal('0.00'),
            },
        });
        assert.strictEqual(zeroResult.effectivePrice, 450000);
        assert.strictEqual(zeroResult.discountAmount, 0);

        const fullResult = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue: new Prisma.Decimal('100.00'),
            },
        });
        assert.strictEqual(fullResult.effectivePrice, 0);
        assert.strictEqual(fullResult.discountAmount, 450000);
    });

    it('clamps negative percentages and percentages exceeding 100 with Decimal', () => {
        const basePrice = new Prisma.Decimal('100000.00');

        const negativeResult = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue: new Prisma.Decimal('-25.00'),
            },
        });
        assert.strictEqual(negativeResult.effectivePrice, 100000);
        assert.strictEqual(negativeResult.discountAmount, 0);

        const overResult = calculateEffectivePrice({
            basePrice,
            activeOffer: {
                discountType: 'PERCENTAGE',
                discountValue: new Prisma.Decimal('150.00'),
            },
        });
        assert.strictEqual(overResult.effectivePrice, 0);
        assert.strictEqual(overResult.discountAmount, 100000);
    });

    it('getProductPricing correctly evaluates DbProduct with Decimal fields', () => {
        const now = new Date('2026-08-24T12:00:00Z');
        const product = {
            price: new Prisma.Decimal('8500000.00'),
            listPrice: new Prisma.Decimal('9500000.00'),
            offerProducts: [
                {
                    customDiscountValue: new Prisma.Decimal('10.00'),
                    offer: {
                        id: 10,
                        name: 'Summer Sale',
                        discountType: 'PERCENTAGE' as const,
                        discountValue: new Prisma.Decimal('5.00'), // overridden by customDiscountValue
                        startDate: new Date('2026-08-01T00:00:00Z'),
                        endDate: new Date('2026-08-31T23:59:59Z'),
                        isActive: true,
                        badgeText: '۱۰٪ تخفیف ویژه',
                    },
                },
            ],
        };

        const pricing = getProductPricing(product, now);
        assert.strictEqual(pricing.hasOffer, true);
        assert.strictEqual(pricing.originalPrice, 8500000);
        assert.strictEqual(pricing.effectivePrice, 7650000); // 8,500,000 - 850,000
        assert.strictEqual(pricing.discountPercent, 10);
        assert.strictEqual(pricing.activeOffer?.name, 'Summer Sale');
    });

    it('resolveUnitPrice gracefully handles Decimal fallback values', () => {
        assert.strictEqual(resolveUnitPrice({ effectivePrice: 120000 }, new Prisma.Decimal('150000')), 120000);
        assert.strictEqual(resolveUnitPrice({ effectivePrice: 0 }, new Prisma.Decimal('150000')), 0);
        assert.strictEqual(resolveUnitPrice(null, new Prisma.Decimal('150000')), 150000);
    });

    it('calculateCouponDiscount supports Decimal coupon value and maxDiscount', () => {
        const coupon = {
            type: 'PERCENTAGE' as const,
            value: new Prisma.Decimal('25.00'),
            maxDiscount: new Prisma.Decimal('100000.00'),
        };

        // 25% of 1,000,000 = 250,000, capped at 100,000
        const discount1 = calculateCouponDiscount(coupon, 1000000);
        assert.strictEqual(discount1, 100000);

        // 25% of 200,000 = 50,000, below cap
        const discount2 = calculateCouponDiscount(coupon, 200000);
        assert.strictEqual(discount2, 50000);

        // Fixed amount coupon
        const fixedCoupon = {
            type: 'FIXED_AMOUNT' as const,
            value: new Prisma.Decimal('75000.00'),
            maxDiscount: null,
        };
        const discount3 = calculateCouponDiscount(fixedCoupon, 500000);
        assert.strictEqual(discount3, 75000);

        // Fixed coupon larger than subtotal clamped to subtotal
        const discount4 = calculateCouponDiscount(fixedCoupon, 50000);
        assert.strictEqual(discount4, 50000);
    });

    it('validateCouponRules enforces minOrderAmount with Decimal values', () => {
        const coupon = {
            id: 1,
            code: 'VIP50',
            type: 'FIXED_AMOUNT' as const,
            value: new Prisma.Decimal('50000.00'),
            status: 'ACTIVE' as const,
            startDate: null,
            endDate: null,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 1,
            minOrderAmount: new Prisma.Decimal('500000.00'),
            maxDiscount: null,
        };

        // Below minOrderAmount
        const invalidRes = validateCouponRules({
            coupon,
            userUsageCount: 0,
            subtotal: 400000,
        });
        assert.strictEqual(invalidRes.valid, false);
        assert.strictEqual(invalidRes.discount, 0);

        // At or above minOrderAmount
        const validRes = validateCouponRules({
            coupon,
            userUsageCount: 0,
            subtotal: 600000,
        });
        assert.strictEqual(validRes.valid, true);
        assert.strictEqual(validRes.discount, 50000);
    });
});
