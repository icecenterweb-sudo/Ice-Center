'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Eye,
    Search,
    Filter,
    Phone,
    User,
    Calendar,
    MapPin,
    X,
    CheckSquare,
    Square,
    RefreshCw
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { ORDER_STATUS_META } from '@/lib/order-status';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { toPersianNumber } from '@/lib/persian';
import { bulkUpdateOrdersStatusAction } from './actions';

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

export default function OrdersClient({ initialOrders, totalPages, currentPage }: OrdersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isPending, startTransition] = useTransition();

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

    // Toggle individual row checkbox
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Select all/deselect all
    const handleSelectAll = () => {
        const orderIds = initialOrders.map(o => o.id);
        const allSelected = orderIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !orderIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const newSelection = [...prev];
                orderIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    const isAllSelected = initialOrders.length > 0 && initialOrders.every(o => selectedIds.includes(o.id));
    const isSomeSelected = initialOrders.length > 0 && initialOrders.some(o => selectedIds.includes(o.id)) && !isAllSelected;

    // Handle bulk status update
    const handleBulkStatusUpdate = async (status: OrderStatus) => {
        if (selectedIds.length === 0) return;

        startTransition(async () => {
            const loadingToast = toast.loading('در حال به‌روزرسانی وضعیت سفارشات...');
            const res = await bulkUpdateOrdersStatusAction(selectedIds, status);
            
            if (res.success) {
                toast.success('وضعیت سفارشات با موفقیت به‌روزرسانی شد.', { id: loadingToast });
                setSelectedIds([]);
                router.refresh();
            } else {
                toast.error(res.error || 'خطایی رخ داد. لطفاً دوباره تلاش کنید', { id: loadingToast });
            }
        });
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="جستجو (شماره سفارش، نام، موبایل)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm placeholder:text-gray-400"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </form>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2.5 pt-0.5 scrollbar-apple min-w-0">
                    <Filter className="w-4 h-4 text-gray-400 ml-1 shrink-0" />
                    <button
                        onClick={() => handleStatusFilter('')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${!searchParams.get('status')
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/20'
                            }`}
                    >
                        همه
                    </button>
                    {Object.entries(ORDER_STATUS_META).map(([key, { label }]) => (
                        <button
                            key={key}
                            onClick={() => handleStatusFilter(key)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${searchParams.get('status') === key
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/20'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare className="w-5 h-5 text-blue-600" />
                                        ) : isSomeSelected ? (
                                            <span className="inline-block w-4 h-4 bg-blue-100 border border-blue-500 rounded flex items-center justify-center">
                                                <span className="block w-2 h-0.5 bg-blue-600 rounded" />
                                            </span>
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4">شماره سفارش</th>
                                <th className="px-6 py-4">مشتری</th>
                                <th className="px-6 py-4">وضعیت</th>
                                <th className="px-6 py-4">تاریخ</th>
                                <th className="px-6 py-4">مبلغ کل (تومان)</th>
                                <th className="px-6 py-4">اقلام</th>
                                <th className="px-6 py-4 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {initialOrders.length > 0 ? (
                                initialOrders.map((order) => {
                                    const isRowSelected = selectedIds.includes(order.id);
                                    return (
                                        <tr 
                                            key={order.id} 
                                            className={`transition-colors group ${
                                                isRowSelected ? 'bg-blue-50/20' : 'hover:bg-blue-50/10'
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectRow(order.id)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                                >
                                                    {isRowSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-300 group-hover:border-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-700">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                                        {order.customerName}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {order.customerPhone}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        {order.shippingCity}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    label={ORDER_STATUS_META[order.status as OrderStatus].label}
                                                    tone={ORDER_STATUS_META[order.status as OrderStatus].tone}
                                                    icon={ORDER_STATUS_META[order.status as OrderStatus].icon}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-extrabold text-gray-800">
                                                {order.total.toLocaleString('fa-IR')}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px] truncate" title={order.items.map(i => i.productName).join('، ')}>
                                                {order.items.map(i => i.productName).join('، ')}
                                                {order._count.items > 3 && ` و ${toPersianNumber(order._count.items - 3)} مورد دیگر`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/admin/dashboard/orders/${order.id}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                        title="مشاهده جزئیات"
                aria-label="مشاهده جزئیات"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        سفارشی یافت نشد
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/20 flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-bold">
                            صفحه {toPersianNumber(currentPage)} از {toPersianNumber(totalPages)}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set('page', String(currentPage - 1));
                                    router.push(`?${params.toString()}`);
                                }}
                                className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors"
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
                                className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BAR FOR ORDERS */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4"
                    >
                        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md bg-opacity-95">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center bg-blue-500 text-white text-xs font-extrabold w-6 h-6 rounded-full">
                                    {toPersianNumber(selectedIds.length)}
                                </span>
                                <span className="text-sm font-bold text-slate-300">سفارش انتخاب شده است</span>
                                <button 
                                    onClick={() => setSelectedIds([])}
                                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="لغو انتخاب"
                aria-label="لغو انتخاب"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                                    <RefreshCw className="w-4 h-4" />
                                    تغییر وضعیت به:
                                </div>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkStatusUpdate(e.target.value as OrderStatus);
                                            e.target.value = ''; // Reset select
                                        }
                                    }}
                                    disabled={isPending}
                                    className="bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-2 text-xs font-bold outline-none cursor-pointer hover:bg-slate-750 transition-colors flex-1 md:flex-none"
                                >
                                    <option value="" disabled selected>انتخاب وضعیت جدید...</option>
                                    {Object.entries(ORDER_STATUS_META).map(([key, { label }]) => (
                                        <option key={key} value={key} className="bg-slate-900 text-white">{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
