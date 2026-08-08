'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Layout Error:', error);
    }, [error]);

    return (
        <html lang="fa" dir="rtl">
            <body className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-right font-sans text-white select-none">
                <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/30">
                        <AlertTriangle size={32} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-black text-white">خطای سیستمی در سامانه</h1>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">
                            اختلالی در بارگذاری قالب اصلی برنامه رخ داده است. لطفاً صفحه را تازه‌سازی کنید.
                        </p>
                    </div>

                    <button
                        onClick={() => reset()}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} />
                        <span>بازنشانی صفحه</span>
                    </button>
                </div>
            </body>
        </html>
    );
}
