'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, FileImage, ImageIcon, Link as LinkIcon, Loader2, Upload } from 'lucide-react';
import MediaGalleryModal from '@/components/admin/MediaGalleryModal';
import { fieldClass } from '@/lib/form-classes';

interface Product {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

type LinkType = 'url' | 'product' | 'category' | 'none';

export default function EditSlideClient({ id }: { id: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
    const [isUploadingMobile, setIsUploadingMobile] = useState(false);

    const clearFieldError = (name: string) => {
        setFieldErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    // File input refs
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [desktopImage, setDesktopImage] = useState('');
    const [mobileImage, setMobileImage] = useState('');
    const [desktopPreview, setDesktopPreview] = useState('');
    const [mobilePreview, setMobilePreview] = useState('');
    const [alt, setAlt] = useState('');
    const [linkType, setLinkType] = useState<LinkType>('none');
    const [customLink, setCustomLink] = useState('');
    const [productId, setProductId] = useState<number | null>(null);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [order, setOrder] = useState('');

    // Data for selects
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Media Gallery Modal State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<'desktop' | 'mobile'>('desktop');

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            if (desktopPreview.startsWith('blob:')) URL.revokeObjectURL(desktopPreview);
            if (mobilePreview.startsWith('blob:')) URL.revokeObjectURL(mobilePreview);
        };
    }, [desktopPreview, mobilePreview]);

