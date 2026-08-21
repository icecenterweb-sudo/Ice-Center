'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Prisma } from '@prisma/client';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import FeaturesManager from '@/components/admin/FeaturesManager';
import SpecificationsManager from '@/components/admin/SpecificationsManager';
import { updateProduct } from '@/app/actions/products';
import { fieldClass } from '@/lib/form-classes';

interface EditProductFormProps {
    product: Prisma.ProductGetPayload<{
        include: {
            subcategory: true;
            variants: true;
        };
    }>;
    subcategories: Prisma.SubcategoryGetPayload<{
        include: {
            category: true;
        };
    }>[];
}

export default function EditProductForm({ product, subcategories }: EditProductFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [, setImageUrls] = useState<string[]>([]);
    const [features, setFeatures] = useState<string[]>(product.features || []);
    const [specifications, setSpecifications] = useState<Record<string, string>>(
        (product.specifications as Record<string, string> | null) ?? {}
    );

    const clearFieldError = (name: string) => {
        setFieldErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});
        const formData = new FormData(e.currentTarget);
        setIsSubmitting(true);
        const t = toast.loading('در حال ذخیره تغییرات...');

        try {
            const res = await updateProduct(product.id, formData);
            if (res.success) {
                toast.success('تغییرات با موفقیت ذخیره شد', { id: t });
                router.push('/admin/dashboard/products');
                router.refresh();
            } else {
                if (res.fieldErrors) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(res.fieldErrors)) {
                        if (v?.[0]) flat[k] = v[0];
                    }
                    setFieldErrors(flat);
                }
                toast.error(res.error || 'خطا در ذخیره تغییرات', { id: t });
            }
        } catch {
            toast.error('خطای غیرمنتظره رخ داد', { id: t });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
                        aria-invalid={!!fieldErrors.name}
                        aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                        onChange={() => clearFieldError('name')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800",
                            !!fieldErrors.name
                        )}
                    />
                    {fieldErrors.name && (
                        <p id="name-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                    )}
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
                        aria-invalid={!!fieldErrors.sku}
                        aria-describedby={fieldErrors.sku ? 'sku-error' : undefined}
                        onChange={() => clearFieldError('sku')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800 font-mono text-left",
                            !!fieldErrors.sku
                        )}
                        dir="ltr"
                    />
                    {fieldErrors.sku && (
                        <p id="sku-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.sku}</p>
                    )}
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسلاگ (آدرس URL) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="slug"
                        defaultValue={product.slug || ''}
                        required
                        pattern="[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\-]+"
                        aria-invalid={!!fieldErrors.slug}
                        aria-describedby={fieldErrors.slug ? 'slug-error' : undefined}
                        onChange={() => clearFieldError('slug')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800 font-mono",
                            !!fieldErrors.slug
                        )}
                        dir="ltr"
                        placeholder="آب-هویج-گیری-هلال-مدل-g100"
                    />
                    {fieldErrors.slug ? (
                        <p id="slug-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.slug}</p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">حروف فارسی، انگلیسی، اعداد و خط تیره مجاز است</p>
                    )}
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
                        aria-invalid={!!fieldErrors.brand}
                        aria-describedby={fieldErrors.brand ? 'brand-error' : undefined}
                        onChange={() => clearFieldError('brand')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800",
                            !!fieldErrors.brand
                        )}
                    />
                    {fieldErrors.brand && (
                        <p id="brand-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.brand}</p>
                    )}
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        قیمت فروش (تومان) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        defaultValue={product.price}
                        required
                        min="0"
                        step="any"
                        aria-invalid={!!fieldErrors.price}
                        aria-describedby={fieldErrors.price ? 'price-error' : undefined}
                        onChange={() => clearFieldError('price')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800 font-mono text-left",
                            !!fieldErrors.price
                        )}
                        dir="ltr"
                    />
                    {fieldErrors.price && (
                        <p id="price-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.price}</p>
                    )}
                </div>

                {/* List Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        قیمت خط خورده (تومان)
                    </label>
                    <input
                        type="number"
                        name="listPrice"
                        defaultValue={product.listPrice || ''}
                        min="0"
                        step="any"
                        aria-invalid={!!fieldErrors.listPrice}
                        aria-describedby={fieldErrors.listPrice ? 'listPrice-error' : undefined}
                        onChange={() => clearFieldError('listPrice')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800 font-mono text-left",
                            !!fieldErrors.listPrice
                        )}
                        dir="ltr"
                    />
                    {fieldErrors.listPrice ? (
                        <p id="listPrice-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.listPrice}</p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-1">جهت نمایش خط‌خورده در صفحه محصول</p>
                    )}
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        موجودی انبار
                    </label>
                    <input
                        type="number"
                        name="stock"
                        defaultValue={product.stock}
                        min="0"
                        aria-invalid={!!fieldErrors.stock}
                        aria-describedby={!!fieldErrors.stock ? 'stock-error' : undefined}
                        onChange={() => clearFieldError('stock')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800 font-mono text-left",
                            !!fieldErrors.stock
                        )}
                        dir="ltr"
                    />
                    {fieldErrors.stock && (
                        <p id="stock-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.stock}</p>
                    )}
                </div>

                {/* Subcategory */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        دسته‌بندی
                    </label>
                    <select
                        name="subcategoryId"
                        defaultValue={product.subcategoryId || ''}
                        aria-invalid={!!fieldErrors.subcategoryId}
                        aria-describedby={fieldErrors.subcategoryId ? 'subcategoryId-error' : undefined}
                        onChange={() => clearFieldError('subcategoryId')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800",
                            !!fieldErrors.subcategoryId
                        )}
                    >
                        <option value="">انتخاب دسته‌بندی</option>
                        {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.category.name} &larr; {sub.name}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.subcategoryId && (
                        <p id="subcategoryId-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.subcategoryId}</p>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        وضعیت نمایش
                    </label>
                    <select
                        name="isActive"
                        defaultValue={product.isActive ? 'true' : 'false'}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800"
                    >
                        <option value="true">فعال (نمایش در سایت)</option>
                        <option value="false">غیرفعال (عدم نمایش)</option>
                    </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات محصول
                    </label>
                    <textarea
                        name="description"
                        defaultValue={product.description || ''}
                        rows={4}
                        aria-invalid={!!fieldErrors.description}
                        aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                        onChange={() => clearFieldError('description')}
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-gray-800",
                            !!fieldErrors.description
                        )}
                    />
                    {fieldErrors.description && (
                        <p id="description-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                    )}
                </div>

                {/* Multi Image Upload */}
                <div className="md:col-span-2">
                    <MultiImageUpload
                        currentImages={product.images || []}
                        onImagesChange={setImageUrls}
                        folder="products"
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
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
            </div>
        </form>
    );
}
