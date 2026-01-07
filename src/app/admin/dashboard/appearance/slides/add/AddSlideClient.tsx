'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Image, Link as LinkIcon, Loader2, Upload } from 'lucide-react';

interface Product {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

type LinkType = 'url' | 'product' | 'category' | 'none';

export default function AddSlidePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
    const [isUploadingMobile, setIsUploadingMobile] = useState(false);

    // File input refs
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [desktopImage, setDesktopImage] = useState('');
    const [mobileImage, setMobileImage] = useState('');
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
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Load products and categories
    useEffect(() => {
        async function loadData() {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('/api/products?limit=100'),
                    fetch('/api/categories'),
                ]);

                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                if (productsData.data) setProducts(productsData.data);
                if (categoriesData.data) setCategories(categoriesData.data);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setIsLoadingData(false);
            }
        }
        loadData();
    }, []);

    // Handle image upload
    const handleImageUpload = async (file: File, type: 'desktop' | 'mobile') => {
        if (type === 'desktop') setIsUploadingDesktop(true);
        else setIsUploadingMobile(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'slides');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.url) {
                if (type === 'desktop') setDesktopImage(data.url);
                else setMobileImage(data.url);
            } else {
                setError(data.error || 'خطا در آپلود تصویر');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('خطا در آپلود تصویر');
        } finally {
            if (type === 'desktop') setIsUploadingDesktop(false);
            else setIsUploadingMobile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!desktopImage.trim()) {
            setError('تصویر دسکتاپ الزامی است');
            return;
        }

        if (!mobileImage.trim()) {
            setError('تصویر موبایل الزامی است');
            return;
        }

        if (!alt.trim()) {
            setError('متن جایگزین (alt) الزامی است');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/slides', {
                method: 'POST',
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
                setError(data.error || 'خطا در ایجاد اسلاید');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('خطا در ایجاد اسلاید');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Placeholder images for quick testing
    const placeholderImages = [
        'https://via.placeholder.com/1920x380/3b82f6/ffffff?text=Slide+1',
        'https://via.placeholder.com/1920x380/10b981/ffffff?text=Slide+2',
        'https://via.placeholder.com/1920x380/8b5cf6/ffffff?text=Slide+3',
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin/dashboard/appearance/slides"
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">افزودن اسلاید</h1>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        تصاویر اسلاید
                    </h2>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            عنوان (اختیاری)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: تخفیف ویژه یلدا"
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                        />
                    </div>

                    {/* Desktop Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            تصویر دسکتاپ <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={desktopImage}
                                onChange={(e) => setDesktopImage(e.target.value)}
                                placeholder="آدرس (URL) تصویر دسکتاپ"
                                className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                            />
                            <input
                                type="file"
                                ref={desktopInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, 'desktop');
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => desktopInputRef.current?.click()}
                                disabled={isUploadingDesktop}
                                className="px-4 py-3 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploadingDesktop ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                                آپلود
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">اندازه پیشنهادی: 1920×400 پیکسل (نسبت 5:1)</p>
                        {/* Quick placeholder buttons */}
                        <div className="flex gap-2 mt-2">
                            {placeholderImages.map((url, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setDesktopImage(url)}
                                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    پیش‌فرض {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            تصویر موبایل <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={mobileImage}
                                onChange={(e) => setMobileImage(e.target.value)}
                                placeholder="آدرس (URL) تصویر موبایل"
                                className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                            />
                            <input
                                type="file"
                                ref={mobileInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, 'mobile');
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => mobileInputRef.current?.click()}
                                disabled={isUploadingMobile}
                                className="px-4 py-3 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploadingMobile ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                                آپلود
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">اندازه پیشنهادی: 768×180 پیکسل (نسبت 4:1)</p>
                        <button
                            type="button"
                            onClick={() => setMobileImage(desktopImage)}
                            className="text-xs text-ocean hover:underline mt-1"
                        >
                            استفاده از تصویر دسکتاپ
                        </button>
                    </div>

                    {/* Alt Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            متن جایگزین (alt) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                            placeholder="توضیح تصویر برای موتورهای جستجو"
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                        />
                    </div>

                    {/* Preview */}
                    {(desktopImage || mobileImage) && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">پیش‌نمایش</label>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Desktop Preview */}
                                {desktopImage && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            دسکتاپ (1920×400)
                                        </p>
                                        <div className="relative w-full h-[100px] bg-gray-100 rounded-xl overflow-hidden">
                                            <img
                                                src={desktopImage}
                                                alt="Desktop Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1920x400/gray/white?text=Image+Error';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Mobile Preview */}
                                {mobileImage && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            موبایل (768×180)
                                        </p>
                                        <div className="relative w-[180px] h-[45px] bg-gray-100 rounded-lg overflow-hidden mx-auto lg:mx-0">
                                            <img
                                                src={mobileImage}
                                                alt="Mobile Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/768x180/gray/white?text=Image+Error';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Link Type */}
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
                                    onChange={(e) => setLinkType(e.target.value as LinkType)}
                                    className="w-4 h-4 text-ocean"
                                />
                                <span className="text-sm text-gray-900">{option.label}</span>
                            </label>
                        ))}
                    </div>

                    {linkType === 'url' && (
                        <input
                            type="text"
                            value={customLink}
                            onChange={(e) => setCustomLink(e.target.value)}
                            placeholder="https://example.com/page"
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                        />
                    )}

                    {linkType === 'product' && (
                        <select
                            value={productId || ''}
                            onChange={(e) => setProductId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                        >
                            <option value="">انتخاب محصول...</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}

                    {linkType === 'category' && (
                        <select
                            value={categoryId || ''}
                            onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                        >
                            <option value="">انتخاب دسته‌بندی...</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-bold text-gray-800">تنظیمات</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ترتیب نمایش</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(e.target.value)}
                                placeholder="خودکار"
                                min="0"
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-ocean/20 focus:bg-white transition-all outline-none text-gray-900"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-gray-300 text-ocean focus:ring-ocean"
                        />
                        <span className="text-sm text-gray-900">فعال (نمایش در صفحه اصلی)</span>
                    </label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-ocean text-white rounded-xl font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            در حال ثبت...
                        </>
                    ) : (
                        'افزودن اسلاید'
                    )}
                </button>
            </form>
        </div>
    );
}
