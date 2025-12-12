import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateAdminToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json()

        // Validate input
        if (!phone || !otp) {
            return NextResponse.json(
                { error: 'Phone and OTP are required' },
                { status: 400 }
            )
        }

        // Static OTP validation for MVP
        if (otp !== '1234') {
            return NextResponse.json(
                { error: 'Invalid OTP code' },
                { status: 401 }
            )
        }

        // Check if admin exists
        const admin = await prisma.admin.findUnique({
            where: { phone },
        })

        if (!admin) {
            return NextResponse.json(
                { error: 'Admin not found' },
                { status: 404 }
            )
        }

        // Check if admin is active
        if (admin.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Admin account is blocked' },
                { status: 403 }
            )
        }

        // Generate JWT token
        const token = await generateAdminToken({
            adminId: admin.id,
            phone: admin.phone,
            role: admin.role,
        })

        // Create response
        const response = NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                phone: admin.phone,
                role: admin.role,
            },
        })

        // Set httpOnly cookie
        const isProduction = process.env.NODE_ENV === 'production'
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
