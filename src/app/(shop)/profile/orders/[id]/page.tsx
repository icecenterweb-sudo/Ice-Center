'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Package, XCircle, Loader2, MapPin, Phone, User } from 'lucide-react';
import Image from 'next/image';
import StatusBadge from '@/components/ui/StatusBadge';
import { getOrderStatusMeta } from '@/lib/order-status';

interface OrderItem {
    id: number;
    productName: string;
    productSku: string | null;
    thumbnail: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Order {
    id: number;
    orderNumber: string;
    status: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingProvince: string | null;
    postalCode: string | null;
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    notes: string | null;
    createdAt: string;
    paidAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    items: OrderItem[];
}

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/orders/${params.id}`);
                const data = await res.json();
                if (res.ok && data.order) {
                    setOrder(data.order);
                } else {
                    setError(data.error || 'خطا در دریافت سفارش');
                }
            } catch {
                setError('خطا در اتصال به سرور');
            } finally {
                setLoading(false);
            }
        }
        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="pb-20 lg:pb-0">
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-ocean mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="pb-20 lg:pb-0">
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600">{error || 'سفارش یافت نشد'}</p>
                    <button
                        onClick={() => router.push('/profile/orders')}
                        className="mt-4 text-ocean hover:underline"
                    >
                        بازگشت به لیست سفارش‌ها
                    </button>
                </div>
            </div>
        );
    }

    const status = getOrderStatusMeta(order.status);

    return (
        <div className="pb-20 lg:pb-0 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-sm font-bold text-gray-800">
                            سفارش #{order.orderNumber}
                        </h1>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <StatusBadge
                        label={status.label}
                        tone={status.tone}
                        icon={status.icon}
                    />
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-800 mb-4">محصولات سفارش</h2>
                <div className="space-y-3">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="relative w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0">
                                {item.thumbnail ? (
                                    <Image
                                        src={item.thumbnail}
                                        alt={item.productName}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Package className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                                    {item.productName}
                                </h3>
                                {item.productSku && (
                                    <p className="text-xs text-gray-500 mt-1">کد: {item.productSku}</p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">{item.quantity} عدد</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {formatPrice(item.totalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-800 mb-3">آدرس ارسال</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-700">{order.customerName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-700 ltr">{order.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-gray-700">
                            <p>{order.shippingCity}{order.shippingProvince && ` - ${order.shippingProvince}`}</p>
                            <p>{order.shippingAddress}</p>
                            {order.postalCode && <p className="text-xs text-gray-500">کد پستی: {order.postalCode}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-800 mb-3">خلاصه سفارش</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">جمع کالاها</span>
                        <span className="text-gray-700">{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>تخفیف</span>
                            <span>-{formatPrice(order.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-500">هزینه ارسال</span>
                        <span className="text-gray-700">
                            {order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'رایگان'}
                        </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-800">مبلغ قابل پرداخت</span>
                            <span className="font-bold text-ocean">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                    <h2 className="text-sm font-bold text-gray-800 mb-2">یادداشت</h2>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
            )}
        </div>
    );
}
