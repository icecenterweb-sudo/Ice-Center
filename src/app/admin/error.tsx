'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Admin error:', error)
    }, [error])

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">خطا در پنل مدیریت</h2>
                    <p className="text-gray-500 text-sm">
                        مشکلی در بارگذاری صفحه رخ داده است.
                    </p>
                </div>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        تلاش مجدد
                    </button>
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                        <Home className="w-4 h-4" />
                        داشبورد
                    </Link>
                </div>
            </div>
        </div>
    )
}
