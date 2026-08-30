import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/user-auth';
import { getCartItemPrices } from '@/lib/offers/queries';
import { resolveUnitPrice } from '@/lib/offers/pricing';
import { calculateShippingCost } from '@/lib/shipping';
import { validateCouponRules } from '@/lib/coupons';
import { logSystemError } from '@/lib/error-logger';

/**
 * Thrown for user-facing order failures (e.g. insufficient stock).
 * Carries a Persian message that is safe to return to the client.
 */
class OrderError extends Error {}

/**
 * Detect a Prisma P2002 unique-constraint violation targeting the
 * orderNumber column specifically (not e.g. coupon usage constraints).
 */
function isOrderNumberCollision(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    if ((error as { code?: unknown }).code !== 'P2002') return false;
    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    const targetStr = Array.isArray(target) ? target.join(',') : String(target ?? '');
    return targetStr.includes('orderNumber');
}

/**
 * GET /api/orders?page=1&limit=20 - Get user's order history (paginated, B4)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        // B4: bound the query. Defaults keep the existing UI working
        // (it only reads `data.orders`); clients may pass page/limit.
        const { searchParams } = new URL(request.url);
        let page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || '20', 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: payload.userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    items: true,
                    _count: { select: { items: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where: { userId: payload.userId } }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        await logSystemError(error, '/api/orders [GET]', 'ERROR');
        return NextResponse.json({ error: 'خطا در دریافت سفارش‌ها' }, { status: 500 });
    }
}

/**
 * POST /api/orders - Create order from cart
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.response;
        const payload = auth.payload;

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'داده ارسالی نامعتبر است' }, { status: 400 });
        }
        const { addressId, notes, couponCode } = body;

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
            // Nullish-safe: effectivePrice 0 (100% offer) must stay 0
            const unitPrice = resolveUnitPrice(priceInfo, cartItem.product.price);
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

        // Generate a timestamp-prefixed order number.
        // Format: ICE-YYMMDD-XXXXXX — the date prefix makes support lookups
        // easy; 3 random bytes (2^24) per day keeps collisions negligible.
        const generateOrderNumber = () => {
            const d = new Date();
            const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
            return `ICE-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        };

        // Validate coupon (if provided) and compute discount server-side
        let discount = 0;
        let couponId: number | null = null;
        if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
            const normalizedCode = couponCode.trim().toUpperCase();
            const coupon = await prisma.coupon.findUnique({
                where: { code: normalizedCode },
                include: {
                    usages: {
                        where: { userId: payload.userId },
                        select: { id: true },
                    },
                },
            });

            if (!coupon) {
                return NextResponse.json({ error: 'کد تخفیف یافت نشد' }, { status: 400 });
            }

            const couponVal = validateCouponRules({
                coupon,
                userUsageCount: coupon.usages.length,
                subtotal,
            });

            if (!couponVal.valid) {
                return NextResponse.json({ error: couponVal.error || 'کد تخفیف نامعتبر است' }, { status: 400 });
            }

            discount = couponVal.discount;
            couponId = coupon.id;
        }

        // Calculate shipping cost server-side
        const shippingCost = calculateShippingCost(subtotal);

        // Create order in transaction
        const createOrderInTx = () => prisma.$transaction(async (tx) => {
            const orderNumber = generateOrderNumber();
            // Atomic coupon re-validation with row-level lock (#9)
            if (couponId) {
                const couponRows = await tx.$queryRaw<{
                    id: number;
                    code: string;
                    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
                    value: number | string;
                    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
                    startDate: Date | null;
                    endDate: Date | null;
                    usageLimit: number | null;
                    usedCount: number;
                    perUserLimit: number;
                    minOrderAmount: number | string | null;
                    maxDiscount: number | string | null;
                }[]>`
                    SELECT "id", "code", "type"::text, "value", "status"::text, "startDate", "endDate", "usageLimit", "usedCount", "perUserLimit", "minOrderAmount", "maxDiscount"
                    FROM "Coupon"
                    WHERE "id" = ${couponId}
                    FOR UPDATE
                `;
                const lockedCoupon = couponRows[0];
                if (!lockedCoupon) {
                    throw new OrderError('کد تخفیف یافت نشد');
                }
                const userUsageCount = await tx.couponUsage.count({
                    where: { couponId, userId: user.id }
                });
                const lockedValidation = validateCouponRules({
                    coupon: lockedCoupon,
                    userUsageCount,
                    subtotal,
                });
                if (!lockedValidation.valid) {
                    throw new OrderError(lockedValidation.error || 'کد تخفیف نامعتبر است');
                }
                discount = lockedValidation.discount;
            }

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
                const newStatus = updated.stock <= 0
                    ? 'OUT_OF_STOCK'
                    : updated.stock <= 5
                    ? 'LOW_STOCK'
                    : 'IN_STOCK';
                await tx.product.update({
                    where: { id: item.productId },
                    data: { inventoryStatus: newStatus },
                });
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
                    discount,
                    shippingCost,
                    total: Math.max(0, subtotal - discount + shippingCost),
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
                    message: `سفارش شما با ${newOrder.items.length} کالا و مبلغ ${Number(newOrder.total).toLocaleString('fa-IR')} تومان ثبت شد.`,
                    link: `/profile/orders/${newOrder.id}`,
                },
            });

            // Record coupon usage and increment used count
            if (couponId) {
                await tx.couponUsage.create({
                    data: {
                        couponId,
                        userId: user.id,
                        orderId: newOrder.id,
                        discount,
                    },
                });
                await tx.coupon.update({
                    where: { id: couponId },
                    data: { usedCount: { increment: 1 } },
                });
            }

            return newOrder;
        });

        // Retry the (rare) orderNumber unique-constraint collision (P2002).
        // Each retry regenerates a fresh order number inside the transaction.
        const order = await (async () => {
            for (let attempt = 1; ; attempt++) {
                try {
                    return await createOrderInTx();
                } catch (txError) {
                    if (attempt < 3 && isOrderNumberCollision(txError)) continue;
                    throw txError;
                }
            }
        })();

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: Number(order.total),
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
        await logSystemError(error, '/api/orders [POST]', 'CRITICAL');
        return NextResponse.json({ error: 'خطا در ثبت سفارش' }, { status: 500 });
    }
}
