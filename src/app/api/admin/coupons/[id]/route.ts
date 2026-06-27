import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/admin-auth';
import { z } from 'zod';

const couponUpdateSchema = z.object({
    code: z.string().min(1).max(50).toUpperCase().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    value: z.number().positive().optional(),
    minOrderAmount: z.number().min(0).optional().nullable(),
    maxDiscount: z.number().min(0).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().positive().optional(),
}).strict();

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/coupons/[id]
 */
export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireRole(request, 'COUPONS');
    if (!auth.ok) return auth.response;

    try {
        const { id } = await params;
        const couponId = parseInt(id, 10);
        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
            include: { usages: { include: { user: { select: { firstName: true, lastName: true, phone: true } }, order: { select: { orderNumber: true } } } } },
        });
        if (!coupon) {
            return NextResponse.json({ error: 'کد یافت نشد' }, { status: 404 });
        }
        return NextResponse.json({ coupon });
    } catch (error) {
        console.error('[Coupons] Failed to get:', error);
        return NextResponse.json({ error: 'خطا در دریافت کد' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/coupons/[id]
 */
export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireRole(request, 'COUPONS');
    if (!auth.ok) return auth.response;

    try {
        const { id } = await params;
        const couponId = parseInt(id, 10);
        const body = await request.json();
        const validation = couponUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const data = validation.data;
        const updateData: Record<string, unknown> = {};
        if (data.code !== undefined) updateData.code = data.code;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
        if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
        if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;

        const coupon = await prisma.coupon.update({
            where: { id: couponId },
            data: updateData,
        });

        return NextResponse.json({ coupon });
    } catch (error: unknown) {
        console.error('[Coupons] Failed to update:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({ error: 'این کد قبلاً ثبت شده است' }, { status: 409 });
        }
        return NextResponse.json({ error: 'خطا در ویرایش کد' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/coupons/[id]
 */
export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = await requireRole(request, 'COUPONS');
    if (!auth.ok) return auth.response;

    try {
        const { id } = await params;
        const couponId = parseInt(id, 10);
        await prisma.coupon.delete({ where: { id: couponId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Coupons] Failed to delete:', error);
        return NextResponse.json({ error: 'خطا در حذف کد' }, { status: 500 });
    }
}
