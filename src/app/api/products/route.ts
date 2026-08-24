import { NextRequest, NextResponse, connection } from 'next/server';
import prisma from '@/lib/db';
import { getProductsCached } from '@/lib/cache/products';
import { invalidateProductCache } from '@/lib/cache/invalidation';
import { requireRole } from '@/lib/admin-auth';
import { z } from 'zod';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';

// Pagination constraints
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MIN_PAGE = 1;

// Validation schema for product creation
const productSchema = z.object({
  name: z.string().min(1, 'نام محصول الزامی است').max(200),
  slug: z.string().min(1).max(200),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  price: z.number().positive('قیمت باید مثبت باشد'),
  listPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  subcategoryId: z.number().int().optional().nullable(),
  images: z.array(z.string()).default([]),
  thumbnail: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  warranty: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
}).strict();

// GET - دریافت محصولات با کشینگ، صفحه‌بندی و جستجو
export async function GET(request: NextRequest) {
  await connection(); // Required for request.url with cacheComponents
  try {
    // Rate limiting for unauthenticated list requests
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`products:list:${clientIp}`, RATE_LIMITS.normal);

    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: `تعداد درخواست زیاد است. ${rateLimit.resetIn} ثانیه صبر کنید.`
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetIn.toString(),
        }
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const search = searchParams.get('search') || undefined;

    // Enforce pagination constraints
    if (isNaN(page) || page < MIN_PAGE) page = MIN_PAGE;
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

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
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
    });
  } catch (error) {
    console.error('خطا در دریافت محصولات:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت محصولات'
    }, { status: 500 });
  }
}

// POST - ساخت محصول جدید (Admin only)
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Verify admin authentication (DB-backed check)
    const auth = await requireRole(request, 'PRODUCTS');
    if (!auth.ok) {
      return auth.response;
    }

    // Validate input with zod schema
    const body = await request.json();
    const validationResult = productSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: validationResult.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    const product = await prisma.product.create({
      data: validatedData
    });

    // Invalidate products cache after creating new product (#5, #6, B2)
    await invalidateProductCache({
      id: product.id,
      slug: product.slug,
      subcategoryId: product.subcategoryId,
    });

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
