import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/admin-auth';
import { z } from 'zod';

const couponSchema = z.object({
    code: z.string().min(1, 'کد تخفیف الزامی است').max(50).toUpperCase(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.number().positive('مقدار باید مثبت باشد'),
    minOrderAmount: z.number().min(0).optional().nullable(),
    maxDiscount: z.number().min(0).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).default('ACTIVE'),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().positive().default(1),
}).strict().refine((data) => {
    if (data.type === 'PERCENTAGE' && data.value > 100) {
        return false;
    }
    return true;
}, {
    message: 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد',
    path: ['value'],
});

/**
 * GET /api/admin/coupons — list all coupons
 */
export async function GET(request: NextRequest) {
    await connection(); // Required for request.headers with cacheComponents
    const auth = await requireRole(request, 'COUPONS');
    if (!auth.ok) return auth.response;

    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { usages: true } },
            },
        });
        return NextResponse.json({ coupons });
    } catch (error) {
        console.error('[Coupons] Failed to list:', error);
        return NextResponse.json({ error: 'خطا در دریافت لیست کدها' }, { status: 500 });
    }
}

/**
 * POST /api/admin/coupons — create a coupon
 */
export async function POST(request: NextRequest) {
    const auth = await requireRole(request, 'COUPONS');
    if (!auth.ok) return auth.response;

    try {
        const body = await request.json();
        const validation = couponSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const data = validation.data;
        const coupon = await prisma.coupon.create({
            data: {
                code: data.code,
                type: data.type,
                value: data.value,
                minOrderAmount: data.minOrderAmount ?? null,
                maxDiscount: data.maxDiscount ?? null,
                status: data.status,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                usageLimit: data.usageLimit ?? null,
                perUserLimit: data.perUserLimit,
            },
        });

        return NextResponse.json({ coupon }, { status: 201 });
    } catch (error: unknown) {
        console.error('[Coupons] Failed to create:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({ error: 'این کد قبلاً ثبت شده است' }, { status: 409 });
        }
        return NextResponse.json({ error: 'خطا در ایجاد کد تخفیف' }, { status: 500 });
    }
}
