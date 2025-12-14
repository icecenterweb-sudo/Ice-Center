'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import FeaturesManager from '@/components/admin/FeaturesManager';
import SpecificationsManager from '@/components/admin/SpecificationsManager';
import { updateProduct } from '@/app/actions/products';

interface EditProductFormProps {
    product: any;
    subcategories: any[];
}

export default function EditProductForm({ product, subcategories }: EditProductFormProps) {
    const router = useRouter();
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [features, setFeatures] = useState<string[]>(product.features || []);
    const [specifications, setSpecifications] = useState<Record<string, string>>(product.specifications || {});

    const handleSubmit = async (formData: FormData) => {
        // Convert images to base64 if exist
        if (imageFiles.length > 0) {
            const imageDataArray: string[] = [];

            for (const file of imageFiles) {
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                imageDataArray.push(base64);
            }

            formData.append('imagesData', JSON.stringify(imageDataArray));
        }

        await updateProduct(product.id, formData);
    };

    return (
        <form action={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        نام محصول <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        defaultValue={product.name}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800"
                    />
                </div>

                {/* SKU */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        کد محصول (SKU)
                    </label>
                    <input
                        type="text"
                        name="sku"
                        defaultValue={product.sku || ''}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800"
                    />
                </div>

                {/* Brand */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        برند
                    </label>
                    <input
                        type="text"
                        name="brand"
                        defaultValue={product.brand || ''}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800"
                    />
                </div>

                {/* List Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        قیمت اصلی / لیست (تومان)
                        <span className="text-xs text-gray-500 mr-2">(اختیاری)</span>
                    </label>
                    <input
                        type="number"
                        name="listPrice"
                        defaultValue={product.listPrice || ''}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-all outline-none text-gray-800"
                        placeholder="قیمت قبل از تخفیف"
                    />
                    <p className="text-xs text-gray-500 mt-1">قیمت اصلی محصول (MSRP)</p>
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        قیمت (تومان) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        defaultValue={product.price}
                        required
                        min="0"
                        step="1000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800 font-bold"
                    />
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        موجودی
                    </label>
                    <input
                        type="number"
                        name="stock"
                        defaultValue={product.stock}
                        min="0"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800"
                    />
                </div>

                {/* Subcategory */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        دسته‌بندی
                    </label>
                    <select
                        name="subcategoryId"
                        defaultValue={product.subcategoryId || ''}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800"
                    >
                        <option value="">بدون دسته‌بندی</option>
                        {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.category.name} / {sub.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Active Status */}
                <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            value="true"
                            defaultChecked={product.isActive}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">محصول فعال است</span>
                    </label>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات
                    </label>
                    <textarea
                        name="description"
                        defaultValue={product.description || ''}
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none text-gray-800"
                    />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                    <MultiImageUpload
                        currentImages={product.images || []}
                        onImagesChange={setImageFiles}
                        maxImages={5}
                    />
                </div>

                {/* Features & Specifications */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-100">
                <Link
                    href="/admin/dashboard/products"
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                    انصراف
                </Link>
                <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all"
                >
                    ذخیره تغییرات
                </button>
            </div>
        </form>
    );
}
