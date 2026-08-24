import { suite, it } from './runner';
import assert from 'node:assert/strict';
import {
    moderateReview,
    recalculateProductRating,
    ReviewModerationError,
} from '../src/lib/reviews';
import type { PrismaClient } from '@prisma/client';

/**
 * In-memory Prisma stub implementing ONLY the surface used by the real
 * moderation service — the service code under test is the real module.
 */
type Row = {
    id: number;
    productId: number;
    userId: number;
    rating: number;
    status: string;
    adminId?: number | null;
    adminNote?: string | null;
};

function makeDb(seed: Row[]) {
    const state = { reviews: seed.map((r) => ({ ...r })) };
    const calls = { txUsedForProductUpdate: null as object | null, rootUsedForProductUpdate: 0 };
    // Minimal product table backing the service's relation select
    const products: Record<number, { name: string; slug: string }> = {
        1: { name: 'Machine A', slug: 'ice-cream-machine' },
        2: { name: 'Machine B', slug: 'batch-freezer' },
        4: { name: 'Juicer', slug: 'juicer-pro' },
        5: { name: 'Fridge', slug: 'display-fridge' },
        9: { name: 'Freezer', slug: 'chest-freezer' },
    };

    function makeClient(isTx: boolean) {
        const client = {
            __isTx: isTx,
            productReview: {
                findUnique: async ({ where }: { where: { id: number } }) => {
                    const row = state.reviews.find((r) => r.id === where.id);
                    if (!row) return null;
                    return { ...row, product: products[row.productId] ?? { name: '?', slug: '?' } };
                },
                update: async ({ where, data }: { where: { id: number }; data: Partial<Row> }) => {
                    const row = state.reviews.find((r) => r.id === where.id);
                    if (!row) throw new Error('record not found');
                    Object.assign(row, data);
                    return { ...row };
                },
                aggregate: async ({ where }: { where: { productId: number; status: string } }) => {
                    const rows = state.reviews.filter(
                        (r) => r.productId === where.productId && r.status === where.status
                    );
                    const count = rows.length;
                    const avg = count > 0 ? rows.reduce((s, r) => s + r.rating, 0) / count : null;
                    return { _avg: { rating: avg }, _count: { _all: count } };
                },
            },
            product: {
                update: async ({ data }: { data: { rating: number; reviewCount: number } }) => {
                    if (isTx) calls.txUsedForProductUpdate = client;
                    else calls.rootUsedForProductUpdate++;
                    return { id: 1, ...data };
                },
            },
        };
        return client;
    }

    const root = makeClient(false) as ReturnType<typeof makeClient> & {
        $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
    };
    const tx = makeClient(true);
    root.$transaction = (fn) => fn(tx);

    // The service must run review update AND product recompute inside the SAME tx
    (root as unknown as { __calls: typeof calls }).__calls = calls;

    return { root: root as never as PrismaClient, tx, calls, state };
}

