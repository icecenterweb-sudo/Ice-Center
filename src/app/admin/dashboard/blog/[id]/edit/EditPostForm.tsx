'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Save, Eye, Loader2, Trash2 } from 'lucide-react';
import BlogImageUpload from '@/components/admin/BlogImageUpload';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fieldClass } from '@/lib/form-classes';

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

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    coverImage: string | null;
    thumbnail: string | null;
    content: unknown; // JsonValue from Prisma
    seoTitle: string | null;
    seoDescription: string | null;
    keywords: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
    categoryId: number | null;
    tags: { id: number }[];
}

interface EditPostFormProps {
    post: BlogPost;
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

export default function EditPostForm({ post, categories, tags }: EditPostFormProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<object>(
        post.content || { type: 'doc', content: [{ type: 'paragraph' }] }
    );

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            title: post.title,
            slug: post.slug,
            summary: post.summary || '',
            coverImage: post.coverImage || '',
            thumbnail: post.thumbnail || '',
            seoTitle: post.seoTitle || '',
            seoDescription: post.seoDescription || '',
            keywords: post.keywords.join(', '),
            status: post.status,
            categoryId: post.categoryId?.toString() || '',
            tagIds: post.tags.map((t) => t.id),
        },
    });

    const formValues = watch();

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

            const response = await fetch(`/api/blog/${post.slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'خطا در بروزرسانی پست');
            }

            router.push('/admin/dashboard/blog');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطای ناشناخته');
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/blog/${post.slug}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('خطا در حذف پست');
            }

            setShowDeleteConfirm(false);
            router.push('/admin/dashboard/blog');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطای ناشناخته');
            setDeleting(false);
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
                        <h1 className="text-2xl font-bold text-gray-800">ویرایش پست</h1>
                        <p className="text-gray-500 text-sm">{post.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        حذف
                    </button>
                    <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        مشاهده
                    </Link>
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
                        ذخیره تغییرات
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
                            عنوان پست <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('title')}
                            aria-invalid={!!errors.title}
                            aria-describedby={errors.title ? 'title-error' : undefined}
                            className={fieldClass(
                                "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white",
                                !!errors.title
                            )}
                        />
                        {errors.title && (
                            <p id="title-error" className="text-xs font-medium text-red-600 mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Slug */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            اسلاگ (URL) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">/blog/</span>
                            <input
                                type="text"
                                {...register('slug')}
                                aria-invalid={!!errors.slug}
                                aria-describedby={errors.slug ? 'slug-error' : undefined}
                                className={fieldClass(
                                    "flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent text-gray-900 bg-white",
                                    !!errors.slug
                                )}
                            />
                        </div>
                        {errors.slug && (
                            <p id="slug-error" className="text-xs font-medium text-red-600 mt-1">{errors.slug.message}</p>
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
                            maxLength={160}
                            rows={3}
                            aria-invalid={!!errors.summary}
                            aria-describedby={errors.summary ? 'summary-error' : undefined}
                            className={fieldClass(
                                "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent resize-none text-gray-900 bg-white",
                                !!errors.summary
                            )}
                        />
                        {errors.summary && (
                            <p id="summary-error" className="text-xs font-medium text-red-600 mt-1">{errors.summary.message}</p>
                        )}
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
                            {tags.length === 0 && (
                                <span className="text-sm text-gray-400">برچسبی موجود نیست</span>
                            )}
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
                                aria-invalid={!!errors.seoTitle}
                                aria-describedby={errors.seoTitle ? 'seoTitle-error' : undefined}
                                className={fieldClass(
                                    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean text-gray-900 bg-white",
                                    !!errors.seoTitle
                                )}
                            />
                            {errors.seoTitle && (
                                <p id="seoTitle-error" className="text-xs font-medium text-red-600 mt-1">{errors.seoTitle.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                توضیحات سئو (۱۶۰ کاراکتر)
                            </label>
                            <textarea
                                {...register('seoDescription')}
                                maxLength={160}
                                rows={2}
                                aria-invalid={!!errors.seoDescription}
                                aria-describedby={errors.seoDescription ? 'seoDescription-error' : undefined}
                                className={fieldClass(
                                    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean resize-none text-gray-900 bg-white",
                                    !!errors.seoDescription
                                )}
                            />
                            {errors.seoDescription && (
                                <p id="seoDescription-error" className="text-xs font-medium text-red-600 mt-1">{errors.seoDescription.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                کلمات کلیدی
                            </label>
                            <input
                                type="text"
                                {...register('keywords')}
                                aria-invalid={!!errors.keywords}
                                aria-describedby={errors.keywords ? 'keywords-error' : undefined}
                                className={fieldClass(
                                    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean text-gray-900 bg-white",
                                    !!errors.keywords
                                )}
                                placeholder="کلمه۱, کلمه۲, کلمه۳"
                            />
                            {errors.keywords && (
                                <p id="keywords-error" className="text-xs font-medium text-red-600 mt-1">{errors.keywords.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                title="حذف پست"
                message="آیا از حذف این پست مطمئن هستید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف پست"
                isPending={deleting}
                onConfirm={handleDelete}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </form>
    );
}
