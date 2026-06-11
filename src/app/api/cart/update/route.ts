import { NextRequest, NextResponse, connection } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/jwt'

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

        const { productId, quantity } = await request.json()

        if (!productId || typeof productId !== 'number') {
            return NextResponse.json({ error: 'شناسه محصول نامعتبر است' }, { status: 400 })
        }

        if (typeof quantity !== 'number' || quantity < 1) {
            return NextResponse.json({ error: 'تعداد نامعتبر است' }, { status: 400 })
        }

        const cartItem = await prisma.cartItem.update({
            where: {
                userId_productId: {
                    userId: payload.userId,
                    productId: productId
                }
            },
            data: { quantity },
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
        console.error('Cart update error:', error)
        return NextResponse.json({ error: 'خطا در بروزرسانی سبد خرید' }, { status: 500 })
    }
}
