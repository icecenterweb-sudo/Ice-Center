'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Ticket, Calendar, RefreshCw } from 'lucide-react';
import { formatPersianNumber } from '@/lib/persian';
import StatusBadge, { type StatusTone } from '@/components/ui/StatusBadge';
import DeleteCouponButton from './DeleteCouponButton';

interface Coupon {
    id: number;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: string | number;
    minOrderAmount: string | number | null;
    maxDiscount: string | number | null;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    startDate: string | null;
    endDate: string | null;
    usageLimit: number | null;
    usedCount: number;
    perUserLimit: number;
}

const TYPE_META: Record<Coupon['type'], { label: string; tone: StatusTone }> = {
    PERCENTAGE: { label: 'درصدی', tone: 'blue' },
    FIXED_AMOUNT: { label: 'مبلغ ثابت', tone: 'violet' },
};

const STATUS_META: Record<Coupon['status'], { label: string; tone: StatusTone }> = {
    ACTIVE: { label: 'فعال', tone: 'green' },
    INACTIVE: { label: 'غیرفعال', tone: 'gray' },
    EXPIRED: { label: 'منقضی', tone: 'red' },
};

function formatCouponValue(coupon: Pick<Coupon, 'type' | 'value'>): string {
    const num = Number(coupon.value);
    if (coupon.type === 'PERCENTAGE') return `${formatPersianNumber(num)}٪`;
    return `${formatPersianNumber(num)} تومان`;
}

export default function CouponsClient() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadCoupons = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (res.ok && data.coupons) {
                setCoupons(data.coupons);
            } else {
                setError(data.error || 'خطا در دریافت لیست کدهای تخفیف');
            }
        } catch (err) {
            console.error('Failed to load coupons:', err);
            setError('خطا در دریافت لیست کدهای تخفیف');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت کوپن‌ها</h1>
                    <p className="text-gray-500 text-sm mt-1">کدهای تخفیف قابل استفاده در صفحه پرداخت</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadCoupons}
                        disabled={isLoading}
                        className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-ocean hover:border-ocean/30 transition-colors disabled:opacity-50"
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        href="/admin/dashboard/coupons/add"
                        className="flex items-center gap-2 bg-gradient-to-r from-ocean to-sky-breeze hover:from-royal hover:to-ocean text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        افزودن کد تخفیف
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-6 py-4 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-xs text-gray-500">
                                <th className="px-4 py-3 font-bold">کد</th>
                                <th className="px-4 py-3 font-bold">نوع</th>
                                <th className="px-4 py-3 font-bold">مقدار</th>
                                <th className="px-4 py-3 font-bold">مصرف</th>
                                <th className="px-4 py-3 font-bold">وضعیت</th>
                                <th className="px-4 py-3 font-bold">بازه تاریخ</th>
                                <th className="px-4 py-3 font-bold">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                                        در حال بارگذاری...
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                                                <Ticket className="w-7 h-7 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 text-sm font-medium">هنوز کد تخفیفی ثبت نشده است</p>
                                            <Link
                                                href="/admin/dashboard/coupons/add"
                                                className="text-ocean text-sm font-bold hover:underline"
                                            >
                                                افزودن اولین کد تخفیف
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => {
                                    const typeMeta = TYPE_META[coupon.type];
                                    const statusMeta = STATUS_META[coupon.status];
                                    return (
                                        <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-gray-800 font-mono tracking-wide" dir="ltr">
                                                    {coupon.code}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <StatusBadge label={typeMeta.label} tone={typeMeta.tone} />
                                            </td>

                                            <td className="px-4 py-3 text-sm font-bold text-gray-700">
                                                {formatCouponValue(coupon)}
                                                {coupon.type === 'PERCENTAGE' && coupon.maxDiscount != null && (
                                                    <span className="block text-[11px] font-medium text-gray-400 mt-0.5">
                                                        حداکثر {formatPersianNumber(Number(coupon.maxDiscount))} تومان
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {coupon.usageLimit != null ? (
                                                    <span className="font-medium">
                                                        {formatPersianNumber(coupon.usedCount)} از {formatPersianNumber(coupon.usageLimit)}
                                                    </span>
                                                ) : (
                                                    <span className="font-medium text-gray-500">نامحدود</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                                            </td>

                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {coupon.startDate || coupon.endDate ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('fa-IR') : '—'}
                                                        </span>
                                                        <span>تا</span>
                                                        <span>
                                                            {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('fa-IR') : '—'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">بدون محدودیت زمانی</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/dashboard/coupons/${coupon.id}/edit`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        ویرایش
                                                    </Link>
                                                    <DeleteCouponButton couponId={coupon.id} couponCode={coupon.code} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
