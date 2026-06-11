import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://icecenter.ir'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/categories`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ]

    // Product pages
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
    })

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    // Category pages
    const categories = await prisma.category.findMany({
        select: { slug: true, updatedAt: true },
    })

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // Blog posts
    const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
    })

    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...categoryPages, ...blogPages]
}
