import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { ListPostsQuery } from './validation';

// Get published posts for public pages
export async function getPublishedPosts(query: ListPostsQuery) {
    const { page, limit, categorySlug, tagSlug, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
    };

    // Filter by category
    if (categorySlug) {
        where.category = { slug: categorySlug };
    }

    // Filter by tag
    if (tagSlug) {
        where.tags = { some: { slug: tagSlug } };
    }

    // Search in title and summary
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                tags: { select: { id: true, name: true, slug: true } },
                author: { select: { id: true, name: true } },
            },
            orderBy: { publishedAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Get single post by slug (public)
export async function getPublishedPostBySlug(slug: string) {
    return prisma.blogPost.findFirst({
        where: {
            slug,
            status: 'PUBLISHED',
            publishedAt: { lte: new Date() },
        },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            tags: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true } },
        },
    });
}

// Get all posts for admin (including drafts)
export async function getAllPosts(query: ListPostsQuery) {
    const { page, limit, status, categoryId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {};

    if (status) {
        where.status = status;
    }

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                tags: { select: { id: true, name: true, slug: true } },
                author: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Get post by slug (admin - any status)
export async function getPostBySlug(slug: string) {
    return prisma.blogPost.findUnique({
        where: { slug },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            tags: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true } },
        },
    });
}

// Get all blog categories
export async function getBlogCategories() {
    return prisma.blogCategory.findMany({
        include: {
            _count: { select: { posts: true } },
        },
        orderBy: { name: 'asc' },
    });
}

// Get category by slug
export async function getBlogCategoryBySlug(slug: string) {
    return prisma.blogCategory.findUnique({
        where: { slug },
        include: {
            _count: { select: { posts: true } },
        },
    });
}

// Get all blog tags
export async function getBlogTags() {
    return prisma.blogTag.findMany({
        include: {
            _count: { select: { posts: true } },
        },
        orderBy: { name: 'asc' },
    });
}

// Get tag by slug
export async function getBlogTagBySlug(slug: string) {
    return prisma.blogTag.findUnique({
        where: { slug },
        include: {
            _count: { select: { posts: true } },
        },
    });
}

// Get recent posts for homepage
export async function getRecentPosts(limit = 5) {
    return prisma.blogPost.findMany({
        where: {
            status: 'PUBLISHED',
            publishedAt: { lte: new Date() },
        },
        select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            coverImage: true,
            summary: true,
            publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });
}
