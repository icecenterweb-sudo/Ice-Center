import { NextResponse } from 'next/server'
import { USER_TOKEN_COOKIE } from '@/lib/jwt'

export async function POST() {
    try {
        const response = NextResponse.json({
            success: true,
            message: 'با موفقیت خارج شدید',
        })

        // Clear the user token cookie
        response.cookies.set(USER_TOKEN_COOKIE, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expire immediately
            path: '/',
        })

        return response

    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        )
    }
}
