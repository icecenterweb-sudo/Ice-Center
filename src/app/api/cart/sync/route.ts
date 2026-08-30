import { NextRequest, NextResponse, connection } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/jwt'
import { getCartItemPrices } from '@/lib/offers/queries';
import { MAX_SYNC_ITEMS } from '@/lib/constants';

interface LocalCartItem {
    productId: number
    quantity: number
}

export async function POST(request: NextRequest) {
    await connection(); // Required for cookies() with cacheComponents
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(USER_TOKEN_COOKIE)?.value

        if (!token) {
            return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
        }

        const payload = await verifyUserToken(token)
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
        }

        const { items } = await request.json().catch(() => ({})) as { items?: LocalCartItem[] }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'فرمت داده نامعتبر است' }, { status: 400 })
        }

        // Hard cap: prevent resource exhaustion from oversized payloads
        if (items.length > MAX_SYNC_ITEMS) {
            return NextResponse.json(
                { error: `حداکثر ${MAX_SYNC_ITEMS} قلم قابل همگام‌سازی است` },
                { status: 400 }
            );
        }

        // Batch-fetch all valid, active products in ONE query instead of
        // per-item findFirst round-trips
        const syncProductIds = [...new Set(
            items
                .filter(item => item.productId && typeof item.productId === 'number')
                .map(item => item.productId)
        )];

        const products = syncProductIds.length > 0
            ? await prisma.product.findMany({
                where: { id: { in: syncProductIds }, isActive: true },
                select: { id: true, stock: true },
            })
            : [];
        const productMap = new Map(products.map(p => [p.id, p]));

        // Batch-fetch existing cart quantities for this user in ONE query
        const existingCartItems = syncProductIds.length > 0
            ? await prisma.cartItem.findMany({
                where: { userId: payload.userId, productId: { in: syncProductIds } },
                select: { productId: true, quantity: true },
            })
            : [];
        const existingQtyMap = new Map(existingCartItems.map(c => [c.productId, c.quantity]));

        // Process each item from local storage
        for (const item of items) {
            if (!item.productId || typeof item.productId !== 'number') continue
            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) continue

            const product = productMap.get(item.productId);
            if (!product) continue;

            // Validate stock: skip if out of stock
            if (product.stock <= 0) continue

            // Cap total merged quantity to available stock (#21)
            const currentQty = existingQtyMap.get(item.productId) ?? 0;
            const newQty = Math.min(currentQty + item.quantity, product.stock);

            if (newQty <= 0) continue;

            // Upsert: set total merged quantity capped by available stock
            await prisma.cartItem.upsert({
                where: {
                    userId_productId: {
                        userId: payload.userId,
                        productId: item.productId
                    }
                },
                update: {
                    quantity: newQty
                },
                create: {
                    userId: payload.userId,
                    productId: item.productId,
                    quantity: newQty
                }
            })
        }

        // Return updated cart
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: payload.userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        listPrice: true,
                        thumbnail: true,
                        stock: true,
                        inventoryStatus: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const productIds = cartItems.map(item => item.productId);
        const freshPrices = await getCartItemPrices(productIds);
        const updatedCartItems = cartItems.map(item => {
            const priceInfo = freshPrices.find(p => p.productId === item.productId);
            return {
                ...item,
                product: {
                    ...item.product,
                    price: priceInfo ? priceInfo.effectivePrice : Number(item.product.price),
                    listPrice: item.product.listPrice ? Number(item.product.listPrice) : null,
                }
            };
        });

        return NextResponse.json({ items: updatedCartItems })
    } catch (error) {
        console.error('Cart sync error:', error)
        return NextResponse.json({ error: 'خطا در همگام‌سازی سبد خرید' }, { status: 500 })
    }
}
