import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const reviewSchema = z.object({
    rating: z.number().int().min(1, 'حداقل امتیاز ۱ است').max(5, 'حداکثر امتیاز ۵ است'),
    title: z.string().max(200).optional(),
    comment: z.string().min(5, 'حداقل ۵ کاراکتر وارد کنید').max(2000, 'حداکثر ۲۰۰۰ کاراکتر'),
});

/**
 * GET /api/products/[id]/reviews
 * Fetch approved reviews for a product.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
            return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
        }

        const reviews = await prisma.productReview.findMany({
            where: { productId, status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                rating: true,
                title: true,
                comment: true,
                createdAt: true,
                user: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        return NextResponse.json({ reviews });
    } catch (error) {
        console.error('[Reviews] Failed to fetch:', error);
        return NextResponse.json({ error: 'خطا در دریافت نظرات' }, { status: 500 });
    }
}

/**
 * POST /api/products/[id]/reviews
 * Submit a review (authenticated users only). Review goes to PENDING for moderation.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
            return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
        }

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
        const validation = reviewSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { rating, title, comment } = validation.data;

        // Check product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        });
        if (!product) {
            return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
        }

        // Prevent duplicate reviews from the same user on the same product
        const existing = await prisma.productReview.findFirst({
            where: { productId, userId: payload.userId },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json({ error: 'شما قبلا برای این محصول نظر ثبت کرده‌اید' }, { status: 409 });
        }

        const review = await prisma.productReview.create({
            data: {
                productId,
                userId: payload.userId,
                rating,
                title: title || null,
                comment,
                status: 'PENDING',
            },
            select: { id: true },
        });

        return NextResponse.json({ success: true, reviewId: review.id, message: 'نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود' }, { status: 201 });
    } catch (error) {
        console.error('[Reviews] Failed to create:', error);
        return NextResponse.json({ error: 'خطا در ثبت نظر' }, { status: 500 });
    }
}
