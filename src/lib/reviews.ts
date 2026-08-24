/**
 * Product Review Moderation Service
 *
 * Lifecycle: PENDING → APPROVED | REJECTED (admin-only transitions).
 * On every moderation the product's denormalized `rating` / `reviewCount`
 * are recomputed from APPROVED reviews only, inside the same transaction,
 * so public display (which filters status='APPROVED') stays synchronized.
 */

import { prisma } from '@/lib/db';
import type { PrismaClient, Prisma } from '@prisma/client';

export type ReviewModerationAction = 'APPROVED' | 'REJECTED';

export class ReviewModerationError extends Error {
    constructor(
        public code: 'NOT_FOUND' | 'ALREADY_MODERATED',
        message: string
    ) {
        super(message);
        this.name = 'ReviewModerationError';
    }
}

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Recompute a product's rating/reviewCount from its APPROVED reviews only.
 * Rating is stored rounded to 1 decimal; 0 when no approved reviews exist.
 */
export async function recalculateProductRating(db: Db, productId: number) {
    const agg = await db.productReview.aggregate({
        where: { productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { _all: true },
    });

    const reviewCount = agg._count._all;
    const avg = agg._avg.rating ?? 0;
    const rating = reviewCount > 0 ? Math.round(avg * 10) / 10 : 0;

    await db.product.update({
        where: { id: productId },
        data: { rating, reviewCount },
    });

    return { rating, reviewCount };
}

interface ModerateReviewOptions {
    reviewId: number;
    action: ReviewModerationAction;
    adminId: number;
    adminNote?: string | null;
}

/**
 * Moderate a single pending review and refresh product aggregates atomically.
 * Throws ReviewModerationError for missing or already-moderated reviews.
 */
export async function moderateReview(options: ModerateReviewOptions, db: PrismaClient = prisma) {
    return db.$transaction(async (tx: Prisma.TransactionClient) => {
        const review = await tx.productReview.findUnique({
            where: { id: options.reviewId },
            select: {
                id: true,
                status: true,
                userId: true,
                productId: true,
                product: { select: { name: true, slug: true } },
            },
        });

        if (!review) {
            throw new ReviewModerationError('NOT_FOUND', 'نقد یافت نشد');
        }

        if (review.status !== 'PENDING') {
            throw new ReviewModerationError('ALREADY_MODERATED', 'این نقد قبلاً بررسی شده است');
        }

        const updated = await tx.productReview.update({
            where: { id: options.reviewId },
            data: {
                status: options.action,
                adminId: options.adminId,
                adminNote: options.adminNote ?? null,
            },
        });

        const summary = await recalculateProductRating(tx, review.productId);

        return {
            review: updated,
            productSlug: review.product.slug,
            productName: review.product.name,
            ...summary,
        };
    });
}
