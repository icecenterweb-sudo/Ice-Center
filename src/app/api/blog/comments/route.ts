import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/jwt';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';

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
    await connection(); // Required for request.url with cacheComponents
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
        // Rate limiting per IP
        const clientIp = getClientIp(request);
        const rateLimit = await checkRateLimit(`blog-comment:${clientIp}`, RATE_LIMITS.strict);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: `تعداد درخواست زیاد است. ${rateLimit.resetIn} ثانیه صبر کنید.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const validation = createCommentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { postId, content, authorName, authorEmail, parentId } = validation.data;

        // Check if user is logged in (optional)
        let userId: number | undefined;
        try {
            const cookieStore = await import('next/headers').then(m => m.cookies());
            const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
            if (token) {
                const payload = await verifyUserToken(token);
                if (payload) {
                    userId = payload.userId;
                }
            }
        } catch {
            // Not logged in - that's fine for guest comments
        }

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
                userId: userId || null,
                authorName: userId ? null : (authorName || 'کاربر مهمان'),
                authorEmail: userId ? null : authorEmail,
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
