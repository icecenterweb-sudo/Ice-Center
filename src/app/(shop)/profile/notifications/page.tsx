'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BellOff } from 'lucide-react';

export default function NotificationsPage() {
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
                    <h1 className="text-sm font-bold text-gray-800">اعلان‌ها</h1>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">اعلان‌ها</h1>
                <p className="text-sm text-gray-500 mt-1">پیام‌ها و اطلاع‌رسانی‌ها</p>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellOff className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                    اعلانی وجود ندارد
                </h2>
                <p className="text-xs text-gray-500">
                    اعلان‌های جدید اینجا نمایش داده می‌شوند
                </p>
            </div>
        </div>
    );
}
