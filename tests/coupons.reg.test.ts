import { suite, it } from './runner';
import assert from 'node:assert/strict';
import {
    validateCouponRules,
    calculateCouponDiscount,
    type ValidateCouponInput,
} from '../src/lib/coupons';

const baseCoupon: ValidateCouponInput = {
    id: 1,
    code: 'DISCOUNT20',
    type: 'PERCENTAGE',
    value: 20,
    status: 'ACTIVE',
    startDate: null,
    endDate: null,
    usageLimit: 100,
    usedCount: 10,
    perUserLimit: 1,
    minOrderAmount: 100000,
    maxDiscount: 50000,
};

suite('Batch 2 #9 — Coupon validation & atomic rules', () => {
    it('validates a valid percentage coupon and applies maxDiscount cap', () => {
        const res = validateCouponRules({
            coupon: baseCoupon,
            userUsageCount: 0,
            subtotal: 500000,
        });
        assert.equal(res.valid, true);
        // 20% of 500k = 100k, capped at 50k
        assert.equal(res.discount, 50000);
    });

    it('validates a percentage coupon without hitting maxDiscount cap', () => {
        const res = validateCouponRules({
            coupon: baseCoupon,
            userUsageCount: 0,
            subtotal: 200000,
        });
        assert.equal(res.valid, true);
        // 20% of 200k = 40k (under 50k cap)
        assert.equal(res.discount, 40000);
    });

    it('rejects an INACTIVE coupon', () => {
        const res = validateCouponRules({
            coupon: { ...baseCoupon, status: 'INACTIVE' },
            userUsageCount: 0,
            subtotal: 500000,
        });
        assert.equal(res.valid, false);
        assert.equal(res.error, 'این کد تخفیف غیرفعال است');
    });

    it('rejects a coupon before its startDate', () => {
        const futureDate = new Date(Date.now() + 86400000);
        const res = validateCouponRules({
            coupon: { ...baseCoupon, startDate: futureDate },
            userUsageCount: 0,
            subtotal: 500000,
        });
        assert.equal(res.valid, false);
        assert.equal(res.error, 'این کد تخفیف هنوز فعال نشده است');
    });

    it('rejects a coupon after its endDate', () => {
        const pastDate = new Date(Date.now() - 86400000);
        const res = validateCouponRules({
            coupon: { ...baseCoupon, endDate: pastDate },
            userUsageCount: 0,
            subtotal: 500000,
        });
        assert.equal(res.valid, false);
        assert.equal(res.error, 'مدت استفاده از این کد تخفیف به پایان رسیده است');
    });

    it('rejects when global usageLimit is reached', () => {
        const res = validateCouponRules({
            coupon: { ...baseCoupon, usageLimit: 10, usedCount: 10 },
            userUsageCount: 0,
            subtotal: 500000,
        });
        assert.equal(res.valid, false);
        assert.equal(res.error, 'سقف استفاده از این کد تخفیف تکمیل شده است');
    });

    it('rejects when per-user limit is reached', () => {
        const res = validateCouponRules({
            coupon: { ...baseCoupon, perUserLimit: 1 },
            userUsageCount: 1,
            subtotal: 500000,
        });
        assert.equal(res.valid, false);
        assert.equal(res.error, 'شما قبلا از این کد تخفیف استفاده کرده‌اید');
    });

    it('rejects when subtotal is less than minOrderAmount', () => {
        const res = validateCouponRules({
            coupon: { ...baseCoupon, minOrderAmount: 300000 },
            userUsageCount: 0,
            subtotal: 200000,
        });
        assert.equal(res.valid, false);
        assert.ok(res.error?.includes('حداقل مبلغ سفارش'));
    });

    it('handles fixed amount coupon and caps at subtotal', () => {
        const fixedCoupon: ValidateCouponInput = {
            ...baseCoupon,
            type: 'FIXED_AMOUNT',
            value: 80000,
            maxDiscount: null,
            minOrderAmount: null,
        };
        const res = validateCouponRules({
            coupon: fixedCoupon,
            userUsageCount: 0,
            subtotal: 50000,
        });
        assert.equal(res.valid, true);
        assert.equal(res.discount, 50000); // capped at subtotal
    });

    it('calculateCouponDiscount helper returns 0 for non-positive values', () => {
        const d = calculateCouponDiscount({ type: 'PERCENTAGE', value: 0, maxDiscount: null }, 100000);
        assert.equal(d, 0);
    });
});
