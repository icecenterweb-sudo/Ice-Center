'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Gift, ShoppingBag } from 'lucide-react';

export default function DiscountsPage() {
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
                    <h1 className="text-sm font-bold text-gray-800">کدهای تخفیف</h1>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">کدهای تخفیف</h1>
                <p className="text-sm text-gray-500 mt-1">راهنمای استفاده از کدهای تخفیف</p>
            </div>

            {/* Info State */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                    اعمال کدهای تخفیف در صفحه پرداخت
                </h2>
                <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto leading-6">
                    کدهای تخفیف در این صفحه ذخیره یا فعال نمی‌شوند؛ هنگام تکمیل خرید، در صفحه پرداخت کادر «کد تخفیف» را در خلاصه سفارش
                    خواهید دید و می‌توانید کد خود را همان‌جا وارد کنید.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/products"
                        className="flex items-center gap-2 px-5 py-2.5 bg-ocean hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        مشاهده محصولات
                    </Link>
                </div>
            </div>
        </div>
    );
}
