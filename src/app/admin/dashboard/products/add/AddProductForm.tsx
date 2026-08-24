'use client';

import { createProduct } from '@/app/actions/products';
import { ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import FeaturesManager from '@/components/admin/FeaturesManager';
import SpecificationsManager from '@/components/admin/SpecificationsManager';
import { fieldClass } from '@/lib/form-classes';

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

export default function AddProductForm({ subcategories }: AddProductFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [nameLength, setNameLength] = useState(0);
    const [descLength, setDescLength] = useState(0);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [specifications, setSpecifications] = useState<Record<string, string>>({});

    const clearFieldError = (name: string) => {
        setFieldErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});
        const formData = new FormData(e.currentTarget);
        setIsSubmitting(true);
        const t = toast.loading('در حال ثبت محصول جدید...');

        try {
            const res = await createProduct(formData);
            if (res.success) {
                toast.success('محصول با موفقیت ایجاد شد', { id: t });
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
                toast.error(res.error || 'خطا در ثبت محصول', { id: t });
            }
        } catch {
            toast.error('خطای غیرمنتظره رخ داد', { id: t });
        } finally {
            setIsSubmitting(false);
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">افزودن محصول جدید</h1>
                    <p className="text-gray-500 text-sm mt-1">مشخصات محصول جدید را با دقت وارد کنید</p>
                </div>
                <Link
                    href="/admin/dashboard/products"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                    <ArrowRight className="w-4 h-4" />
                    بازگشت به لیست
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">اطلاعات پایه</h2>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        نام محصول <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-xs text-gray-400">{nameLength}/150</span>
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    maxLength={150}
                                    aria-invalid={!!fieldErrors.name}
                                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                                    onChange={(e) => {
                                        setNameLength(e.target.value.length);
                                        clearFieldError('name');
                                    }}
                                    placeholder="مثال: دستگاه بستنی ساز قیفی شمس مدل سناتور"
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 text-sm",
                                        !!fieldErrors.name
                                    )}
                                />
                                {fieldErrors.name && (
                                    <p id="name-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                                )}
                            </div>

                            {/* Optional Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    اسلاگ دلخواه (اختیاری)
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    pattern="[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\-]+"
                                    aria-invalid={!!fieldErrors.slug}
                                    aria-describedby={fieldErrors.slug ? 'slug-error' : undefined}
                                    onChange={() => clearFieldError('slug')}
                                    placeholder="در صورت خالی بودن، خودکار تولید می‌شود"
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 text-sm font-mono",
                                        !!fieldErrors.slug
                                    )}
                                    dir="ltr"
                                />
                                {fieldErrors.slug ? (
                                    <p id="slug-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.slug}</p>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-1">حروف فارسی، انگلیسی، اعداد و خط تیره مجاز است</p>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">توضیحات محصول</label>
                                    <span className="text-xs text-gray-400">{descLength}/2000</span>
                                </div>
                                <textarea
                                    name="description"
                                    rows={5}
                                    maxLength={2000}
                                    aria-invalid={!!fieldErrors.description}
                                    aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                                    onChange={(e) => {
                                        setDescLength(e.target.value.length);
                                        clearFieldError('description');
                                    }}
                                    placeholder="توضیحات کامل درباره ویژگی‌ها، کاربرد و مزایای محصول..."
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 text-sm leading-relaxed",
                                        !!fieldErrors.description
                                    )}
                                />
                                {fieldErrors.description && (
                                    <p id="description-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">تصاویر محصول</h2>
                            <p className="text-gray-500 text-xs mt-1">تصاویر با کیفیت و پس‌زمینه مناسب بارگذاری کنید</p>
                        </div>

                        <MultiImageUpload
                            onImagesChange={setImageUrls}
                            folder="products"
                        />
                    </div>

                    {/* Features & Specifications */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">ویژگی‌ها و مشخصات فنی</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FeaturesManager onChange={setFeatures} />
                            <SpecificationsManager onChange={setSpecifications} />
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    {/* Pricing & Stock */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">قیمت و موجودی</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    قیمت فروش (تومان) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    aria-invalid={!!fieldErrors.price}
                                    aria-describedby={fieldErrors.price ? 'price-error' : undefined}
                                    onChange={() => clearFieldError('price')}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 text-left font-mono",
                                        !!fieldErrors.price
                                    )}
                                    dir="ltr"
                                />
                                {fieldErrors.price && (
                                    <p id="price-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.price}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    قیمت قبل از تخفیف (تومان)
                                </label>
                                <input
                                    type="number"
                                    name="listPrice"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    aria-invalid={!!fieldErrors.listPrice}
                                    aria-describedby={fieldErrors.listPrice ? 'listPrice-error' : undefined}
                                    onChange={() => clearFieldError('listPrice')}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 text-left font-mono",
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">موجودی انبار</label>
                                <input
                                    type="number"
                                    name="stock"
                                    defaultValue="0"
                                    min="0"
                                    aria-invalid={!!fieldErrors.stock}
                                    aria-describedby={fieldErrors.stock ? 'stock-error' : undefined}
                                    onChange={() => clearFieldError('stock')}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 text-left font-mono",
                                        !!fieldErrors.stock
                                    )}
                                    dir="ltr"
                                />
                                {fieldErrors.stock && (
                                    <p id="stock-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.stock}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">برند</label>
                                <input
                                    type="text"
                                    name="brand"
                                    placeholder="مثال: شمس، نیکنام، البرز"
                                    aria-invalid={!!fieldErrors.brand}
                                    aria-describedby={fieldErrors.brand ? 'brand-error' : undefined}
                                    onChange={() => clearFieldError('brand')}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900",
                                        !!fieldErrors.brand
                                    )}
                                />
                                {fieldErrors.brand && (
                                    <p id="brand-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.brand}</p>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">کد محصول (SKU)</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSku(generateSKU());
                                            clearFieldError('sku');
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        تولید خودکار
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    name="sku"
                                    value={sku}
                                    aria-invalid={!!fieldErrors.sku}
                                    aria-describedby={fieldErrors.sku ? 'sku-error' : undefined}
                                    onChange={(e) => {
                                        setSku(e.target.value);
                                        clearFieldError('sku');
                                    }}
                                    className={fieldClass(
                                        "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 font-mono text-left",
                                        !!fieldErrors.sku
                                    )}
                                    dir="ltr"
                                />
                                {fieldErrors.sku && (
                                    <p id="sku-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.sku}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Organization & Status */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">دسته‌بندی و وضعیت</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">دسته اصلی</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        clearFieldError('subcategoryId');
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
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
                                        aria-invalid={!!fieldErrors.subcategoryId}
                                        aria-describedby={fieldErrors.subcategoryId ? 'subcategoryId-error' : undefined}
                                        onChange={() => clearFieldError('subcategoryId')}
                                        className={fieldClass(
                                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900",
                                            !!fieldErrors.subcategoryId
                                        )}
                                    >
                                        <option value="">انتخاب کنید</option>
                                        {filteredSubcategories.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.subcategoryId && (
                                        <p id="subcategoryId-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.subcategoryId}</p>
                                    )}
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

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? (
                            <span>در حال ذخیره...</span>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                ذخیره محصول
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
