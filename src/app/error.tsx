'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled Root Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-right dir-rtl select-none">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={32} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-black text-slate-800">خطایی رخ داده است</h1>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        متأسفانه در بارگذاری این صفحه مشکلی پیش آمده است. لطفاً مجدداً تلاش کنید یا به صفحه اصلی بازگردید.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => reset()}
                        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                        <RefreshCw size={14} />
                        <span>تلاش مجدد</span>
                    </button>

                    <Link
                        href="/"
                        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer"
                    >
                        <Home size={14} />
                        <span>صفحه اصلی</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
