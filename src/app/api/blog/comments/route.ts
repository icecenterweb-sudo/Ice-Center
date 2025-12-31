import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a comment
const createCommentSchema = z.object({
    postId: z.number(),
    content: z.string().min(3, 'نظر باید حداقل ۳ کاراکتر باشد').max(2000, 'نظر نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد'),
    authorName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد').optional(),
    authorEmail: z.string().email('ایمیل معتبر وارد کنید').optional(),
    parentId: z.number().optional(),
});

// GET - Fetch approved comments for a post
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
        return NextResponse.json(
            { error: 'postId is required' },
            { status: 400 }
        );
    }

    try {
        const comments = await prisma.blogComment.findMany({
            where: {
                postId: parseInt(postId),
                status: 'APPROVED',
                parentId: null, // Only top-level comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                replies: {
                    where: { status: 'APPROVED' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Failed to fetch comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createCommentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { postId, content, authorName, authorEmail, parentId } = validation.data;

        // Verify post exists and is published
        const post = await prisma.blogPost.findFirst({
            where: {
                id: postId,
                status: 'PUBLISHED',
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'پست یافت نشد' },
                { status: 404 }
            );
        }

        // If parentId is provided, verify parent comment exists
        if (parentId) {
            const parentComment = await prisma.blogComment.findFirst({
                where: {
                    id: parentId,
                    postId,
                    status: 'APPROVED',
                },
            });

            if (!parentComment) {
                return NextResponse.json(
                    { error: 'نظر والد یافت نشد' },
                    { status: 404 }
                );
            }
        }

        // Create the comment
        const comment = await prisma.blogComment.create({
            data: {
                postId,
                content,
                authorName: authorName || 'کاربر مهمان',
                authorEmail,
                parentId,
                status: 'PENDING', // Comments start as pending for moderation
            },
        });

        return NextResponse.json({
            success: true,
            message: 'نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد.',
            comment,
        });
    } catch (error) {
        console.error('Failed to create comment:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت نظر' },
            { status: 500 }
        );
    }
}
