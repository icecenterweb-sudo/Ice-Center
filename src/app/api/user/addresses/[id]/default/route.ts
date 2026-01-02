import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// PUT - Set address as default
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const addressId = parseInt(id);

        if (isNaN(addressId)) {
            return NextResponse.json(
                { error: 'شناسه آدرس نامعتبر است' },
                { status: 400 }
            );
        }

        const token = request.cookies.get(USER_TOKEN_COOKIE)?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'وارد حساب کاربری خود شوید' },
                { status: 401 }
            );
        }

        const payload = await verifyUserToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'نشست نامعتبر است' },
                { status: 401 }
            );
        }

        // Check if address belongs to user
        const address = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId: payload.userId,
            },
        });

        if (!address) {
            return NextResponse.json(
                { error: 'آدرس یافت نشد' },
                { status: 404 }
            );
        }

        // Unset all other defaults
        await prisma.address.updateMany({
            where: { userId: payload.userId },
            data: { isDefault: false },
        });

        // Set this address as default
        await prisma.address.update({
            where: { id: addressId },
            data: { isDefault: true },
        });

        return NextResponse.json({
            success: true,
            message: 'آدرس پیش‌فرض تغییر کرد',
        });
    } catch (error) {
        console.error('Set default address error:', error);
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        );
    }
}
