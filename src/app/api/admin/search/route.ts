import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
        return auth.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const trimmed = query.trim()

        if (!trimmed || trimmed.length < 2) {
            return NextResponse.json({
                products: [],
                orders: [],
                users: [],
                posts: [],
                categories: [],
            })
        }

        const [products, orders, users, posts, categories] = await Promise.all([
            // 1. Search products
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: trimmed, mode: 'insensitive' } },
                        { brand: { contains: trimmed, mode: 'insensitive' } },
                        { sku: { contains: trimmed, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, price: true, slug: true, thumbnail: true },
                take: 5,
            }),

            // 2. Search orders
            prisma.order.findMany({
                where: {
                    OR: [
                        { orderNumber: { contains: trimmed, mode: 'insensitive' } },
                        { customerName: { contains: trimmed, mode: 'insensitive' } },
                        { customerPhone: { contains: trimmed, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, orderNumber: true, customerName: true, total: true, status: true },
                take: 5,
            }),

            // 3. Search users
            prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: trimmed, mode: 'insensitive' } },
                        { lastName: { contains: trimmed, mode: 'insensitive' } },
                        { phone: { contains: trimmed, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, phone: true },
                take: 5,
            }),

            // 4. Search blog posts
            prisma.blogPost.findMany({
                where: {
                    title: { contains: trimmed, mode: 'insensitive' },
                },
                select: { id: true, title: true, slug: true },
                take: 5,
            }),

            // 5. Search categories
            prisma.category.findMany({
                where: {
                    name: { contains: trimmed, mode: 'insensitive' },
                },
                select: { id: true, name: true, slug: true },
                take: 5,
            }),
        ])

        return NextResponse.json({
            products,
            orders,
            users,
            posts,
            categories,
        })
    } catch (error) {
        console.error('[AdminSearch] Failed to execute global search:', error)
        return NextResponse.json({ error: 'خطا در اجرای جستجو' }, { status: 500 })
    }
}
