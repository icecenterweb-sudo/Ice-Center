import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/user-jwt';
import { cookies } from 'next/headers';

/**
 * GET /api/orders - Get user's order history
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: payload.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                _count: { select: { items: true } },
            },
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'خطا در دریافت سفارش‌ها' }, { status: 500 });
    }
}

/**
 * POST /api/orders - Create order from cart
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 });
        }

        const payload = await verifyUserToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
        }

        const body = await request.json();
        const { addressId, notes } = body;

        // Get user with address
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
                addresses: addressId ? { where: { id: addressId } } : { where: { isDefault: true } },
                cartItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                price: true,
                                listPrice: true,
                                thumbnail: true,
                                inventoryStatus: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
        }

        if (user.cartItems.length === 0) {
            return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });
        }

        const address = user.addresses[0];
        if (!address) {
            return NextResponse.json({ error: 'لطفا یک آدرس انتخاب کنید' }, { status: 400 });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = user.cartItems.map((cartItem) => {
            const unitPrice = cartItem.product.price;
            const totalPrice = unitPrice * cartItem.quantity;
            subtotal += totalPrice;

            return {
                productId: cartItem.product.id,
                productName: cartItem.product.name,
                productSku: cartItem.product.sku,
                thumbnail: cartItem.product.thumbnail,
                quantity: cartItem.quantity,
                unitPrice,
                totalPrice,
            };
        });

        // Generate unique order number
        const orderNumber = `ICE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Create order in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId: user.id,
                    customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'مشتری',
                    customerPhone: user.phone,
                    shippingAddress: address.address,
                    shippingCity: address.city,
                    shippingProvince: address.province,
                    postalCode: address.postalCode,
                    subtotal,
                    discount: 0, // TODO: Apply coupon/discount
                    shippingCost: 0, // TODO: Calculate shipping
                    total: subtotal,
                    notes,
                    status: 'PENDING',
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: true,
                },
            });

            // Clear cart
            await tx.cartItem.deleteMany({
                where: { userId: user.id },
            });

            return newOrder;
        });

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: order.total,
                status: order.status,
                itemCount: order.items.length,
            },
            message: 'سفارش با موفقیت ثبت شد',
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'خطا در ثبت سفارش' }, { status: 500 });
    }
}
