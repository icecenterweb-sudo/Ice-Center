import Link from 'next/link'
import { Home, Search, Snowflake } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-frost flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center space-y-8">
                {/* Icon */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-ocean/10 rounded-full animate-pulse" />
                    <div className="absolute inset-4 bg-ocean/20 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Snowflake className="w-16 h-16 text-ocean" />
                    </div>
                </div>

                {/* Text */}
                <div>
                    <h1 className="text-6xl font-bold text-midnight mb-3">۴۰۴</h1>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">صفحه مورد نظر یافت نشد</h2>
                    <p className="text-gray-500 text-sm leading-7">
                        متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-ocean text-white rounded-xl hover:bg-royal transition-colors text-sm font-medium shadow-lg shadow-ocean/20"
                    >
                        <Home className="w-4 h-4" />
                        بازگشت به صفحه اصلی
                    </Link>
                    <Link
                        href="/categories"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-200"
                    >
                        <Search className="w-4 h-4" />
                        مشاهده محصولات
                    </Link>
                </div>
            </div>
        </div>
    )
}
