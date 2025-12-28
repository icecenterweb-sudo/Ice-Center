import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt'

export async function POST(request: NextRequest) {
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

        // Parse request body
        const { firstName, lastName } = await request.json()

        // Validate input - at least one field should be provided
        if (!firstName && !lastName) {
            return NextResponse.json(
                { error: 'حداقل یک فیلد باید ارسال شود' },
                { status: 400 }
            )
        }

        // Prepare update data
        const updateData: { firstName?: string; lastName?: string } = {}

        if (firstName !== undefined) {
            // Trim and validate
            const trimmedFirstName = String(firstName).trim()
            if (trimmedFirstName.length > 50) {
                return NextResponse.json(
                    { error: 'نام نباید بیش از ۵۰ کاراکتر باشد' },
                    { status: 400 }
                )
            }
            updateData.firstName = trimmedFirstName || null
        }

        if (lastName !== undefined) {
            const trimmedLastName = String(lastName).trim()
            if (trimmedLastName.length > 50) {
                return NextResponse.json(
                    { error: 'نام خانوادگی نباید بیش از ۵۰ کاراکتر باشد' },
                    { status: 400 }
                )
            }
            updateData.lastName = trimmedLastName || null
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: payload.userId },
            data: updateData,
            select: {
                id: true,
                phone: true,
                firstName: true,
                lastName: true,
                isVerified: true,
            },
        })

        return NextResponse.json({
            success: true,
            user,
            message: 'پروفایل با موفقیت بروزرسانی شد',
        })

    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
            { status: 500 }
        )
    }
}
