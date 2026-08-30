import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/user-auth';

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

        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

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
