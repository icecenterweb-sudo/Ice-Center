import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import CustomerProfileView from './CustomerProfileView';
import { connection } from 'next/server';
import { Loader2 } from 'lucide-react';

async function getCustomerData(id: number) {
    await connection();

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            phone: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            status: true,
            createdAt: true,
            addresses: {
                select: { city: true, province: true, address: true },
                orderBy: { isDefault: 'desc' },
                take: 3,
            },
        },
    });

    if (!user) return null;

    const [orders, cartItems, wishlistItems, supportRooms, analyticsEvents, notifications] =
        await Promise.all([
            prisma.order.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    total: true,
                    createdAt: true,
                    items: {
                        select: { productName: true, quantity: true, unitPrice: true },
                        take: 3,
                    },
                },
            }),
            prisma.cartItem.findMany({
                where: { userId: id },
                select: {
                    id: true,
                    quantity: true,
                    product: {
                        select: { id: true, name: true, price: true, thumbnail: true },
                    },
                },
            }),
            prisma.wishlistItem.findMany({
                where: { userId: id },
                select: {
                    id: true,
                    product: {
                        select: { id: true, name: true, price: true, thumbnail: true, slug: true },
                    },
                },
            }),
            prisma.supportRoom.findMany({
                where: { userId: id },
                orderBy: { updatedAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { messages: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { text: true, sender: true, createdAt: true },
                    },
                },
            }),
            prisma.analyticsEvent.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: {
                    id: true,
                    type: true,
                    path: true,
                    source: true,
                    device: true,
                    createdAt: true,
                },
            }),
            prisma.notification.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    readAt: true,
                    createdAt: true,
                },
            }),
        ]);

    const totalSpent = orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0);

    return {
        user,
        orders,
        cartItems,
        wishlistItems,
        supportRooms,
        analyticsEvents,
        notifications,
        stats: {
            totalOrders: orders.length,
            totalSpent,
            wishlistCount: wishlistItems.length,
            cartCount: cartItems.reduce((s, c) => s + c.quantity, 0),
        },
    };
}

async function CustomerContent({ id }: { id: number }) {
    const data = await getCustomerData(id);
    if (!data) notFound();
    return <CustomerProfileView data={data} />;
}

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: rawId } = await params;
    const userId = parseInt(rawId);
    if (isNaN(userId)) notFound();

    return (
        <div className="p-6">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                }
            >
                <CustomerContent id={userId} />
            </Suspense>
        </div>
    );
}
