import type { CouponType, CouponStatus, Prisma } from '@prisma/client';

export type DecimalLike = number | Prisma.Decimal | string;

export interface ValidateCouponInput {
    id: number;
    code: string;
    type: CouponType;
    value: DecimalLike;
    status: CouponStatus;
    startDate: Date | null;
    endDate: Date | null;
    usageLimit: number | null;
    usedCount: number;
    perUserLimit: number;
    minOrderAmount: DecimalLike | null;
    maxDiscount: DecimalLike | null;
}

export interface ValidateCouponParams {
    coupon: ValidateCouponInput;
    userUsageCount: number;
    subtotal: number;
    now?: Date;
}

export interface CouponValidationResult {
    valid: boolean;
    error?: string;
    discount: number;
}

/**
 * Calculate the discount amount for a given coupon and subtotal
 */
export function calculateCouponDiscount(
    coupon: { type: CouponType; value: DecimalLike; maxDiscount: DecimalLike | null },
    subtotal: number
): number {
    const value = Number(coupon.value);
    const maxDiscount = coupon.maxDiscount != null ? Number(coupon.maxDiscount) : null;
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = Math.round(subtotal * (value / 100));
        if (maxDiscount != null && discount > maxDiscount) {
            discount = maxDiscount;
        }
    } else {
        discount = value;
    }
    if (discount > subtotal) {
        discount = subtotal;
    }
    return Math.max(0, discount);
}

/**
 * Validates business rules for applying a coupon
 */
export function validateCouponRules(params: ValidateCouponParams): CouponValidationResult {
    const { coupon, userUsageCount, subtotal, now = new Date() } = params;

    if (coupon.status !== 'ACTIVE') {
        return { valid: false, error: 'این کد تخفیف غیرفعال است', discount: 0 };
    }

    if (coupon.startDate && now < coupon.startDate) {
        return { valid: false, error: 'این کد تخفیف هنوز فعال نشده است', discount: 0 };
    }

    if (coupon.endDate && now > coupon.endDate) {
        return { valid: false, error: 'مدت استفاده از این کد تخفیف به پایان رسیده است', discount: 0 };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, error: 'سقف استفاده از این کد تخفیف تکمیل شده است', discount: 0 };
    }

    if (userUsageCount >= coupon.perUserLimit) {
        return { valid: false, error: 'شما قبلا از این کد تخفیف استفاده کرده‌اید', discount: 0 };
    }

    const minOrder = coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : null;
    if (minOrder != null && subtotal < minOrder) {
        return {
            valid: false,
            error: `حداقل مبلغ سفارش برای این کد ${minOrder.toLocaleString('fa-IR')} تومان است`,
            discount: 0,
        };
    }

    const discount = calculateCouponDiscount(coupon, subtotal);
    return { valid: true, discount };
}
