'use client';

import { createProduct } from '@/app/actions/products';
import { ArrowRight, Save, Upload, Info } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

interface Subcategory {
    id: number;
    name: string;
    slug: string;
    category: {
        id: number;
        name: string;
        slug: string;
    };
}

interface AddProductFormProps {
    subcategories: Subcategory[];
}

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

export default function AddProductForm({ subcategories }: AddProductFormProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [nameLength, setNameLength] = useState(0);
    const [descLength, setDescLength] = useState(0);

    // Group subcategories by category
    const categoriesMap = new Map<number, { name: string, subcategories: Subcategory[] }>();

    subcategories.forEach(sub => {
        if (!categoriesMap.has(sub.category.id)) {
            categoriesMap.set(sub.category.id, {
                name: sub.category.name,
                subcategories: []
            });
        }
        categoriesMap.get(sub.category.id)?.subcategories.push(sub);
    });

    const categories = Array.from(categoriesMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        subcategories: data.subcategories
    }));

    // Get subcategories for selected category
    const filteredSubcategories = selectedCategory
        ? subcategories.filter(sub => sub.category.id.toString() === selectedCategory)
        : [];

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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        نام محصول<span className="text-red-500">*</span>
                                    </label>
                                    <span className={`text-xs font-mono ${nameLength > 70 ? 'text-red-500' : nameLength > 50 ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {nameLength}/70
                                    </span>
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    maxLength={70}
                                    placeholder="مثلاً: دستگاه بستنی‌ساز شمس مدل 2024"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                    onChange={(e) => setNameLength(e.target.value.length)}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                                    <span className="text-blue-500 mt-0.5">💡</span>
                                    <span>عنوان باید واضح، مختصر و حاوی کلمات کلیدی مهم باشد. بهینه: 40-60 کاراکتر</span>
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                                    <span className={`text-xs font-mono ${descLength > 500 ? 'text-red-500' : descLength > 300 ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {descLength}/500
                                    </span>
                                </div>
                                <textarea
                                    name="description"
                                    rows={5}
                                    maxLength={500}
                                    placeholder="توضیحات کامل در مورد محصول..."
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none resize-none text-gray-900"
                                    onChange={(e) => setDescLength(e.target.value.length)}
                                />
                                <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                                    <span className="text-blue-500 mt-0.5">💡</span>
                                    <span>توضیحات دقیق شامل: ویژگی‌های کلیدی، کاربردها، مزایا. بهینه: 150-300 کاراکتر برای سئو</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">برند</label>
                                    <input
                                        name="brand"
                                        type="text"
                                        placeholder="مثال: شمس، الکترواستیل"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">نام برند سازنده محصول</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">کد محصول (SKU)</label>
                                    <input
                                        name="sku"
                                        type="text"
                                        placeholder="مثال: ICE-2024-001"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none font-mono dir-ltr text-right text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">کد یکتا برای شناسایی محصول</p>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی اصلی</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                >
                                    <option value="">انتخاب کنید</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCategory && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">زیردسته</label>
                                    <select
                                        name="subcategoryId"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                                    >
                                        <option value="">انتخاب کنید</option>
                                        {filteredSubcategories.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
