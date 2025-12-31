import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updatePostSchema } from '@/lib/blog/validation';
import { getPostBySlug, getPublishedPostBySlug } from '@/lib/blog/queries';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET /api/blog/[slug] - Get single post
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const isAdmin = searchParams.has('admin');

        const post = isAdmin
            ? await getPostBySlug(slug)
            : await getPublishedPostBySlug(slug);

        if (!post) {
            return NextResponse.json(
                { error: 'پست یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت پست' },
            { status: 500 }
        );
    }
}

// PUT /api/blog/[slug] - Update post
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const body = await request.json();

        // Validate input
        const result = updatePostSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'داده‌های نامعتبر', details: result.error.flatten() },
                { status: 400 }
            );
        }

        // Check if post exists
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!existingPost) {
            return NextResponse.json(
                { error: 'پست یافت نشد' },
                { status: 404 }
            );
        }

        const { tagIds, ...postData } = result.data;

        // Check new slug uniqueness (if changed)
        if (postData.slug && postData.slug !== slug) {
            const slugExists = await prisma.blogPost.findUnique({
                where: { slug: postData.slug },
            });
            if (slugExists) {
                return NextResponse.json(
                    { error: 'این اسلاگ قبلاً استفاده شده است' },
                    { status: 409 }
                );
            }
        }

        // Auto-set publishedAt when changing to PUBLISHED
        let { publishedAt } = postData;
        if (
            postData.status === 'PUBLISHED' &&
            existingPost.status !== 'PUBLISHED' &&
            !publishedAt
        ) {
            publishedAt = new Date();
        }

        // Update post
        const post = await prisma.blogPost.update({
            where: { slug },
            data: {
                ...postData,
                publishedAt,
                tags: tagIds !== undefined
                    ? { set: tagIds.map((id) => ({ id })) }
                    : undefined,
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                tags: { select: { id: true, name: true, slug: true } },
                author: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error updating blog post:', error);
        return NextResponse.json(
            { error: 'خطا در بروزرسانی پست' },
            { status: 500 }
        );
    }
}

// DELETE /api/blog/[slug] - Delete post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        // Check if post exists
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!existingPost) {
            return NextResponse.json(
                { error: 'پست یافت نشد' },
                { status: 404 }
            );
        }

        await prisma.blogPost.delete({
            where: { slug },
        });

        return NextResponse.json({ message: 'پست با موفقیت حذف شد' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        return NextResponse.json(
            { error: 'خطا در حذف پست' },
            { status: 500 }
        );
    }
}
