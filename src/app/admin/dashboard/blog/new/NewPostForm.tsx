'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Save, Eye, Loader2 } from 'lucide-react';
import BlogImageUpload from '@/components/admin/BlogImageUpload';

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

export default function NewPostForm({ categories, tags }: NewPostFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        summary: '',
        coverImage: '',
        thumbnail: '',
        seoTitle: '',
        seoDescription: '',
        keywords: '',
        status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
        categoryId: '',
        tagIds: [] as number[],
    });

    const [content, setContent] = useState<object>({
        type: 'doc',
        content: [{ type: 'paragraph' }],
    });

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
        setFormData({
            ...formData,
            title,
            slug: formData.slug || generateSlug(title),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                content,
                keywords: formData.keywords
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean),
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
                summary: formData.summary.trim() || null,
                coverImage: formData.coverImage.trim() || null,
                thumbnail: formData.thumbnail.trim() || null,
                seoTitle: formData.seoTitle.trim() || null,
                seoDescription: formData.seoDescription.trim() || null,
            };

            const response = await fetch('/api/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'خطا در ایجاد پست');
            }

            router.push('/admin/dashboard/blog');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطای ناشناخته');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6" dir="rtl">
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
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-l from-ocean to-sky-breeze text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? (
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
                            value={formData.title}
                            onChange={handleTitleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white"
                            placeholder="عنوان پست را وارد کنید..."
                        />
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
                                value={formData.slug}
                                onChange={(e) =>
                                    setFormData({ ...formData, slug: e.target.value })
                                }
                                required
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white"
                                placeholder="slug-example"
                            />
                        </div>
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
                            value={formData.summary}
                            onChange={(e) =>
                                setFormData({ ...formData, summary: e.target.value.slice(0, 160) })
                            }
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent resize-none text-gray-900 bg-white"
                            placeholder="یک خلاصه کوتاه برای پست..."
                        />
                        <div className="text-xs text-gray-400 mt-1 text-left">
                            {formData.summary.length}/160
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
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
                                })
                            }
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
                            value={formData.categoryId}
                            onChange={(e) =>
                                setFormData({ ...formData, categoryId: e.target.value })
                            }
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
                                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors ${formData.tagIds.includes(tag.id)
                                        ? 'bg-ocean text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.tagIds.includes(tag.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({
                                                    ...formData,
                                                    tagIds: [...formData.tagIds, tag.id],
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    tagIds: formData.tagIds.filter((id) => id !== tag.id),
                                                });
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
                        value={formData.coverImage}
                        onChange={(url) => setFormData({ ...formData, coverImage: url })}
                        aspectRatio="video"
                    />

                    {/* Thumbnail */}
                    <BlogImageUpload
                        label="تصویر بندانگشتی (برای لیست‌ها)"
                        hint="تصویر کوچک برای کاروسل و لیست‌ها (پیشنهاد: 400×300)"
                        value={formData.thumbnail}
                        onChange={(url) => setFormData({ ...formData, thumbnail: url })}
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
                                value={formData.seoTitle}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        seoTitle: e.target.value.slice(0, 60),
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean text-gray-900 bg-white"
                                placeholder="عنوان برای موتورهای جستجو..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                توضیحات سئو (۱۶۰ کاراکتر)
                            </label>
                            <textarea
                                value={formData.seoDescription}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        seoDescription: e.target.value.slice(0, 160),
                                    })
                                }
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
                                value={formData.keywords}
                                onChange={(e) =>
                                    setFormData({ ...formData, keywords: e.target.value })
                                }
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
