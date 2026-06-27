'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiscountsPage() {
    const router = useRouter();
    const [couponCode, setCouponCode] = useState('');

    const handleSubmit = () => {
        if (!couponCode.trim()) {
            toast.error('کد تخفیف را وارد کنید');
            return;
        }
        toast.success('کد تخفیف در صفحه پرداخت قابل اعمال است');
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
                    <h1 className="text-sm font-bold text-gray-800">کدهای تخفیف</h1>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">کدهای تخفیف</h1>
                <p className="text-sm text-gray-500 mt-1">کدهای تخفیف فعال شما</p>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                    کد تخفیفی ندارید
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                    کدهای تخفیف فعال شما اینجا نمایش داده می‌شوند
                </p>

                {/* Add Discount Code Input */}
                <div className="flex gap-2 max-w-xs mx-auto">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="کد تخفیف را وارد کنید"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-ocean"
                    />
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2.5 bg-ocean hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        ثبت
                    </button>
                </div>
            </div>
        </div>
    );
}
