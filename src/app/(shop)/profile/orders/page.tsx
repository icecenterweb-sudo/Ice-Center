'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingBag, Package } from 'lucide-react';

export default function OrdersPage() {
    const router = useRouter();

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

            {/* Empty State */}
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
        </div>
    );
}
