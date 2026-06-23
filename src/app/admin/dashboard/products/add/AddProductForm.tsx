'use client';

import { createProduct } from '@/app/actions/products';
import { ArrowRight, Save, Upload, Info } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import FeaturesManager from '@/components/admin/FeaturesManager';
import SpecificationsManager from '@/components/admin/SpecificationsManager';

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
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [specifications, setSpecifications] = useState<Record<string, string>>({});

    // Generate SKU based on current date and time
    const generateSKU = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `PRD-${year}${month}${day}-${hours}${minutes}`;
    };

    const [sku, setSku] = useState(generateSKU());

    const handleSubmit = async (formData: FormData) => {
        // Images are now already uploaded to Cloudinary by MultiImageUpload
        // The imagesData hidden field is automatically populated by the component
        return createProduct(formData);
    };

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
                    className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">افزودن محصول جدید</h1>
                    <p className="text-gray-500 text-sm mt-1">مشخصات محصول جدید را وارد کنید</p>
                </div>
            </div>

            <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                    <span className={`text-xs font-mono ${nameLength > 70 ? 'text-red-500' : nameLength > 50 ? 'text-orange-500' : 'text-gray-500'}`}>
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
                                    <span className={`text-xs font-mono ${descLength > 500 ? 'text-red-500' : descLength > 300 ? 'text-orange-500' : 'text-gray-500'}`}>
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
                                    <div className="flex gap-2">
                                        <input
                                            name="sku"
                                            type="text"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            placeholder="مثال: PRD-20241214-1130"
                                            className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none font-mono dir-ltr text-right text-gray-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSku(generateSKU())}
                                            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-bold text-sm whitespace-nowrap"
                                            title="تولید کد جدید"
                                        >
                                            🔄
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">کد خودکار ایجاد شده - می‌توانید ویرایش کنید</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <MultiImageUpload onImagesChange={setImageUrls} maxImages={5} folder="products" />

                    {/* Features & Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FeaturesManager
                            initialFeatures={features}
                            onChange={setFeatures}
                        />
                        <SpecificationsManager
                            initialSpecs={specifications}
                            onChange={setSpecifications}
                        />
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">وضعیت و قیمت</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    قیمت اصلی / لیست (تومان)
                                    <span className="text-xs text-gray-500 mr-2">(اختیاری)</span>
                                </label>
                                <input
                                    name="listPrice"
                                    type="number"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all outline-none text-gray-900"
                                    placeholder="قیمت قبل از تخفیف"
                                />
                                <p className="text-xs text-gray-500 mt-1">قیمت اصلی محصول (MSRP)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    قیمت فروش (تومان) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="price"
                                    type="number"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none font-bold text-gray-900"
                                    placeholder="قیمت نهایی برای مشتری"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">قیمتی که مشتری می‌پردازد</p>
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
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            value="true"
                                            className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-gray-200 transition-colors checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                                            defaultChecked
                                        />
                                        <span className="pointer-events-none absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 shadow-sm transition-transform peer-checked:translate-x-5 peer-checked:border-white" />
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
