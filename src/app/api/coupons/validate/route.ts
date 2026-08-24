import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { validateCouponRules } from '@/lib/coupons';

const applySchema = z.object({
    code: z.string().min(1, 'کد تخفیف را وارد کنید'),
    subtotal: z.number().positive('مبلغ سبد خرید نامعتبر است'),
});

/**
 * POST /api/coupons/validate
 * Validate a coupon code against the cart subtotal and return the discount amount.
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        const body = await request.json();
        const validation = applySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { code, subtotal } = validation.data;
        const normalizedCode = code.trim().toUpperCase();

        const coupon = await prisma.coupon.findUnique({
            where: { code: normalizedCode },
            include: {
                usages: {
                    where: { userId: payload.userId },
                    select: { id: true },
                },
            },
        });

        if (!coupon) {
            return NextResponse.json({ error: 'کد تخفیف یافت نشد' }, { status: 404 });
        }

        const result = validateCouponRules({
            coupon,
            userUsageCount: coupon.usages.length,
            subtotal,
        });

        if (!result.valid) {
            return NextResponse.json({ error: result.error || 'کد تخفیف نامعتبر است' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                discount: result.discount,
            },
        });
    } catch (error) {
        console.error('[Coupons] Failed to validate:', error);
        return NextResponse.json({ error: 'خطا در بررسی کد تخفیف' }, { status: 500 });
    }
}
