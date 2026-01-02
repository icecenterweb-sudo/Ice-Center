/**
 * Search API
 * GET - Search products by query
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '5');

        if (!query.trim() || query.length < 2) {
            return NextResponse.json({
                success: true,
                products: [],
                categories: [],
            });
        }

        // Search products
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
            },
            take: limit,
            orderBy: { name: 'asc' },
        });

        // Search categories
        const categories = await prisma.category.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
            take: 3,
        });

        // Transform products to include first image
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.images && product.images.length > 0
                ? product.images[0]
                : null,
        }));

        return NextResponse.json({
            success: true,
            products: transformedProducts,
            categories,
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در جستجو' },
            { status: 500 }
        );
    }
}
