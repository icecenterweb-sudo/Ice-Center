'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Package, Clock, CheckCircle, Truck, XCircle, Loader2 } from 'lucide-react';

interface OrderItem {
    id: number;
    productName: string;
    thumbnail: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Order {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
    _count: { items: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
    PENDING: { label: 'در انتظار پرداخت', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    PAID: { label: 'پرداخت شده', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    PROCESSING: { label: 'در حال پردازش', color: 'bg-purple-100 text-purple-700', icon: Package },
    SHIPPED: { label: 'ارسال شده', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
    DELIVERED: { label: 'تحویل داده شده', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    CANCELLED: { label: 'لغو شده', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch('/api/orders');
                const data = await res.json();
                if (data.orders) {
                    setOrders(data.orders);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="pb-20 lg:pb-0">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-sm font-bold text-gray-800">سفارش‌های من</h1>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">سفارش‌های من</h1>
                <p className="text-sm text-gray-500 mt-1">تاریخچه سفارش‌های شما</p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-ocean mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">در حال بارگذاری...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && orders.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800 mb-2">
                        هنوز سفارشی ثبت نکرده‌اید
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">
                        پس از ثبت اولین سفارش، اطلاعات آن اینجا نمایش داده می‌شود
                    </p>
                    <button
                        onClick={() => router.push('/categories')}
                        className="inline-flex items-center gap-2 bg-ocean hover:bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        مشاهده محصولات
                    </button>
                </div>
            )}

            {/* Orders List */}
            {!loading && orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.PENDING;
                        const StatusIcon = status.icon;
                        return (
                            <Link
                                key={order.id}
                                href={`/profile/orders/${order.id}`}
                                className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Order Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-800">
                                            #{order.orderNumber}
                                        </span>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${status.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>

                                {/* Order Summary */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* Product Thumbnails */}
                                        <div className="flex -space-x-2 rtl:space-x-reverse">
                                            {order.items.slice(0, 3).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white overflow-hidden"
                                                >
                                                    {item.thumbnail ? (
                                                        <img
                                                            src={item.thumbnail}
                                                            alt={item.productName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {order._count.items > 3 && (
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                                                    +{order._count.items - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {order._count.items} کالا
                                        </span>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-gray-800">
                                            {formatPrice(order.total)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

