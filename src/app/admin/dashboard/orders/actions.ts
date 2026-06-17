'use server';

import { prisma } from '@/lib/db';
import { OrderStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { notifyOrderStatusChange } from '@/lib/notifications';

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
    try {
        const where: Prisma.OrderWhereInput = {};

        // Filter by status
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Search by order number, customer name, or phone
        if (search) {
            where.OR = [
                { orderNumber: { contains: search } }, // Case insensitive in Postgres? Need mode: 'insensitive' if using Postgres directly but prisma usually handles it
                { customerName: { contains: search } },
                { customerPhone: { contains: search } },
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
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                // Update timestamps based on status
                ...(status === 'PAID' ? { paidAt: new Date() } : {}),
                ...(status === 'SHIPPED' ? { shippedAt: new Date() } : {}),
                ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
            },
            select: { id: true, orderNumber: true, userId: true },
        });

        // Record PAYMENT_SUCCESS event if paid
        if (status === 'PAID') {
            const analyticsEventClient = (prisma as any).analyticsEvent;
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
                }).catch((err: any) => console.error('[Analytics] Failed to log PAYMENT_SUCCESS:', err));
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
        await prisma.order.update({
            where: { id: orderId },
            data: { adminNotes: notes },
        });

        revalidatePath(`/admin/dashboard/orders/${orderId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating admin notes:', error);
        return { error: 'Failed to update notes' };
    }
}
