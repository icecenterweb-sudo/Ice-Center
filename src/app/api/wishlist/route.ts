import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/user-auth';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

const addToWishlistSchema = z.object({
    productId: z.number().int().positive(),
});

/**
 * GET /api/wishlist - Get user's wishlist
 */
export async function GET() {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId: payload.userId },
            orderBy: { createdAt: 'desc' },
            take: 100, // Cap: prevent unbounded fetch
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        listPrice: true,
                        thumbnail: true,
                        inventoryStatus: true,
                    },
                },
            },
        });

        return NextResponse.json({
            items: wishlistItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                createdAt: item.createdAt,
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                    listPrice: item.product.listPrice ? Number(item.product.listPrice) : null,
                },
            })),
            count: wishlistItems.length,
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return NextResponse.json({ error: 'خطا در دریافت لیست علاقه‌مندی' }, { status: 500 });
    }
}

/**
 * POST /api/wishlist - Add product to wishlist
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        // Rate limit per user
        const rateLimit = await checkRateLimit(`wishlist:${payload.userId}`, RATE_LIMITS.normal);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'درخواست‌های بیش از حد. کمی بعد تلاش کنید' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const validation = addToWishlistSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { productId } = validation.data;

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
        }

        // Check if already in wishlist
        const existing = await prisma.wishlistItem.findUnique({
            where: {
                userId_productId: {
                    userId: payload.userId,
                    productId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({
                message: 'محصول قبلا به لیست علاقه‌مندی اضافه شده',
                alreadyExists: true
            });
        }

        // Add to wishlist
        const wishlistItem = await prisma.wishlistItem.create({
            data: {
                userId: payload.userId,
                productId,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'به لیست علاقه‌مندی اضافه شد',
            item: wishlistItem,
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return NextResponse.json({ error: 'خطا در افزودن به لیست علاقه‌مندی' }, { status: 500 });
    }
}

/**
 * DELETE /api/wishlist - Remove product from wishlist
 */
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        const { searchParams } = new URL(request.url);
        const productId = parseInt(searchParams.get('productId') || '');

        if (isNaN(productId)) {
            return NextResponse.json({ error: 'شناسه محصول نامعتبر است' }, { status: 400 });
        }

        // Remove from wishlist
        await prisma.wishlistItem.deleteMany({
            where: {
                userId: payload.userId,
                productId,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'از لیست علاقه‌مندی حذف شد',
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return NextResponse.json({ error: 'خطا در حذف از لیست علاقه‌مندی' }, { status: 500 });
    }
}
