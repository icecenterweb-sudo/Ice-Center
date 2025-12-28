import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt'

interface LocalCartItem {
    productId: number
    quantity: number
}

export async function POST(request: NextRequest) {
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

            // Check if product exists
            const product = await prisma.product.findFirst({
                where: { id: item.productId, isActive: true }
            })

            if (!product) continue

            // Upsert: if exists, add to quantity; if not, create
            await prisma.cartItem.upsert({
                where: {
                    userId_productId: {
                        userId: payload.userId,
                        productId: item.productId
                    }
                },
                update: {
                    quantity: { increment: item.quantity }
                },
                create: {
                    userId: payload.userId,
                    productId: item.productId,
                    quantity: item.quantity
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

        return NextResponse.json({ items: cartItems })
    } catch (error) {
        console.error('Cart sync error:', error)
        return NextResponse.json({ error: 'خطا در همگام‌سازی سبد خرید' }, { status: 500 })
    }
}
