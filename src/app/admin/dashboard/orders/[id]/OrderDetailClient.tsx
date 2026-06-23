'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import {
    User, Phone, MapPin, Calendar, CreditCard,
    Package, RefreshCw, Save, ArrowLeft
} from 'lucide-react';
import { updateOrderStatus, updateAdminNotes } from '../actions';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface OrderDetailClientProps {
    order: any; // Using any for simplicity in rapid dev, ideally typed
}

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: 'در انتظار پرداخت', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'AWAITING_CONFIRMATION', label: 'در انتظار تأیید', color: 'bg-orange-100 text-orange-800' },
    { value: 'PAID', label: 'پرداخت شده', color: 'bg-blue-100 text-blue-800' },
    { value: 'PROCESSING', label: 'در حال پردازش', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'PREPARING', label: 'آماده‌سازی', color: 'bg-violet-100 text-violet-800' },
    { value: 'READY_FOR_DELIVERY', label: 'آماده تحویل', color: 'bg-teal-100 text-teal-800' },
    { value: 'SHIPPED', label: 'ارسال شده', color: 'bg-purple-100 text-purple-800' },
    { value: 'HANDED_TO_CARRIER', label: 'تحویل به باربری', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'DELIVERED', label: 'تحویل شده', color: 'bg-green-100 text-green-800' },
    { value: 'RETURNED', label: 'برگشت خورده', color: 'bg-rose-100 text-rose-800' },
    { value: 'CANCELLED', label: 'لغو شده', color: 'bg-red-100 text-red-800' },
    { value: 'NEEDS_CONTACT', label: 'نیازمند تماس', color: 'bg-amber-100 text-amber-800' },
];

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [notes, setNotes] = useState(order.adminNotes || '');
    const router = useRouter();

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!confirm('آیا از تغییر وضعیت سفارش اطمینان دارید؟')) return;

        setIsLoading(true);
        const result = await updateOrderStatus(order.id, newStatus);
        setIsLoading(false);

        if (result.success) {
            toast.success('وضعیت سفارش با موفقیت تغییر کرد');
            router.refresh();
        } else {
            toast.error('خطا در تغییر وضعیت');
        }
    };

    const handleSaveNotes = async () => {
        setIsLoading(true);
        const result = await updateAdminNotes(order.id, notes);
        setIsLoading(false);

        if (result.success) {
            toast.success('یادداشت ذخیره شد');
            router.refresh();
        } else {
            toast.error('خطا در ذخیره یادداشت');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/dashboard/orders"
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            سفارش #{order.orderNumber}
                            <span className={`text-sm px-3 py-1 rounded-full ${statusOptions.find(s => s.value === order.status)?.color}`}>
                                {statusOptions.find(s => s.value === order.status)?.label}
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            ثبت شده در {new Date(order.createdAt).toLocaleDateString('fa-IR')} ساعت {new Date(order.createdAt).toLocaleTimeString('fa-IR')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-500" />
                            اقلام سفارش
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">محصول</th>
                                        <th className="px-4 py-3 text-center">تعداد</th>
                                        <th className="px-4 py-3">قیمت واحد</th>
                                        <th className="px-4 py-3">قیمت کل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 relative bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                                        {item.thumbnail ? (
                                                            <img src={item.thumbnail} alt={item.productName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">IMG</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.productName}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{item.productSku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-900 font-medium">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {item.unitPrice.toLocaleString()} تومان
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {item.totalPrice.toLocaleString()} تومان
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 font-medium text-gray-900">جمع کل</td>
                                        <td className="px-4 py-3 font-bold text-blue-600 text-base">
                                            {order.total.toLocaleString()} تومان
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Save className="w-5 h-5 text-gray-500" />
                                یادداشت ادمین
                            </h3>
                            <button
                                onClick={handleSaveNotes}
                                disabled={isLoading}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                ذخیره یادداشت
                            </button>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="یادداشت‌های محرمانه برای مدیریت..."
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Right Column - Info Cards */}
                <div className="space-y-6">
                    {/* Order Timeline */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            مراحل سفارش
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'ثبت سفارش', date: order.createdAt, icon: '📝' },
                                { label: 'تأیید کارشناس', date: order.confirmedAt, icon: '✅' },
                                { label: 'پرداخت', date: order.paidAt, icon: '💳' },
                                { label: 'آماده‌سازی', date: order.preparingAt, icon: '📦' },
                                { label: 'آماده تحویل', date: order.readyAt, icon: '✨' },
                                { label: 'ارسال', date: order.shippedAt, icon: '🚚' },
                                { label: 'تحویل به باربری', date: order.handedToCarrierAt, icon: '🚛' },
                                { label: 'تحویل', date: order.deliveredAt, icon: '📬' },
                                { label: 'برگشت', date: order.returnedAt, icon: '↩️' },
                                { label: 'لغو', date: order.cancelledAt, icon: '❌' },
                            ].filter(step => step.date).map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                    <span className="text-lg">{step.icon}</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{step.label}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(step.date!).toLocaleDateString('fa-IR')} ساعت {new Date(step.date!).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {order.status === 'NEEDS_CONTACT' && (
                                <div className="flex items-center gap-3 text-sm bg-amber-50 p-3 rounded-lg">
                                    <span className="text-lg">📞</span>
                                    <div className="font-medium text-amber-800">نیاز به تماس با مشتری</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            اطلاعات مشتری
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">نام و نام خانوادگی</div>
                                <div className="font-medium text-gray-900">{order.customerName}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">شماره تماس</div>
                                <div className="font-medium text-gray-900 font-mono" dir="ltr">{order.customerPhone}</div>
                            </div>
                            {order.user?.id && (
                                <Link
                                    href={`/admin/dashboard/users/${order.user.id}`}
                                    className="block text-center w-full py-2 bg-gray-50 hover:bg-gray-100 text-blue-600 text-sm rounded-lg transition-colors"
                                >
                                    مشاهده پروفایل کاربر
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            اطلاعات ارسال
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">استان / شهر</div>
                                <div className="font-medium text-gray-900">{order.shippingProvince} - {order.shippingCity}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">آدرس کامل</div>
                                <div className="font-medium text-gray-900 text-sm leading-6">{order.shippingAddress}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">کد پستی</div>
                                <div className="font-medium text-gray-900 font-mono">{order.postalCode || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
