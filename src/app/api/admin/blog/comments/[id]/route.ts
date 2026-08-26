import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { requireRole } from '@/lib/admin-auth';
import { notifyCommentReply } from '@/lib/notifications';

const updateStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
});

// PATCH - Update comment status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRole(request, 'COMMENTS');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const commentId = parseInt(id);

        if (isNaN(commentId)) {
            return NextResponse.json(
                { error: 'شناسه نظر نامعتبر است' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = updateStatusSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'وضعیت نامعتبر است' },
                { status: 400 }
            );
        }

        // Fetch comment before updating to get parent/post info
        const existingComment = await prisma.blogComment.findUnique({
            where: { id: commentId },
            select: {
                parentId: true,
                authorName: true,
                post: { select: { title: true, slug: true } },
            },
        });

        const comment = await prisma.blogComment.update({
            where: { id: commentId },
            data: { status: validation.data.status },
        });

        // If this is a reply being approved, notify the parent comment author
        if (
            validation.data.status === 'APPROVED' &&
            existingComment?.parentId &&
            existingComment.post
        ) {
            notifyCommentReply(
                existingComment.parentId,
                existingComment.authorName || 'کاربر',
                existingComment.post.title,
                existingComment.post.slug
            ).catch(console.error);
        }

        return NextResponse.json({ success: true, comment });
    } catch (error) {
        console.error('خطا در به‌روزرسانی نظر:', error);
        return NextResponse.json(
            { error: 'خطا در به‌روزرسانی نظر' },
            { status: 500 }
        );
    }
}

// DELETE - Delete comment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRole(request, 'COMMENTS');
        if (!auth.ok) return auth.response;

        const { id } = await params;
        const commentId = parseInt(id);

        if (isNaN(commentId)) {
            return NextResponse.json(
                { error: 'شناسه نظر نامعتبر است' },
                { status: 400 }
            );
        }

        await prisma.blogComment.delete({
            where: { id: commentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('خطا در حذف نظر:', error);
        return NextResponse.json(
            { error: 'خطا در حذف نظر' },
            { status: 500 }
        );
    }
}
