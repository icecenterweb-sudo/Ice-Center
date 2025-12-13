'use client';

import { updateCategory } from '@/app/actions/categories';
import { ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
}

interface EditCategoryFormProps {
    category: Category;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
            {pending ? 'در حال بروزرسانی...' : (
                <>
                    <Save className="w-5 h-5 inline ml-2" />
                    بروزرسانی دسته‌بندی
                </>
            )}
        </button>
    );
}

export default function EditCategoryForm({ category }: EditCategoryFormProps) {
    const [name, setName] = useState(category.name);
    const [slug, setSlug] = useState(category.slug);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Auto-generate slug from name
    const handleNameChange = (value: string) => {
        setName(value);
        const autoSlug = value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
        setSlug(autoSlug);
    };

    const handleSubmit = async (formData: FormData) => {
        // Convert image to base64 if exists
        if (imageFile) {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            await new Promise((resolve) => {
                reader.onloadend = () => {
                    formData.append('imageData', reader.result as string);
                    resolve(null);
                };
            });
        }

        return updateCategory(category.id, formData);
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
                    <p className="text-gray-500 text-sm mt-1">ویرایش اطلاعات دسته‌بندی "{category.name}"</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
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
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="مثال: دستگاه بستنی قیفی"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                        required
                    />
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
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="soft-ice-machine"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 font-mono dir-ltr text-right"
                        required
                    />
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
                        placeholder="توضیحات کوتاه درباره این دسته‌بندی..."
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none resize-none text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">💡</span>
                        <span>توضیحات برای سئو و نمایش در صفحه دسته‌بندی - توصیه: 100-160 کاراکتر</span>
                    </p>
                </div>

                <ImageUpload currentImage={category.image} onImageChange={setImageFile} />

                <SubmitButton />
            </form>
        </div>
    );
}
