import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt'

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

        const { productId, quantity = 1 } = await request.json()

        if (!productId || typeof productId !== 'number') {
            return NextResponse.json({ error: 'شناسه محصول نامعتبر است' }, { status: 400 })
        }

        // Check if product exists and is active
        const product = await prisma.product.findFirst({
            where: { id: productId, isActive: true }
        })

        if (!product) {
            return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 })
        }

        // Upsert: create or increment quantity
        const cartItem = await prisma.cartItem.upsert({
            where: {
                userId_productId: {
                    userId: payload.userId,
                    productId: productId
                }
            },
            update: {
                quantity: { increment: quantity }
            },
            create: {
                userId: payload.userId,
                productId: productId,
                quantity: quantity
            },
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
                    }
                }
            }
        })

        return NextResponse.json({ item: cartItem })
    } catch (error) {
        console.error('Cart add error:', error)
        return NextResponse.json({ error: 'خطا در افزودن به سبد خرید' }, { status: 500 })
    }
}
