import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

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

        if (coupon.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'این کد تخفیف غیرفعال است' }, { status: 400 });
        }

        const now = new Date();
        if (coupon.startDate && now < coupon.startDate) {
            return NextResponse.json({ error: 'این کد تخفیف هنوز فعال نشده است' }, { status: 400 });
        }
        if (coupon.endDate && now > coupon.endDate) {
            return NextResponse.json({ error: 'مدت استفاده از این کد تخفیف به پایان رسیده است' }, { status: 400 });
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ error: 'سقف استفاده از این کد تخفیف تکمیل شده است' }, { status: 400 });
        }

        if (coupon.usages.length >= coupon.perUserLimit) {
            return NextResponse.json({ error: 'شما قبلا از این کد تخفیف استفاده کرده‌اید' }, { status: 400 });
        }

        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
            return NextResponse.json({
                error: `حداقل مبلغ سفارش برای این کد ${coupon.minOrderAmount.toLocaleString('fa-IR')} تومان است`,
            }, { status: 400 });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'PERCENTAGE') {
            discount = Math.round(subtotal * (coupon.value / 100));
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.value;
        }

        // Don't allow discount to exceed the subtotal
        if (discount > subtotal) {
            discount = subtotal;
        }

        return NextResponse.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                discount,
            },
        });
    } catch (error) {
        console.error('[Coupons] Failed to validate:', error);
        return NextResponse.json({ error: 'خطا در بررسی کد تخفیف' }, { status: 500 });
    }
}
