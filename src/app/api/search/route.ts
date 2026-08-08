/**
 * Search API
 * GET - Search products by query with rate limiting and caps
 */

import { NextRequest, NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { recordAnalyticsEvent } from '@/lib/analytics';

// Search limits
const MAX_SEARCH_RESULTS = 20;
const DEFAULT_SEARCH_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
    await connection(); // Required for request.url with cacheComponents
    try {
        // Rate limiting for search (stricter than regular list)
        const clientIp = getClientIp(request);
        const rateLimit = await checkRateLimit(`search:${clientIp}`, RATE_LIMITS.normal);

        if (!rateLimit.allowed) {
            return NextResponse.json({
                success: false,
                error: `تعداد درخواست زیاد است. ${rateLimit.resetIn} ثانیه صبر کنید.`
            }, {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    'X-RateLimit-Reset': rateLimit.resetIn.toString(),
                }
            });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        let limit = parseInt(searchParams.get('limit') || String(DEFAULT_SEARCH_LIMIT));

        // Validate and cap limit
        if (isNaN(limit) || limit < 1) limit = DEFAULT_SEARCH_LIMIT;
        if (limit > MAX_SEARCH_RESULTS) limit = MAX_SEARCH_RESULTS;

        // Validate query
        const trimmedQuery = query.trim();
        if (!trimmedQuery || trimmedQuery.length < MIN_QUERY_LENGTH) {
            return NextResponse.json({
                success: true,
                products: [],
                categories: [],
            });
        }

        // Truncate query if too long
        const sanitizedQuery = trimmedQuery.slice(0, MAX_QUERY_LENGTH);

        // Search products - matching name, slug, brand, model, description, tags, keywords
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { slug: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { brand: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { model: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { description: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { tags: { has: sanitizedQuery } },
                    { keywords: { has: sanitizedQuery } },
                ],
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                thumbnail: true,  // Use thumbnail instead of all images
            },
            take: limit,
            orderBy: { name: 'asc' },
        });

        // Search categories
        const categories = await prisma.category.findMany({
            where: {
                name: { contains: sanitizedQuery, mode: 'insensitive' },
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
            take: 3,
        });

        // Transform products
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.thumbnail,
        }));

        // Record search event in background
        recordAnalyticsEvent({
            type: 'SEARCH',
            request,
            path: `/api/search?q=${encodeURIComponent(sanitizedQuery)}`,
            searchQuery: sanitizedQuery,
            searchResultCount: products.length,
        }).catch(err => console.error('[Analytics] Search log error:', err));

        return NextResponse.json({
            success: true,
            products: transformedProducts,
            categories,
        }, {
            headers: {
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در جستجو' },
            { status: 500 }
        );
    }
}
