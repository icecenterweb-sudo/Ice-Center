import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken, USER_TOKEN_COOKIE } from '@/lib/user-jwt';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// DELETE - Delete address
export async function DELETE(request: NextRequest, context: RouteContext) {
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

        await prisma.address.delete({
            where: { id: addressId },
        });

        // If deleted address was default, set another as default
        if (address.isDefault) {
            const firstAddress = await prisma.address.findFirst({
                where: { userId: payload.userId },
                orderBy: { createdAt: 'asc' },
            });

            if (firstAddress) {
                await prisma.address.update({
                    where: { id: firstAddress.id },
                    data: { isDefault: true },
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'آدرس حذف شد',
        });
    } catch (error) {
        console.error('Delete address error:', error);
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        );
    }
}
