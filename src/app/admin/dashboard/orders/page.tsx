import { ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';

function OrdersContent() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">مدیریت سفارشات</h1>
                <p className="text-gray-600 mt-1">مشاهده و پیگیری سفارشات</p>
            </div>

            {/* Coming Soon */}
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">به زودی...</h2>
                <p className="text-gray-600">بخش مدیریت سفارشات در حال توسعه است</p>
            </div>
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
