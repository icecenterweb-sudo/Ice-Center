import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { createPostSchema, listPostsQuerySchema } from '@/lib/blog/validation';
import { getPublishedPosts, getAllPosts } from '@/lib/blog/queries';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/blog - List posts
export async function GET(request: NextRequest) {
    await connection(); // Required for request.url with cacheComponents
    try {
        const { searchParams } = new URL(request.url);

        // Parse query params
        const queryResult = listPostsQuerySchema.safeParse({
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            status: searchParams.get('status'),
            categoryId: searchParams.get('categoryId'),
            categorySlug: searchParams.get('categorySlug'),
            tagSlug: searchParams.get('tagSlug'),
            search: searchParams.get('search'),
        });

        if (!queryResult.success) {
            return NextResponse.json(
                { error: 'پارامترهای نامعتبر', details: queryResult.error.flatten() },
                { status: 400 }
            );
        }

        const query = queryResult.data;

        // Check if admin request (has status filter) - use getAllPosts
        // Otherwise use getPublishedPosts for public
        const isAdmin = searchParams.has('status') || searchParams.has('admin');
        if (isAdmin) {
            const auth = await requireAdmin(request);
            if (!auth.ok) return auth.response;
        }

        const result = isAdmin
            ? await getAllPosts(query)
            : await getPublishedPosts(query);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت پست‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/blog - Create new post
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await request.json();

        // Validate input
        const result = createPostSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'داده‌های نامعتبر', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { tagIds, ...postData } = result.data;

        // Check slug uniqueness
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug: postData.slug },
        });

        if (existingPost) {
            return NextResponse.json(
                { error: 'این اسلاگ قبلاً استفاده شده است' },
                { status: 409 }
            );
        }

        // Auto-set publishedAt when status is PUBLISHED
        let publishedAt = postData.publishedAt;
        if (postData.status === 'PUBLISHED' && !publishedAt) {
            publishedAt = new Date();
        }

        // Create post
        const post = await prisma.blogPost.create({
            data: {
                ...postData,
                publishedAt,
                tags: tagIds?.length
                    ? { connect: tagIds.map((id) => ({ id })) }
                    : undefined,
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                tags: { select: { id: true, name: true, slug: true } },
                author: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Error creating blog post:', error);
        return NextResponse.json(
            { error: 'خطا در ایجاد پست' },
            { status: 500 }
        );
    }
}
