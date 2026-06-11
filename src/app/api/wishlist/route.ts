import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

/**
 * GET /api/wishlist - Get user's wishlist
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId: payload.userId },
            orderBy: { createdAt: 'desc' },
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
                product: item.product,
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
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'شناسه محصول الزامی است' }, { status: 400 });
        }

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
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

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
