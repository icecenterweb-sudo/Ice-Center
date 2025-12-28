import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt'

export async function GET(request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get(USER_TOKEN_COOKIE)?.value

        if (!token) {
            return NextResponse.json(
                { error: 'وارد حساب کاربری خود شوید' },
                { status: 401 }
            )
        }

        // Verify token
        const payload = await verifyUserToken(token)

        if (!payload) {
            return NextResponse.json(
                { error: 'نشست نامعتبر است. لطفاً دوباره وارد شوید' },
                { status: 401 }
            )
        }

        // Fetch current user data
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                phone: true,
                firstName: true,
                lastName: true,
                isVerified: true,
                status: true,
                createdAt: true,
                addresses: {
                    select: {
                        id: true,
                        city: true,
                        province: true,
                        address: true,
                        postalCode: true,
                        isDefault: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        // Check if user is blocked
        if (user.status === 'BLOCKED') {
            return NextResponse.json(
                { error: 'حساب کاربری شما مسدود شده است' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            success: true,
            user,
        })

    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        )
    }
}
