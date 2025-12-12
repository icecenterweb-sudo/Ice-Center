import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    // Create response
    const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully',
    })

    // Delete the admin_token cookie
    response.cookies.delete('admin_token')

    return response
}
