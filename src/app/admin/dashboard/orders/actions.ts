'use server';

import { prisma } from '@/lib/db';
import { OrderStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                // Update timestamps based on status
                ...(status === 'PAID' ? { paidAt: new Date() } : {}),
                ...(status === 'SHIPPED' ? { shippedAt: new Date() } : {}),
                ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
            },
        });

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
