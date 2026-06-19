import { NextRequest, NextResponse, connection } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/jwt'

export async function DELETE(request: NextRequest) {
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

        const { productId } = await request.json()

        if (!productId || typeof productId !== 'number') {
            return NextResponse.json({ error: 'شناسه محصول نامعتبر است' }, { status: 400 })
        }

        // Use deleteMany to avoid error if item doesn't exist
        const result = await prisma.cartItem.deleteMany({
            where: {
                userId: payload.userId,
                productId: productId
            }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'آیتم در سبد خرید یافت نشد' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Cart remove error:', error)
        return NextResponse.json({ error: 'خطا در حذف از سبد خرید' }, { status: 500 })
    }
}
