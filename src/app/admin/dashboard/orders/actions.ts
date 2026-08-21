'use server';

import { prisma } from '@/lib/db';
import { OrderStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { notifyOrderStatusChange } from '@/lib/notifications';
import { requireAdminAction, requireRoleAction } from '@/lib/admin-auth';
import { recordAudit } from '@/lib/audit';

export async function getOrders({
    page = 1,
    limit = 10,
    status,
    search,
}: {
    page?: number;
    limit?: number;
    status?: OrderStatus | 'ALL';
    search?: string;
} = {}) {
    await requireRoleAction('ORDERS');
    try {
        const where: Prisma.OrderWhereInput = {};

        // Filter by status
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Search by order number, customer name, or phone
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    items: {
                        take: 3, // Preview items
                    },
                    _count: {
                        select: { items: true }
                    }
                },
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalOrders: total,
        };
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
    }
}

export async function getOrderDetails(id: number) {
    await requireRoleAction('ORDERS');
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    }
                }
            },
        });

        if (!order) {
            return { error: 'Order not found' };
        }

        return { order };
    } catch (error) {
        console.error('Error fetching order details:', error);
        return { error: 'Failed to fetch order details' };
    }
}

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
    try {
        const admin = await requireRoleAction('ORDERS');
        // Build timestamp updates based on new status
        const timestampUpdates: Record<string, Date> = {};
        const now = new Date();

        switch (status) {
            case 'PAID':
                timestampUpdates.paidAt = now;
                break;
            case 'AWAITING_CONFIRMATION':
                timestampUpdates.confirmedAt = now;
                break;
            case 'PREPARING':
            case 'PROCESSING':
                timestampUpdates.preparingAt = now;
                break;
            case 'READY_FOR_DELIVERY':
                timestampUpdates.readyAt = now;
                break;
            case 'SHIPPED':
                timestampUpdates.shippedAt = now;
                break;
            case 'HANDED_TO_CARRIER':
                timestampUpdates.handedToCarrierAt = now;
                break;
            case 'DELIVERED':
                timestampUpdates.deliveredAt = now;
                break;
            case 'RETURNED':
                timestampUpdates.returnedAt = now;
                break;
            case 'CANCELLED':
                timestampUpdates.cancelledAt = now;
                break;
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...timestampUpdates,
            },
            select: { id: true, orderNumber: true, userId: true },
        });

        // Record Audit log
        await recordAudit(admin.adminId, "ORDER_STATUS_UPDATE", "Order", order.id, `تغییر وضعیت سفارش ${order.orderNumber} به ${status}`);

        // Record PAYMENT_SUCCESS event if paid
        if (status === 'PAID') {
            const analyticsEventClient = prisma.analyticsEvent;
            if (analyticsEventClient) {
                // Find original source/medium from ORDER_SUBMIT event for attribution
                const originalEvent = await analyticsEventClient.findFirst({
                    where: { orderId: order.id, type: 'ORDER_SUBMIT' },
                    select: { source: true, medium: true }
                }).catch(() => null);

                await analyticsEventClient.create({
                    data: {
                        type: 'PAYMENT_SUCCESS',
                        orderId: order.id,
                        userId: order.userId,
                        source: originalEvent?.source || 'direct',
                        medium: originalEvent?.medium || 'direct',
                        path: `/admin/dashboard/orders/${order.id}`,
                    }
                }).catch((err: unknown) => console.error('[Analytics] Failed to log PAYMENT_SUCCESS:', err));
            }
        }

        // Non-blocking: send notification to user
        notifyOrderStatusChange(order.userId, order.id, order.orderNumber, status).catch(console.error);

        revalidatePath('/admin/dashboard/orders');
        revalidatePath(`/admin/dashboard/orders/${orderId}`);

        return { success: true };
    } catch (error) {
        console.error('Error updating order status:', error);
        return { error: 'Failed to update order status' };
    }
}

export async function updateAdminNotes(orderId: number, notes: string) {
    try {
        const admin = await requireRoleAction('ORDERS');
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { adminNotes: notes },
            select: { id: true, orderNumber: true },
        });

        // Record Audit log
        await recordAudit(admin.adminId, "ORDER_NOTES_UPDATE", "Order", order.id, `بروزرسانی یادداشت ادمین برای سفارش ${order.orderNumber}`);

        revalidatePath(`/admin/dashboard/orders/${orderId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating admin notes:', error);
        return { error: 'Failed to update notes' };
    }
}

export async function bulkUpdateOrdersStatusAction(orderIds: number[], status: OrderStatus) {
    try {
        const admin = await requireRoleAction('ORDERS');
        
        if (!orderIds || orderIds.length === 0) {
            throw new Error('هیچ سفارشی انتخاب نشده است.');
        }

        const now = new Date();
        const timestampUpdates: Record<string, Date> = {};

        switch (status) {
            case 'PAID':
                timestampUpdates.paidAt = now;
                break;
            case 'AWAITING_CONFIRMATION':
                timestampUpdates.confirmedAt = now;
                break;
            case 'PREPARING':
            case 'PROCESSING':
                timestampUpdates.preparingAt = now;
                break;
            case 'READY_FOR_DELIVERY':
                timestampUpdates.readyAt = now;
                break;
            case 'SHIPPED':
                timestampUpdates.shippedAt = now;
                break;
            case 'HANDED_TO_CARRIER':
                timestampUpdates.handedToCarrierAt = now;
                break;
            case 'DELIVERED':
                timestampUpdates.deliveredAt = now;
                break;
            case 'RETURNED':
                timestampUpdates.returnedAt = now;
                break;
            case 'CANCELLED':
                timestampUpdates.cancelledAt = now;
                break;
        }

        // Fetch orders before updating to log audit with numbers
        const orders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: { id: true, orderNumber: true, userId: true },
        });

        // Bulk update status and timestamp in DB
        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: {
                status,
                ...timestampUpdates,
            },
        });

        // Record Audit log for bulk action
        await recordAudit(
            admin.adminId,
            'ORDER_STATUS_UPDATE',
            'Order',
            orderIds[0],
            `تغییر وضعیت گروهی ${orderIds.length} سفارش به ${status} (شناسه‌ها: ${orderIds.join(', ')})`
        );

        // Record Analytics and send notifications for each order in background
        for (const order of orders) {
            if (status === 'PAID') {
                const analyticsEventClient = prisma.analyticsEvent;
                if (analyticsEventClient) {
                    analyticsEventClient.create({
                        data: {
                            type: 'PAYMENT_SUCCESS',
                            orderId: order.id,
                            userId: order.userId,
                            source: 'direct',
                            medium: 'direct',
                            path: `/admin/dashboard/orders/${order.id}`,
                        }
                    }).catch((err: unknown) => console.error('[Analytics] Failed to log bulk PAYMENT_SUCCESS:', err));
                }
            }
            notifyOrderStatusChange(order.userId, order.id, order.orderNumber, status).catch(console.error);
        }

        revalidatePath('/admin/dashboard/orders');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed bulk orders update:', error);
        return { error: error instanceof Error ? error.message : 'خطا در عملیات گروهی سفارشات' };
    }
}
