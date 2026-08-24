import { NextRequest, NextResponse, connection } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/jwt'
import { getCartItemPrices } from '@/lib/offers/queries';

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

        const { items } = await request.json() as { items: LocalCartItem[] }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'فرمت داده نامعتبر است' }, { status: 400 })
        }

        // Process each item from local storage
        for (const item of items) {
            if (!item.productId || typeof item.productId !== 'number') continue
            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) continue

            // Check if product exists and is active
            const product = await prisma.product.findFirst({
                where: { id: item.productId, isActive: true },
                select: { id: true, stock: true }
            })

            if (!product) continue

            // Validate stock: skip if out of stock
            if (product.stock <= 0) continue

            // Fetch existing cart item to cap total merged quantity to available stock (#21)
            const existingCartItem = await prisma.cartItem.findUnique({
                where: {
                    userId_productId: {
                        userId: payload.userId,
                        productId: item.productId,
                    }
                },
                select: { quantity: true }
            });

            const currentQty = existingCartItem?.quantity ?? 0;
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
