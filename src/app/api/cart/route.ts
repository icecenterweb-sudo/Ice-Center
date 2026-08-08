import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/jwt'
import { connection } from 'next/server'
import { getCartItemPrices } from '@/lib/offers/queries';

export async function GET() {
    await connection(); // Required for cookies() with cacheComponents
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(USER_TOKEN_COOKIE)?.value

        if (!token) {
            return NextResponse.json({ items: [] })
        }

        const payload = await verifyUserToken(token)
        if (!payload || !payload.userId) {
            return NextResponse.json({ items: [] })
        }

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
                    price: priceInfo ? priceInfo.effectivePrice : item.product.price,
                }
            };
        });

        return NextResponse.json({ items: updatedCartItems })
    } catch (error) {
        console.error('Cart fetch error:', error)
        return NextResponse.json({ error: 'خطا در دریافت سبد خرید' }, { status: 500 })
    }
}

export async function DELETE() {
    await connection();
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;

        if (!token) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const payload = await verifyUserToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const deleted = await prisma.cartItem.deleteMany({
            where: { userId: payload.userId },
        });

        return NextResponse.json({ success: true, count: deleted.count });
    } catch (error) {
        console.error('Cart clear error:', error);
        return NextResponse.json({ error: 'خطا در پاکسازی سبد خرید' }, { status: 500 });
    }
}
