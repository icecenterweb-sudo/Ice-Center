import { Suspense } from 'react';
import { getOrders } from './actions';
import OrdersClient from './OrdersClient';
import { OrderStatus } from '@prisma/client';
import { requireRolePage } from '@/lib/admin-auth';

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await requireRolePage('ORDERS');
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search as string || '';
    const status = params.status as OrderStatus | undefined;

    const { orders, totalPages, currentPage } = await getOrders({
        page,
        limit: 10,
        status,
        search,
    });

    // Transform dates and Decimals for client component (passed as simple objects)
    const serializedOrders = orders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        items: order.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
        })),
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مدیریت سفارشات</h1>
                    <p className="text-gray-600 mt-1 text-sm">لیست سفارشات ثبت شده و وضعیت آن‌ها</p>
                </div>
            </div>

            <Suspense fallback={<div className="h-96 bg-gray-50 rounded-xl animate-pulse" />}>
                <OrdersClient
                    initialOrders={serializedOrders}
                    totalPages={totalPages}
                    currentPage={currentPage}
                />
            </Suspense>
        </div>
    );
}
