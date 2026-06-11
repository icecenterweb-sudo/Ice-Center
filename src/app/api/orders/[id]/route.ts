import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

type Props = {
    params: Promise<{ id: string }>;
};

/**
 * GET /api/orders/[id] - Get single order details
 */
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json({ error: 'شناسه سفارش نامعتبر است' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: payload.userId, // Ensure user owns this order
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'خطا در دریافت سفارش' }, { status: 500 });
    }
}
