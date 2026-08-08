import { NextRequest, NextResponse } from 'next/server'
import { connection } from 'next/server'
import { prisma } from '@/lib/db'
import {
    verifyUserToken,
    USER_TOKEN_COOKIE,
    generateAdminToken,
    verifyAdminToken,
    ADMIN_TOKEN_COOKIE,
    getAdminTokenCookieOptionsForRequest,
} from '@/lib/jwt'

export async function GET(request: NextRequest) {
    try {
        // Signal this is a dynamic route (prevents prerender warning)
        await connection()

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

        // Check if user is an active Admin
        const admin = await prisma.admin.findUnique({
            where: { phone: user.phone },
            select: { id: true, phone: true, roles: true, status: true }
        });

        const isAdmin = !!(admin && admin.status === 'ACTIVE');
        const adminRoles = isAdmin ? admin.roles : [];

        const response = NextResponse.json({
            success: true,
            user: {
                ...user,
                isAdmin,
                adminRoles,
            },
        });

        // Single Sign-On: If user is an active admin, ensure ADMIN_TOKEN_COOKIE is set
        if (isAdmin && admin) {
            const existingAdminToken = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
            let needsNewToken = true;
            if (existingAdminToken) {
                const verified = await verifyAdminToken(existingAdminToken);
                if (verified) needsNewToken = false;
            }

            if (needsNewToken) {
                const primaryRole = admin.roles[0] || 'ADMIN';
                const adminToken = await generateAdminToken({
                    adminId: admin.id,
                    phone: admin.phone,
                    role: primaryRole,
                    roles: admin.roles,
                });

                response.cookies.set(
                    ADMIN_TOKEN_COOKIE,
                    adminToken,
                    getAdminTokenCookieOptionsForRequest(request)
                );
            }
        }

        return response;

    } catch (error) {
        // Handle prerender interruption gracefully (expected during build)
        if (error instanceof Error &&
            (error.message.includes('prerender') ||
                (error as { digest?: string }).digest === 'NEXT_PRERENDER_INTERRUPTED')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        )
    }
}
