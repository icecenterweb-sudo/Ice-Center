import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/admin-auth';
import { moderateReview, ReviewModerationError } from '@/lib/reviews';
import { createNotification } from '@/lib/notifications';
import { recordAudit } from '@/lib/audit';

const CACHE_PROFILE = { expire: 600 };

const moderationSchema = z.object({
    action: z.enum(['APPROVED', 'REJECTED']),
    adminNote: z.string().max(500).optional().nullable(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/reviews/[id]
 * Moderate a PENDING review (APPROVED / REJECTED), recompute the product's
 * rating aggregates in the same transaction and refresh the product cache.
 */
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const auth = await requireRole(request, 'COMMENTS');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const reviewId = parseInt(id);
        if (isNaN(reviewId)) {
            return NextResponse.json(
                { error: 'شناسه نقد نامعتبر است' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = moderationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'اقدام نامعتبر است' },
                { status: 400 }
            );
        }

        const result = await moderateReview({
            reviewId,
            action: validation.data.action,
            adminId: auth.payload.adminId,
            adminNote: validation.data.adminNote ?? null,
        });

        // Refresh cached product data (rating/reviewCount changed)
        revalidateTag(`product:${result.productSlug}`, CACHE_PROFILE);
        revalidatePath('/admin/dashboard/comments');

        // Non-critical: notify the author about the outcome
        const approved = validation.data.action === 'APPROVED';
        createNotification(
            result.review.userId,
            'SYSTEM',
            approved
                ? `نقد شما برای «${result.productName}» تایید شد`
                : `نقد شما برای «${result.productName}» رد شد`,
            approved
                ? 'نقد شما هم‌اکنون در صفحه محصول نمایش داده می‌شود.'
                : 'نقد شما پس از بررسی قابل انتشار تشخیص داده نشد.',
            `/products/${result.productSlug}`
        ).catch(console.error);

        // Audit trail (pattern used by products/orders actions)
        recordAudit(
            auth.payload.adminId,
            `REVIEW_${validation.data.action}`,
            'ProductReview',
            reviewId,
            `${approved ? 'تایید' : 'رد'} نقد #${reviewId} برای محصول "${result.productName}" (امتیاز جدید محصول: ${result.rating} از ${result.reviewCount} نظر)`
        ).catch(console.error);

        return NextResponse.json({
            success: true,
            review: result.review,
            rating: result.rating,
            reviewCount: result.reviewCount,
        });
    } catch (error) {
        if (error instanceof ReviewModerationError) {
            const status = error.code === 'NOT_FOUND' ? 404 : 409;
            return NextResponse.json({ error: error.message }, { status });
        }
        console.error('خطا در بررسی نقد:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی وضعیت نقد' },
            { status: 500 }
        );
    }
}