suite('Batch1 #4 — review moderation lifecycle', () => {
    it('PENDING → APPROVED sets status/admin fields and recomputes aggregates', async () => {
        const db = makeDb([{ id: 10, productId: 1, userId: 7, rating: 5, status: 'PENDING' }]);
        const res = await moderateReview(
            { reviewId: 10, action: 'APPROVED', adminId: 3 },
            db.root
        );
        assert.equal(res.review.status, 'APPROVED');
        assert.equal(res.review.adminId, 3);
        assert.equal(res.rating, 5);
        assert.equal(res.reviewCount, 1);
        assert.equal(res.productSlug, 'ice-cream-machine');
        assert.equal(db.state.reviews[0].adminId, 3);
        assert.equal(db.state.reviews[0].adminNote, null);
    });

    it('PENDING → REJECTED keeps the review hidden and excludes it from rating math', async () => {
        const db = makeDb([
            { id: 1, productId: 2, userId: 7, rating: 4, status: 'APPROVED' },
            { id: 2, productId: 2, userId: 8, rating: 5, status: 'PENDING' },
        ]);
        const res = await moderateReview({ reviewId: 2, action: 'REJECTED', adminId: 3 }, db.root);
        assert.equal(res.review.status, 'REJECTED');
        assert.equal(res.rating, 4); // rejected 5 excluded
        assert.equal(res.reviewCount, 1);
    });

    it('double moderation is rejected with ALREADY_MODERATED (409 path)', async () => {
        const db = makeDb([{ id: 1, productId: 1, userId: 7, rating: 4, status: 'PENDING' }]);
        await moderateReview({ reviewId: 1, action: 'APPROVED', adminId: 3 }, db.root);
        await assert.rejects(
            () => moderateReview({ reviewId: 1, action: 'REJECTED', adminId: 3 }, db.root),
            (err: unknown) =>
                err instanceof ReviewModerationError && err.code === 'ALREADY_MODERATED'
        );
    });

    it('unknown review id → NOT_FOUND (404 path)', async () => {
        const db = makeDb([]);
        await assert.rejects(
            () => moderateReview({ reviewId: 999, action: 'APPROVED', adminId: 3 }, db.root),
            (err: unknown) => err instanceof ReviewModerationError && err.code === 'NOT_FOUND'
        );
    });

    it('rating recomputes with 1-decimal rounding across multiple approvals', async () => {
        const db = makeDb([
            { id: 1, productId: 5, userId: 7, rating: 4, status: 'PENDING' },
            { id: 2, productId: 5, userId: 8, rating: 5, status: 'PENDING' },
            { id: 3, productId: 5, userId: 9, rating: 4, status: 'PENDING' },
        ]);
        const a = await moderateReview({ reviewId: 1, action: 'APPROVED', adminId: 3 }, db.root);
        assert.equal(a.rating, 4);
        const b = await moderateReview({ reviewId: 2, action: 'APPROVED', adminId: 3 }, db.root);
        assert.equal(b.rating, 4.5);
        const c = await moderateReview({ reviewId: 3, action: 'APPROVED', adminId: 3 }, db.root);
        assert.equal(c.rating, 4.3); // round(13/3 * 10)/10
        assert.equal(c.reviewCount, 3);
    });

    it('rejecting the only review drops product to rating 0 / count 0', async () => {
        const db = makeDb([{ id: 1, productId: 9, userId: 7, rating: 2, status: 'PENDING' }]);
        const res = await moderateReview({ reviewId: 1, action: 'REJECTED', adminId: 3 }, db.root);
        assert.equal(res.rating, 0);
        assert.equal(res.reviewCount, 0);
    });

    it('recalculate ignores PENDING/REJECTED even when called directly', async () => {
        const db = makeDb([
            { id: 1, productId: 4, userId: 7, rating: 5, status: 'APPROVED' },
            { id: 2, productId: 4, userId: 8, rating: 1, status: 'PENDING' },
            { id: 3, productId: 4, userId: 9, rating: 1, status: 'REJECTED' },
        ]);
        const summary = await recalculateProductRating(db.root, 4);
        assert.deepEqual(summary, { rating: 5, reviewCount: 1 });
    });

    it('review update + aggregate recompute run inside the SAME transaction client', async () => {
        const db = makeDb([{ id: 1, productId: 1, userId: 7, rating: 4, status: 'PENDING' }]);
        await moderateReview({ reviewId: 1, action: 'APPROVED', adminId: 3 }, db.root);
        assert.notEqual(db.calls.txUsedForProductUpdate, null, 'product.update must run in tx');
        assert.equal(db.calls.txUsedForProductUpdate, db.tx);
    });

    it('custom adminNote is persisted through the transaction', async () => {
        const db = makeDb([{ id: 1, productId: 1, userId: 7, rating: 3, status: 'PENDING' }]);
        const res = await moderateReview(
            { reviewId: 1, action: 'APPROVED', adminId: 3, adminNote: 'تایید پس از تماس' },
            db.root
        );
        assert.equal(res.review.adminNote, 'تایید پس از تماس');
    });
});
