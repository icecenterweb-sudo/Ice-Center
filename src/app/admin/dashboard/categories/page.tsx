import { FolderTree, Plus } from 'lucide-react';

export default function CategoriesPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مدیریت دسته‌بندی‌ها</h1>
                    <p className="text-gray-600 mt-1">مشاهده و مدیریت دسته‌بندی‌ها و زیردسته‌ها</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-colors">
                    <Plus className="w-5 h-5" />
                    افزودن دسته‌بندی
                </button>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                    <FolderTree className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">هنوز دسته‌بندی‌ای ثبت نشده</h3>
                <p className="text-gray-600 mb-6">برای شروع، اولین دسته‌بندی خود را ایجاد کنید</p>
                <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                    <Plus className="w-5 h-5" />
                    افزودن دسته‌بندی جدید
                </button>
            </div>
        </div>
    );
}
