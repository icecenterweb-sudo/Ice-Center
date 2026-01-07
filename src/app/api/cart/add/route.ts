import { NextRequest, NextResponse, connection } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt'

// Validation constants
const MAX_QUANTITY_PER_ITEM = 100;

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

        const { productId, quantity = 1 } = await request.json()

        // Validate productId
        if (!productId || typeof productId !== 'number' || !Number.isInteger(productId) || productId < 1) {
            return NextResponse.json({ error: 'شناسه محصول نامعتبر است' }, { status: 400 })
        }

        // Validate quantity
        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
            return NextResponse.json({
                error: `تعداد باید بین ۱ تا ${MAX_QUANTITY_PER_ITEM} باشد`
            }, { status: 400 })
        }

        // Check if product exists and is active
        const product = await prisma.product.findFirst({
            where: { id: productId, isActive: true },
            select: { id: true, stock: true, name: true }
        })

        if (!product) {
            return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 })
        }

        // Get existing cart item to check total quantity
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                userId_productId: {
                    userId: payload.userId,
                    productId: productId
                }
            }
        })

        const currentQuantity = existingItem?.quantity || 0
        const newTotalQuantity = currentQuantity + quantity

        // Stock validation
        if (product.stock <= 0) {
            return NextResponse.json({
                error: 'این محصول در حال حاضر موجود نیست'
            }, { status: 400 })
        }

        if (newTotalQuantity > product.stock) {
            const canAdd = product.stock - currentQuantity
            if (canAdd <= 0) {
                return NextResponse.json({
                    error: `شما قبلاً حداکثر موجودی (${product.stock} عدد) را به سبد اضافه کردید`
                }, { status: 400 })
            }
            return NextResponse.json({
                error: `حداکثر ${canAdd} عدد دیگر می‌توانید اضافه کنید (موجودی: ${product.stock})`
            }, { status: 400 })
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
