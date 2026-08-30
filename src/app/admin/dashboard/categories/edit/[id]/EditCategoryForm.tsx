'use client';

import { updateCategory } from '@/app/actions/categories';
import { ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/admin/ImageUpload';
import { slugify } from '@/lib/slugify-client';
import { fieldClass } from '@/lib/form-classes';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    order: number;
}

interface EditCategoryFormProps {
    category: Category;
}

export default function EditCategoryForm({ category }: EditCategoryFormProps) {
    const router = useRouter();
    const [name, setName] = useState(category.name);
    const [slug, setSlug] = useState(category.slug);
    const [, setImageUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (fieldName: string) => {
        setFieldErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    };

    // Auto-generate slug from name with Persian support
    const handleNameChange = (value: string) => {
        setName(value);
        setSlug(slugify(value));
        clearFieldError('name');
        clearFieldError('slug');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});
        const formData = new FormData(e.currentTarget);
        setIsSubmitting(true);
        const t = toast.loading('در حال به‌روزرسانی دسته‌بندی...');

        try {
            const res = await updateCategory(category.id, formData);
            if (res.success) {
                toast.success('دسته‌بندی با موفقیت به‌روزرسانی شد', { id: t });
                router.push('/admin/dashboard/categories');
                router.refresh();
            } else {
                if (res.fieldErrors) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(res.fieldErrors)) {
                        if (v?.[0]) flat[k] = v[0];
                    }
                    setFieldErrors(flat);
                }
                toast.error(res.error || 'خطا در ویرایش دسته‌بندی', { id: t });
            }
        } catch {
            toast.error('خطای غیرمنتظره رخ داد', { id: t });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard/categories"
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors text-gray-700"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ویرایش دسته‌بندی</h1>
                    <p className="text-gray-500 text-sm mt-1">ویرایش اطلاعات دسته‌بندی &quot;{category.name}&quot;</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            نام دسته‌بندی<span className="text-red-500">*</span>
                        </label>
                        <span className={`text-xs font-mono ${name.length > 60 ? 'text-red-500' : name.length > 40 ? 'text-orange-500' : name.length > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                            {name.length}/60
                        </span>
                    </div>
                    <input
                        name="name"
                        type="text"
                        value={name}
                        maxLength={60}
                        aria-invalid={!!fieldErrors.name}
                        aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="مثال: دستگاه بستنی قیفی"
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900",
                            !!fieldErrors.name
                        )}
                        required
                    />
                    {fieldErrors.name && (
                        <p id="name-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">💡</span>
                        <span>نام واضح و مختصر - بهینه برای سئو: 30-50 کاراکتر</span>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسلاگ (Slug)<span className="text-red-500">*</span>
                    </label>
                    <input
                        name="slug"
                        type="text"
                        value={slug}
                        pattern="[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\-]+"
                        aria-invalid={!!fieldErrors.slug}
                        aria-describedby={fieldErrors.slug ? 'slug-error' : undefined}
                        onChange={(e) => {
                            setSlug(e.target.value);
                            clearFieldError('slug');
                        }}
                        placeholder="دستگاه-بستنی-قیفی"
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 font-mono",
                            !!fieldErrors.slug
                        )}
                        dir="ltr"
                        required
                    />
                    {fieldErrors.slug && (
                        <p id="slug-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.slug}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5">
                        آدرس URL دسته‌بندی (خودکار از نام ایجاد می‌شود، قابل ویرایش)
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                        <span className="text-xs font-mono text-gray-400">اختیاری</span>
                    </div>
                    <textarea
                        name="description"
                        rows={4}
                        maxLength={200}
                        defaultValue={category.description || ''}
                        aria-invalid={!!fieldErrors.description}
                        aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                        onChange={() => clearFieldError('description')}
                        placeholder="توضیحات کوتاه درباره این دسته‌بندی..."
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none resize-none text-gray-900",
                            !!fieldErrors.description
                        )}
                    />
                    {fieldErrors.description && (
                        <p id="description-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">💡</span>
                        <span>توضیحات برای سئو و نمایش در صفحه دسته‌بندی - توصیه: 100-160 کاراکتر</span>
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">ترتیب نمایش</label>
                        <span className="text-xs font-mono text-gray-400">پیش‌فرض: ۰</span>
                    </div>
                    <input
                        name="order"
                        type="number"
                        defaultValue={category.order ?? 0}
                        aria-invalid={!!fieldErrors.order}
                        aria-describedby={fieldErrors.order ? 'order-error' : undefined}
                        onChange={() => clearFieldError('order')}
                        placeholder="0"
                        className={fieldClass(
                            "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900",
                            !!fieldErrors.order
                        )}
                    />
                    {fieldErrors.order && (
                        <p id="order-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.order}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">💡</span>
                        <span>اعداد کمتر در اولویت بالاتر نمایش داده می‌شوند (مثلاً ۱ قبل از ۲ نمایش داده می‌شود)</span>
                    </p>
                </div>

                <ImageUpload currentImage={category.image} onImageChange={setImageUrl} folder="categories" />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-ocean hover:bg-royal text-white font-bold py-4 rounded-xl shadow-lg shadow-ocean/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <span>در حال ذخیره...</span>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            ذخیره تغییرات
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
