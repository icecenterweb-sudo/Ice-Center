import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
});

// PATCH - Update comment status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const commentId = parseInt(id);

        if (isNaN(commentId)) {
            return NextResponse.json(
                { error: 'Invalid comment ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = updateStatusSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const comment = await prisma.blogComment.update({
            where: { id: commentId },
            data: { status: validation.data.status },
        });

        return NextResponse.json({ success: true, comment });
    } catch (error) {
        console.error('Failed to update comment:', error);
        return NextResponse.json(
            { error: 'Failed to update comment' },
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
        const { id } = await params;
        const commentId = parseInt(id);

        if (isNaN(commentId)) {
            return NextResponse.json(
                { error: 'Invalid comment ID' },
                { status: 400 }
            );
        }

        await prisma.blogComment.delete({
            where: { id: commentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete comment:', error);
        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
