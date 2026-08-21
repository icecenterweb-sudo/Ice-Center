import { prisma } from '@/lib/db';
import { FolderTree, Plus, Edit, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import DeleteCategoryButton from './DeleteCategoryButton';
import DeleteSubcategoryButton from './DeleteSubcategoryButton';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function CategoriesContent() {
    await connection(); // Opt out of caching for this page
    await requireRolePage('CATEGORIES');

    // Fetch all categories with their subcategories
    const categories = await prisma.category.findMany({
        include: {
            subcategories: {
                orderBy: [{ order: 'asc' }, { name: 'asc' }]
            }
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }]
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مدیریت دسته‌بندی‌ها</h1>
                    <p className="text-gray-600 mt-1">مشاهده و مدیریت دسته‌بندی‌ها و زیردسته‌ها</p>
                </div>
                <Link
                    href="/admin/dashboard/categories/add"
                    className="flex items-center gap-2 bg-ocean hover:bg-royal text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    افزودن دسته‌بندی
                </Link>
            </div>

            {/* Categories List */}
            {categories.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                        <FolderTree className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">هنوز دسته‌بندی‌ای ثبت نشده</h2>
                    <p className="text-gray-600 mb-6">برای شروع، اولین دسته‌بندی خود را ایجاد کنید</p>
                    <Link
                        href="/admin/dashboard/categories/add"
                        className="inline-flex items-center gap-2 bg-ocean hover:bg-royal text-white px-6 py-3 rounded-lg font-bold transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        افزودن دسته‌بندی جدید
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            {/* Category Header */}
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-gray-200">
                                <div className="flex items-start gap-4">
                                    {/* Category Image */}
                                    {category.image ? (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                            <Image
                                                src={category.image}
                                                alt={category.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <ImageIcon className="w-8 h-8 text-blue-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-lg font-bold text-gray-900 truncate">{category.name}</h2>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 shrink-0">
                                                ترتیب: {category.order}
                                            </span>
                                        </div>
                                        {category.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-1 flex-shrink-0">
                                        <Link
                                            href={`/admin/dashboard/categories/edit/${category.id}`}
                                            className="p-2 hover:bg-frost rounded-lg transition-colors text-ocean"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <DeleteCategoryButton
                                            categoryId={category.id}
                                            hasSubcategories={category.subcategories.length > 0}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-700">
                                        <FolderTree className="w-3 h-3" />
                                        {category.subcategories.length} زیردسته
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">/{category.slug}</span>
                                </div>
                            </div>

                            {/* Subcategories List */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">زیردسته‌ها</h4>
                                    <Link
                                        href={`/admin/dashboard/categories/subcategories/add?categoryId=${category.id}`}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        افزودن زیردسته
                                    </Link>
                                </div>

                                {category.subcategories.length > 0 ? (
                                    <div className="space-y-2">
                                        {category.subcategories.map((sub) => (
                                            <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                                                <div className="flex-1 flex items-center justify-between pl-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">/{sub.slug}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                        ترتیب: {sub.order}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/admin/dashboard/categories/subcategories/edit/${sub.id}`}
                                                        className="p-1.5 hover:bg-frost rounded text-ocean"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </Link>
                                                    <DeleteSubcategoryButton subcategoryId={sub.id} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">هنوز زیردسته‌ای ثبت نشده</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CategoriesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری دسته‌بندی‌ها...</div>}>
            <CategoriesContent />
        </Suspense>
    );
}
