'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Wallet, CreditCard } from 'lucide-react';

export default function WalletPage() {
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
                    <h1 className="text-sm font-bold text-gray-800">کیف پول</h1>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">کیف پول</h1>
                <p className="text-sm text-gray-500 mt-1">موجودی و تراکنش‌های شما</p>
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-ocean to-blue-600 rounded-2xl p-6 mb-4 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <Wallet className="w-6 h-6" />
                    <span className="text-sm font-medium opacity-90">موجودی کیف پول</span>
                </div>
                <div className="text-3xl font-bold">۰ تومان</div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <button className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">افزایش موجودی</span>
                </button>
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-sm font-bold text-gray-800 mb-3">تراکنش‌ها</h2>
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <p className="text-xs text-gray-500">
                        تراکنشی وجود ندارد
                    </p>
                </div>
            </div>
        </div>
    );
}
