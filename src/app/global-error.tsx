'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <html lang="fa" dir="rtl">
            <body className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">خطای غیرمنتظره</h2>
                        <p className="text-gray-500 text-sm">
                            متأسفانه مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            تلاش مجدد
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                            <Home className="w-4 h-4" />
                            صفحه اصلی
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    )
}
