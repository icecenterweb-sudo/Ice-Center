import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getProductsCached, invalidateProductsCache } from '@/lib/cache/products';

export const runtime = 'nodejs';

// GET - دریافت محصولات با کشینگ، صفحه‌بندی و جستجو
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;

    // Get products with caching
    const { products, total, fromCache } = await getProductsCached({
      page,
      limit,
      search,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      meta: {
        fromCache,
      },
    });
  } catch (error) {
    console.error('خطا در دریافت محصولات:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت محصولات'
    }, { status: 500 });
  }
}

// POST - ساخت محصول جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: body
    });

    // Invalidate products cache after creating new product
    await invalidateProductsCache();

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('خطا در ساخت محصول:', error);
    const message = error instanceof Error ? error.message : 'خطا در ساخت محصول';
    return NextResponse.json({
      success: false,
      message
    }, { status: 400 });
  }
}
