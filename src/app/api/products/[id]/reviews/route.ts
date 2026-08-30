import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/user-auth';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

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
            take: 50, // Cap: prevent unbounded fetch
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

        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        // Rate limit per user (strict — matches blog comment submissions;
        // reviews are a moderation-queue write)
        const rateLimit = await checkRateLimit(`review:${payload.userId}`, RATE_LIMITS.strict);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'درخواست‌های بیش از حد. کمی بعد تلاش کنید' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
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
        // Race-safe duplicate guard: the @@unique([productId, userId]) constraint
        // rejects concurrent double-submissions that both pass the findFirst check.
        if (getPrismaErrorCode(error) === 'P2002') {
            return NextResponse.json({ error: 'شما قبلا برای این محصول نظر ثبت کرده‌اید' }, { status: 409 });
        }
        console.error('[Reviews] Failed to create:', error);
        return NextResponse.json({ error: 'خطا در ثبت نظر' }, { status: 500 });
    }
}

function getPrismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : undefined;
}
