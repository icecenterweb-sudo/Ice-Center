/**
 * Categories API
 * GET - Fetch all categories with subcategories
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const withSubs = searchParams.get('withSubs') === 'true';

        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                ...(withSubs && {
                    subcategories: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                        orderBy: { name: 'asc' as const },
                    },
                }),
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت دسته‌بندی‌ها' },
            { status: 500 }
        );
    }
}
