import { Users, Search } from 'lucide-react';

export default function UsersPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">مدیریت کاربران</h1>
                <p className="text-gray-600 mt-1">مشاهده لیست کاربران ثبت‌نام شده</p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجوی کاربر..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                    <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">هنوز کاربری ثبت‌نام نکرده</h3>
                <p className="text-gray-600">کاربران ثبت‌نام شده در این قسمت نمایش داده می‌شوند</p>
            </div>
        </div>
    );
}
