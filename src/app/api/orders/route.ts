import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUserToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { getCartItemPrices } from '@/lib/offers/queries';

/**
 * Thrown for user-facing order failures (e.g. insufficient stock).
 * Carries a Persian message that is safe to return to the client.
 */
class OrderError extends Error {}

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

        // Calculate totals with active offers
        const cartPrices = await getCartItemPrices(user.cartItems.map(c => c.productId));
        let subtotal = 0;
        const orderItems = user.cartItems.map((cartItem) => {
            const priceInfo = cartPrices.find(p => p.productId === cartItem.product.id);
            const unitPrice = priceInfo?.effectivePrice || cartItem.product.price;
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
            // Re-check stock atomically and decrement. Locking each row
            // (FOR UPDATE) prevents two concurrent checkouts from overselling.
            // Acquire locks in a deterministic (id-sorted) order so two
            // concurrent checkouts sharing the same products can't deadlock.
            const lockOrder = [...orderItems].sort((a, b) => a.productId - b.productId);
            for (const item of lockOrder) {
                const rows = await tx.$queryRaw<{ stock: number; name: string }[]>`
                    SELECT "stock", "name" FROM "Product" WHERE "id" = ${item.productId} FOR UPDATE
                `;
                const current = rows[0];
                if (!current) {
                    throw new OrderError(`محصول «${item.productName}» یافت نشد`);
                }
                if (current.stock < item.quantity) {
                    throw new OrderError(
                        `موجودی «${current.name}» کافی نیست (موجودی: ${current.stock})`
                    );
                }
            }

            // Decrement stock and flip inventory status when it hits zero.
            for (const item of lockOrder) {
                const updated = await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                    select: { stock: true },
                });
                if (updated.stock <= 0) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { inventoryStatus: 'OUT_OF_STOCK' },
                    });
                }
            }

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

            // Create notification for user
            await tx.notification.create({
                data: {
                    userId: user.id,
                    type: 'ORDER',
                    title: `سفارش ${orderNumber} ثبت شد`,
                    message: `سفارش شما با ${newOrder.items.length} کالا و مبلغ ${subtotal.toLocaleString('fa-IR')} تومان ثبت شد.`,
                    link: `/profile/orders/${newOrder.id}`,
                },
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
        // Surface user-facing failures (e.g. insufficient stock) with their message
        if (error instanceof OrderError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'خطا در ثبت سفارش' }, { status: 500 });
    }
}
