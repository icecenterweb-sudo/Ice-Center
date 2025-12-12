'use client';

import { createProduct } from '@/app/actions/products';
import { ArrowRight, Save, Upload, Info } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? (
                <span>در حال ذخیره...</span>
            ) : (
                <>
                    <Save className="w-5 h-5" />
                    ذخیره محصول
                </>
            )}
        </button>
    );
}

export default function AddProductPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard/products"
                    className="p-2 rounded-xl bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm border border-gray-100"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">افزودن محصول جدید</h1>
                    <p className="text-gray-500 text-sm mt-1">مشخصات محصول جدید را وارد کنید</p>
                </div>
            </div>

            <form action={createProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            اطلاعات پایه
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">نام محصول</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="مثلاً: دستگاه بستنی‌ساز شمس مدل 2024"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                                <textarea
                                    name="description"
                                    rows={5}
                                    placeholder="توضیحات کامل در مورد محصول..."
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none resize-none text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">برند</label>
                                    <input
                                        name="brand"
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">کد محصول (SKU)</label>
                                    <input
                                        name="sku"
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none font-mono dir-ltr text-right text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-purple-500" />
                            تصاویر محصول
                        </h2>
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8" />
                            </div>
                            <p className="font-bold text-gray-700">کلیک کنید یا تصویر را اینجا رها کنید</p>
                            <p className="text-sm text-gray-400 mt-2">PNG, JPG تا حجم 5 مگابایت</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">وضعیت و قیمت</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">قیمت (تومان)</label>
                                <input
                                    name="price"
                                    type="number"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none font-mono font-bold text-gray-900"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">تعداد موجودی</label>
                                <input
                                    name="stock"
                                    type="number"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
                                <select
                                    name="category"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                >
                                    <option value="">انتخاب کنید</option>
                                    <option value="1">دستگاه بستنی‌ساز</option>
                                    <option value="2">یخچال صنعتی</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="active" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">محصول فعال باشد</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
