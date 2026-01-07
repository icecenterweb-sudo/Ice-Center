'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Search, Filter, Phone, User, Calendar, MapPin } from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import Link from 'next/link';

interface Order {
    id: number;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    shippingCity: string;
    total: number;
    status: OrderStatus;
    createdAt: Date;
    items: { productName: string }[];
    _count: { items: number };
}

interface OrdersClientProps {
    initialOrders: Order[];
    totalPages: number;
    currentPage: number;
}

const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'در انتظار پرداخت', color: 'bg-yellow-100 text-yellow-800' },
    PAID: { label: 'پرداخت شده', color: 'bg-blue-100 text-blue-800' },
    PROCESSING: { label: 'در حال پردازش', color: 'bg-indigo-100 text-indigo-800' },
    SHIPPED: { label: 'ارسال شده', color: 'bg-purple-100 text-purple-800' },
    DELIVERED: { label: 'تحویل شده', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'لغو شده', color: 'bg-red-100 text-red-800' },
};

export default function OrdersClient({ initialOrders, totalPages, currentPage }: OrdersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handleStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status) params.set('status', status);
        else params.delete('status');
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="جستجو (شماره سفارش، نام، موبایل)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </form>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-5 h-5 text-gray-500 ml-2" />
                    <button
                        onClick={() => handleStatusFilter('')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!searchParams.get('status')
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        همه
                    </button>
                    {Object.entries(statusMap).map(([key, { label }]) => (
                        <button
                            key={key}
                            onClick={() => handleStatusFilter(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${searchParams.get('status') === key
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">شماره سفارش</th>
                                <th className="px-6 py-4">مشتری</th>
                                <th className="px-6 py-4">وضعیت</th>
                                <th className="px-6 py-4">تاریخ</th>
                                <th className="px-6 py-4">مبلغ کل (تومان)</th>
                                <th className="px-6 py-4">اقلام</th>
                                <th className="px-6 py-4 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {initialOrders.length > 0 ? (
                                initialOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-gray-600">
                                            #{order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                    {order.customerName}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Phone className="w-3 h-3" />
                                                    {order.customerPhone}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <MapPin className="w-3 h-3" />
                                                    {order.shippingCity}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[order.status].color}`}>
                                                {statusMap[order.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {order.total.toLocaleString('fa-IR')}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px] truncate">
                                            {order.items.map(i => i.productName).join('، ')}
                                            {order._count.items > 3 && ` و ${order._count.items - 3} مورد دیگر`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <Link
                                                    href={`/admin/dashboard/orders/${order.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="مشاهده جزئیات"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        سفارشی یافت نشد
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            صفحه {currentPage} از {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set('page', String(currentPage - 1));
                                    router.push(`?${params.toString()}`);
                                }}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                قبلی
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set('page', String(currentPage + 1));
                                    router.push(`?${params.toString()}`);
                                }}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
