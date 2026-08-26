import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRolePage } from '@/lib/admin-auth';
import UnifiedCommentsClient, {
    type UnifiedComment,
    type CommentStatus
} from './UnifiedCommentsClient';
import { getCommentDisplayName } from '@/lib/comments-status';

export const metadata: Metadata = {
    title: 'مدیریت نظرات و دیدگاه‌ها',
};

async function getUnifiedCommentsData() {
    await connection(); // Opt out of static caching for live admin view

    const [productReviews, blogComments] = await Promise.all([
        prisma.productReview.findMany({
            include: {
                product: { select: { id: true, name: true, slug: true } },
                user: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
        prisma.blogComment.findMany({
            include: {
                post: { select: { id: true, title: true, slug: true } },
                user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                parent: { select: { id: true, content: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
    ]);

    // Map ProductReviews into UnifiedComment shape
    const mappedReviews: UnifiedComment[] = productReviews.map((r) => ({
        id: r.id,
        type: 'PRODUCT_REVIEW',
        status: r.status as CommentStatus,
        content: r.comment,
        title: r.title,
        rating: r.rating,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
        targetId: r.product.id,
        targetName: r.product.name,
        targetSlug: r.product.slug,
        user: {
            id: r.user?.id,
            name: getCommentDisplayName(r.user),
            phone: r.user?.phone,
        },
    }));

    // Map BlogComments into UnifiedComment shape
    const mappedBlogComments: UnifiedComment[] = blogComments.map((c) => ({
        id: c.id,
        type: 'BLOG_COMMENT',
        status: c.status as CommentStatus,
        content: c.content,
        title: null,
        rating: null,
        adminNote: null,
        createdAt: c.createdAt.toISOString(),
        targetId: c.post.id,
        targetName: c.post.title,
        targetSlug: c.post.slug,
        user: {
            id: c.user?.id,
            name: getCommentDisplayName(c.user, c.authorName),
            phone: c.user?.phone,
        },
        parent: c.parent ? { id: c.parent.id, content: c.parent.content } : null,
    }));

    // Combine and sort by createdAt descending
    const allComments = [...mappedReviews, ...mappedBlogComments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Compute aggregate stats
    const total = allComments.length;
    const pending = allComments.filter((c) => c.status === 'PENDING').length;
    const approved = allComments.filter((c) => c.status === 'APPROVED').length;
    const rejected = allComments.filter((c) => c.status === 'REJECTED').length;

    return {
        comments: allComments,
        stats: {
            total,
            pending,
            approved,
            rejected,
            productReviewsCount: mappedReviews.length,
            blogCommentsCount: mappedBlogComments.length,
        },
    };
}

async function UnifiedCommentsContent() {
    await requireRolePage('COMMENTS');
    const { comments, stats } = await getUnifiedCommentsData();

    return <UnifiedCommentsClient initialComments={comments} stats={stats} />;
}

export default function UnifiedCommentsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-gray-500 text-sm">
                    در حال بارگذاری مرکز مدیریت نظرات...
                </div>
            }
        >
            <UnifiedCommentsContent />
        </Suspense>
    );
}
