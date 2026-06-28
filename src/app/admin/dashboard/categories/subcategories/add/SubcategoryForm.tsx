'use client';

import { createSubcategory } from '@/app/actions/categories';
import { ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface SubcategoryFormProps {
    categories: Category[];
    defaultCategoryId: number | null;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
            {pending ? 'در حال ذخیره...' : (
                <>
                    <Save className="w-5 h-5 inline ml-2" />
                    ذخیره زیردسته
                </>
            )}
        </button>
    );
}

export default function SubcategoryForm({ categories, defaultCategoryId }: SubcategoryFormProps) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [nameLength, setNameLength] = useState(0);

    // Auto-generate slug from name
    const handleNameChange = (value: string) => {
        setName(value);
        setNameLength(value.length);
        const autoSlug = value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
        setSlug(autoSlug);
    };

    const handleSubmit = async (formData: FormData) => {
        try {
            await createSubcategory(formData);
            toast.success('زیردسته با موفقیت ایجاد شد');
            // Note: redirect will happen in the server action
        } catch (error: unknown) {
            // Ignore NEXT_REDIRECT errors (these are expected from server action redirects)
            if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                return;
            }
            toast.error(error instanceof Error ? error.message : 'خطا در ایجاد زیردسته');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard/categories"
                    className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">افزودن زیردسته جدید</h1>
                    <p className="text-gray-500 text-sm mt-1">ایجاد زیردسته برای دسته‌بندی اصلی</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                {/* Category Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        دسته‌بندی اصلی<span className="text-red-500">*</span>
                    </label>
                    <select
                        name="categoryId"
                        defaultValue={defaultCategoryId || ''}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white transition-all outline-none text-gray-900"
                    >
                        <option value="">انتخاب کنید</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">
                        دسته‌بندی اصلی که این زیردسته به آن تعلق دارد
                    </p>
                </div>

                {/* Name */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            نام زیردسته<span className="text-red-500">*</span>
                        </label>
                        <span className={`text-xs font-mono ${nameLength > 60 ? 'text-red-500' : nameLength > 40 ? 'text-orange-500' : nameLength > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                            {nameLength}/60
                        </span>
                    </div>
                    <input
                        name="name"
                        type="text"
                        value={name}
                        maxLength={60}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="مثال: دستگاه بستنی ایتالیایی"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white transition-all outline-none text-gray-900"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">💡</span>
                        <span>نام واضح و مختصر - بهینه برای سئو: 30-50 کاراکتر</span>
                    </p>
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسلاگ (Slug)<span className="text-red-500">*</span>
                    </label>
                    <input
                        name="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="italian-ice-cream"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white transition-all outline-none text-gray-900 font-mono dir-ltr text-right"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                        آدرس URL زیردسته (خودکار از نام ایجاد می‌شود، قابل ویرایش)
                    </p>
                </div>

                {/* Description */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                        <span className="text-xs font-mono text-gray-400">اختیاری</span>
                    </div>
                    <textarea
                        name="description"
                        rows={4}
                        maxLength={200}
                        placeholder="توضیحات کوتاه درباره این زیردسته..."
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white transition-all outline-none resize-none text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">💡</span>
                        <span>توضیحات برای سئو و نمایش در صفحه دسته‌بندی - توصیه: 100-160 کاراکتر</span>
                    </p>
                </div>

                <SubmitButton />
            </form>
        </div>
    );
}
