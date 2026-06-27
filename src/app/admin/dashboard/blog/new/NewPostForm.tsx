'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Save, Eye, Loader2 } from 'lucide-react';
import BlogImageUpload from '@/components/admin/BlogImageUpload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Dynamically import BlogEditor with SSR disabled to prevent hydration issues
const BlogEditor = dynamic(() => import('@/components/blog/BlogEditor'), {
    ssr: false,
    loading: () => (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
        </div>
    ),
});

interface BlogCategory {
    id: number;
    name: string;
    slug: string;
}

interface BlogTag {
    id: number;
    name: string;
    slug: string;
}

interface NewPostFormProps {
    categories: BlogCategory[];
    tags: BlogTag[];
}

// Validation schema
const postSchema = z.object({
    title: z.string().min(1, 'عنوان الزامی است').max(200),
    slug: z.string().min(1, 'اسلاگ الزامی است').regex(/^[a-z0-9-]+$/, 'اسلاگ فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره'),
    summary: z.string().max(160).optional(),
    coverImage: z.string().optional(),
    thumbnail: z.string().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    keywords: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']),
    categoryId: z.string().optional(),
    tagIds: z.array(z.number()),
});

type PostFormData = z.infer<typeof postSchema>;

export default function NewPostForm({ categories, tags }: NewPostFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<object>({
        type: 'doc',
        content: [{ type: 'paragraph' }],
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: '',
            slug: '',
            summary: '',
            coverImage: '',
            thumbnail: '',
            seoTitle: '',
            seoDescription: '',
            keywords: '',
            status: 'DRAFT',
            categoryId: '',
            tagIds: [],
        },
    });

    const formValues = watch();

    // Auto-generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setValue('title', title);
        if (!formValues.slug) {
            setValue('slug', generateSlug(title));
        }
    };

    const onSubmit = async (data: PostFormData) => {
        setError(null);

        try {
            const payload = {
                ...data,
                content,
                keywords: data.keywords
                    ?.split(',')
                    .map((k) => k.trim())
                    .filter(Boolean) || [],
                categoryId: data.categoryId ? parseInt(data.categoryId) : null,
                summary: data.summary?.trim() || null,
                coverImage: data.coverImage?.trim() || null,
                thumbnail: data.thumbnail?.trim() || null,
                seoTitle: data.seoTitle?.trim() || null,
                seoDescription: data.seoDescription?.trim() || null,
            };

            const response = await fetch('/api/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'خطا در ایجاد پست');
            }

            router.push('/admin/dashboard/blog');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطای ناشناخته');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/dashboard/blog"
                        className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">پست جدید</h1>
                        <p className="text-gray-500 text-sm">یک پست جدید برای وبلاگ ایجاد کنید</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => window.open(`/blog/preview`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        پیش‌نمایش
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-gradient-to-l from-ocean to-sky-breeze text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        ذخیره پست
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            عنوان پست*
                        </label>
                        <input
                            type="text"
                            {...register('title')}
                            onChange={handleTitleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white"
                            placeholder="عنوان پست را وارد کنید..."
                        />
                        {errors.title && (
                            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Slug */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            اسلاگ (URL)*
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">/blog/</span>
                            <input
                                type="text"
                                {...register('slug')}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white"
                                placeholder="slug-example"
                            />
                        </div>
                        {errors.slug && (
                            <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>
                        )}
                    </div>

                    {/* Content Editor */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            محتوا
                        </label>
                        <BlogEditor content={content} onChange={setContent} />
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            خلاصه (حداکثر ۱۶۰ کاراکتر)
                        </label>
                        <textarea
                            {...register('summary')}
                            rows={3}
                            maxLength={160}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent resize-none text-gray-900 bg-white"
                            placeholder="یک خلاصه کوتاه برای پست..."
                        />
                        <div className="text-xs text-gray-400 mt-1 text-left">
                            {(formValues.summary?.length || 0)}/160
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            وضعیت انتشار
                        </label>
                        <select
                            {...register('status')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white"
                        >
                            <option value="DRAFT">پیش‌نویس</option>
                            <option value="PUBLISHED">منتشر شده</option>
                            <option value="SCHEDULED">زمان‌بندی شده</option>
                        </select>
                    </div>

                    {/* Category */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            دسته‌بندی
                        </label>
                        <select
                            {...register('categoryId')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white"
                        >
                            <option value="">بدون دسته‌بندی</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            برچسب‌ها
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <label
                                    key={tag.id}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors ${formValues.tagIds.includes(tag.id)
                                        ? 'bg-ocean text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formValues.tagIds.includes(tag.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setValue('tagIds', [...formValues.tagIds, tag.id]);
                                            } else {
                                                setValue('tagIds', formValues.tagIds.filter((id) => id !== tag.id));
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                    #{tag.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Cover Image */}
                    <BlogImageUpload
                        label="تصویر کاور (برای صفحه پست)"
                        hint="تصویر بزرگ برای نمایش در صفحه پست (پیشنهاد: 1200×630)"
                        value={formValues.coverImage || ''}
                        onChange={(url) => setValue('coverImage', url)}
                        aspectRatio="video"
                    />

                    {/* Thumbnail */}
                    <BlogImageUpload
                        label="تصویر بندانگشتی (برای لیست‌ها)"
                        hint="تصویر کوچک برای کاروسل و لیست‌ها (پیشنهاد: 400×300)"
                        value={formValues.thumbnail || ''}
                        onChange={(url) => setValue('thumbnail', url)}
                        aspectRatio="thumbnail"
                    />

                    {/* SEO Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                        <h3 className="font-medium text-gray-800">تنظیمات سئو</h3>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                عنوان سئو (۶۰ کاراکتر)
                            </label>
                            <input
                                type="text"
                                {...register('seoTitle')}
                                maxLength={60}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean text-gray-900 bg-white"
                                placeholder="عنوان برای موتورهای جستجو..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                توضیحات سئو (۱۶۰ کاراکتر)
                            </label>
                            <textarea
                                {...register('seoDescription')}
                                maxLength={160}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean resize-none text-gray-900 bg-white"
                                placeholder="توضیحات برای موتورهای جستجو..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                کلمات کلیدی (با کاما جدا کنید)
                            </label>
                            <input
                                type="text"
                                {...register('keywords')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean text-gray-900 bg-white"
                                placeholder="کلمه۱, کلمه۲, کلمه۳"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