    // Load slide data
    useEffect(() => {
        async function loadData() {
            try {
                const [slideRes, productsRes, categoriesRes] = await Promise.all([
                    fetch(`/api/slides/${id}`),
                    fetch('/api/products?limit=100'),
                    fetch('/api/categories'),
                ]);

                const slideData = await slideRes.json();
                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                if (productsData.data) setProducts(productsData.data);
                if (categoriesData.data) setCategories(categoriesData.data);

                if (slideData.success && slideData.slide) {
                    const slide = slideData.slide;
                    setTitle(slide.title || '');
                    setDesktopImage(slide.desktopImage);
                    setMobileImage(slide.mobileImage);
                    setDesktopPreview(slide.desktopImage);
                    setMobilePreview(slide.mobileImage);
                    setAlt(slide.alt);
                    setIsActive(slide.isActive);
                    setOrder(slide.order.toString());

                    if (slide.productId) {
                        setLinkType('product');
                        setProductId(slide.productId);
                    } else if (slide.categoryId) {
                        setLinkType('category');
                        setCategoryId(slide.categoryId);
                    } else if (slide.link) {
                        setLinkType('url');
                        setCustomLink(slide.link);
                    } else {
                        setLinkType('none');
                    }
                } else {
                    setError('اسلاید یافت نشد');
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('خطا در بارگذاری اطلاعات');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    const handleImageUpload = async (file: File, type: 'desktop' | 'mobile') => {
        if (type === 'desktop') setIsUploadingDesktop(true);
        else setIsUploadingMobile(true);

        const localUrl = URL.createObjectURL(file);
        if (type === 'desktop') {
            if (desktopPreview.startsWith('blob:')) URL.revokeObjectURL(desktopPreview);
            setDesktopPreview(localUrl);
        } else {
            if (mobilePreview.startsWith('blob:')) URL.revokeObjectURL(mobilePreview);
            setMobilePreview(localUrl);
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'sliders');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.url) {
                if (type === 'desktop') {
                    setDesktopImage(data.url);
                } else {
                    setMobileImage(data.url);
                }
            } else {
                setError(data.error || 'خطا در آپلود تصویر');
                if (type === 'desktop') {
                    setDesktopPreview('');
                    URL.revokeObjectURL(localUrl);
                } else {
                    setMobilePreview('');
                    URL.revokeObjectURL(localUrl);
                }
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('خطا در آپلود تصویر');
            if (type === 'desktop') {
                setDesktopPreview('');
                URL.revokeObjectURL(localUrl);
            } else {
                setMobilePreview('');
                URL.revokeObjectURL(localUrl);
            }
        } finally {
            if (type === 'desktop') setIsUploadingDesktop(false);
            else setIsUploadingMobile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const newFieldErrors: Record<string, string> = {};
        if (!desktopImage.trim()) {
            newFieldErrors.desktopImage = 'تصویر دسکتاپ الزامی است';
        }
        if (!mobileImage.trim()) {
            newFieldErrors.mobileImage = 'تصویر موبایل الزامی است';
        }
        if (!alt.trim()) {
            newFieldErrors.alt = 'متن جایگزین (alt) الزامی است';
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            setError(Object.values(newFieldErrors)[0]);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/slides/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title || null,
                    desktopImage,
                    mobileImage,
                    alt,
                    link: linkType === 'url' ? customLink : null,
                    productId: linkType === 'product' ? productId : null,
                    categoryId: linkType === 'category' ? categoryId : null,
                    isActive,
                    order: order ? parseInt(order) : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/dashboard/appearance/slides');
                router.refresh();
            } else {
                if (data.fieldErrors) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(data.fieldErrors)) {
                        if (Array.isArray(v) && v[0]) flat[k] = v[0] as string;
                        else if (typeof v === 'string') flat[k] = v;
                    }
                    setFieldErrors(flat);
                }
                setError(data.error || 'خطا در به‌روزرسانی اسلاید');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('خطا در به‌روزرسانی اسلاید');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-ocean animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin/dashboard/appearance/slides"
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">ویرایش بنر هیرو (بالای صفحه)</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        تصاویر اسلاید
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عنوان (اختیاری)</label>
                        <input
                            type="text"
                            value={title}
                            aria-invalid={!!fieldErrors.title}
                            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                clearFieldError('title');
                            }}
                            placeholder="مثال: تخفیف ویژه یلدا"
                            className={fieldClass(
                                "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                !!fieldErrors.title
                            )}
                        />
                        {fieldErrors.title && (
                            <p id="title-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            تصویر دسکتاپ <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={desktopImage}
                                aria-invalid={!!fieldErrors.desktopImage}
                                aria-describedby={fieldErrors.desktopImage ? 'desktopImage-error' : undefined}
                                onChange={(e) => {
                                    setDesktopImage(e.target.value);
                                    setDesktopPreview(e.target.value);
                                    clearFieldError('desktopImage');
                                }}
                                placeholder="آدرس (URL) تصویر دسکتاپ"
                                className={fieldClass(
                                    "flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                    !!fieldErrors.desktopImage
                                )}
                            />
                            <input
                                type="file"
                                ref={desktopInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(file, 'desktop');
                                        clearFieldError('desktopImage');
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => desktopInputRef.current?.click()}
                                disabled={isUploadingDesktop}
                                className="px-4 py-3 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploadingDesktop ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                آپلود
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setGalleryTarget('desktop');
                                    setIsGalleryOpen(true);
                                    clearFieldError('desktopImage');
                                }}
                                className="px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2 font-medium text-xs md:text-sm shrink-0"
                            >
                                <FileImage className="w-4 h-4 text-ocean" />
                                انتخاب از گالری
                            </button>
                        </div>
                        {fieldErrors.desktopImage && (
                            <p id="desktopImage-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.desktopImage}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">اندازه پیشنهادی: 1920×400 پیکسل</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            تصویر موبایل <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={mobileImage}
                                aria-invalid={!!fieldErrors.mobileImage}
                                aria-describedby={fieldErrors.mobileImage ? 'mobileImage-error' : undefined}
                                onChange={(e) => {
                                    setMobileImage(e.target.value);
                                    setMobilePreview(e.target.value);
                                    clearFieldError('mobileImage');
                                }}
                                placeholder="آدرس (URL) تصویر موبایل"
                                className={fieldClass(
                                    "flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                    !!fieldErrors.mobileImage
                                )}
                            />
                            <input
                                type="file"
                                ref={mobileInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(file, 'mobile');
                                        clearFieldError('mobileImage');
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => mobileInputRef.current?.click()}
                                disabled={isUploadingMobile}
                                className="px-4 py-3 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploadingMobile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                آپلود
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setGalleryTarget('mobile');
                                    setIsGalleryOpen(true);
                                    clearFieldError('mobileImage');
                                }}
                                className="px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2 font-medium text-xs md:text-sm shrink-0"
                            >
                                <FileImage className="w-4 h-4 text-ocean" />
                                انتخاب از گالری
                            </button>
                        </div>
                        {fieldErrors.mobileImage && (
                            <p id="mobileImage-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mobileImage}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">اندازه پیشنهادی موبایل: 800×860 پیکسل (بنر اصلی) یا 500×600 پیکسل (بنرهای دوتایی)</p>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileImage(desktopImage);
                                setMobilePreview(desktopImage);
                                clearFieldError('mobileImage');
                            }}
                            className="text-xs text-ocean hover:underline mt-1"
                        >
                            استفاده از تصویر دسکتاپ
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            متن جایگزین (alt) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={alt}
                            aria-invalid={!!fieldErrors.alt}
                            aria-describedby={fieldErrors.alt ? 'alt-error' : undefined}
                            onChange={(e) => {
                                setAlt(e.target.value);
                                clearFieldError('alt');
                            }}
                            placeholder="توضیح تصویر برای موتورهای جستجو"
                            className={fieldClass(
                                "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900",
                                !!fieldErrors.alt
                            )}
                        />
                        {fieldErrors.alt && (
                            <p id="alt-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.alt}</p>
                        )}
                    </div>

                    {/* Preview */}
                    {(desktopPreview || mobilePreview) && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">پیش‌نمایش</label>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Desktop Preview */}
                                {desktopPreview && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            دسکتاپ (1920×400)
                                        </p>
                                        <div className="relative w-full h-[100px] bg-gray-100 rounded-xl overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={desktopPreview}
                                                alt="Desktop Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/no-image.svg';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Mobile Preview */}
                                {mobilePreview && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            موبایل (768×400)
                                        </p>
                                        <div className="relative w-[180px] h-[95px] bg-gray-100 rounded-lg overflow-hidden mx-auto lg:mx-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={mobilePreview}
                                                alt="Mobile Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/no-image.svg';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        لینک‌دهی
                    </h2>

                    <div className="flex gap-4 flex-wrap">
                        {[
                            { value: 'none', label: 'بدون لینک' },
                            { value: 'url', label: 'آدرس اینترنتی' },
                            { value: 'product', label: 'محصول' },
                            { value: 'category', label: 'دسته‌بندی' },
                        ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="linkType"
                                    value={option.value}
                                    checked={linkType === option.value}
                                    onChange={(e) => {
                                        setLinkType(e.target.value as LinkType);
                                        clearFieldError('link');
                                    }}
                                    className="w-4 h-4 text-ocean"
                                />
                                <span className="text-sm text-gray-900">{option.label}</span>
                            </label>
                        ))}
                    </div>

                    {linkType === 'url' && (
                        <div>
                            <input
                                type="text"
                                value={customLink}
                                aria-invalid={!!fieldErrors.link}
                                aria-describedby={fieldErrors.link ? 'link-error' : undefined}
                                onChange={(e) => {
                                    setCustomLink(e.target.value);
                                    clearFieldError('link');
                                }}
                                placeholder="https://example.com/page"
                                className={fieldClass(
                                    "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none text-gray-900",
                                    !!fieldErrors.link
                                )}
                            />
                            {fieldErrors.link && (
                                <p id="link-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.link}</p>
                            )}
                        </div>
                    )}

                    {linkType === 'product' && (
                        <div>
                            <select
                                value={productId || ''}
                                aria-invalid={!!fieldErrors.productId}
                                aria-describedby={fieldErrors.productId ? 'productId-error' : undefined}
                                onChange={(e) => {
                                    setProductId(e.target.value ? parseInt(e.target.value) : null);
                                    clearFieldError('productId');
                                }}
                                className={fieldClass(
                                    "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none text-gray-900",
                                    !!fieldErrors.productId
                                )}
                            >
                                <option value="">انتخاب محصول...</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {fieldErrors.productId && (
                                <p id="productId-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.productId}</p>
                            )}
                        </div>
                    )}

                    {linkType === 'category' && (
                        <div>
                            <select
                                value={categoryId || ''}
                                aria-invalid={!!fieldErrors.categoryId}
                                aria-describedby={fieldErrors.categoryId ? 'categoryId-error' : undefined}
                                onChange={(e) => {
                                    setCategoryId(e.target.value ? parseInt(e.target.value) : null);
                                    clearFieldError('categoryId');
                                }}
                                className={fieldClass(
                                    "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none text-gray-900",
                                    !!fieldErrors.categoryId
                                )}
                            >
                                <option value="">انتخاب دسته‌بندی...</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {fieldErrors.categoryId && (
                                <p id="categoryId-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.categoryId}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-bold text-gray-800">تنظیمات</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ترتیب نمایش</label>
                        <input
                            type="number"
                            value={order}
                            aria-invalid={!!fieldErrors.order}
                            aria-describedby={fieldErrors.order ? 'order-error' : undefined}
                            onChange={(e) => {
                                setOrder(e.target.value);
                                clearFieldError('order');
                            }}
                            min="0"
                            className={fieldClass(
                                "w-32 px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none text-gray-900",
                                !!fieldErrors.order
                            )}
                        />
                        {fieldErrors.order && (
                            <p id="order-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.order}</p>
                        )}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-gray-300 text-ocean"
                        />
                        <span className="text-sm text-gray-900">فعال (نمایش در صفحه اصلی)</span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-ocean text-white rounded-xl font-medium hover:bg-ocean/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        'ذخیره تغییرات'
                    )}
                </button>
            </form>

            <MediaGalleryModal
                isOpen={isGalleryOpen}
                targetSize={galleryTarget === 'desktop' ? '1920x400' : '768x400'}
                onClose={() => setIsGalleryOpen(false)}
                onSelect={(url) => {
                    if (galleryTarget === 'desktop') {
                        setDesktopImage(url);
                        setDesktopPreview(url);
                    } else {
                        setMobileImage(url);
                        setMobilePreview(url);
                    }
                }}
            />
        </div>
    );
}
