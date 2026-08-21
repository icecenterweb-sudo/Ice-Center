'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Trash2, Edit, Eye, EyeOff, GripVertical, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface Slide {
    id: number;
    title: string | null;
    desktopImage: string;
    mobileImage: string;
    alt: string;
    link: string | null;
    isActive: boolean;
    order: number;
    product: { id: number; name: string; slug: string } | null;
    category: { id: number; name: string; slug: string } | null;
}

export default function SlidesPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    // Load slides
    useEffect(() => {
        async function loadSlides() {
            try {
                const res = await fetch('/api/slides?all=true');
                const data = await res.json();
                if (data.success) {
                    setSlides(data.slides);
                }
            } catch (error) {
                console.error('Failed to load slides:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSlides();
    }, []);

    // Toggle slide active status
    const toggleActive = async (slideId: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/slides/${slideId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (res.ok) {
                setSlides(slides.map(s =>
                    s.id === slideId ? { ...s, isActive: !currentStatus } : s
                ));
            }
        } catch (error) {
            console.error('Failed to toggle slide:', error);
        }
    };

    // Delete slide (runs after confirmation)
    const performDeleteSlide = async () => {
        if (pendingDeleteId === null) return;
        const slideId = pendingDeleteId;

        setIsDeleting(slideId);
        try {
            const res = await fetch(`/api/slides/${slideId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setSlides(prev => prev.filter(s => s.id !== slideId));
                toast.success('اسلاید با موفقیت حذف شد');
                setPendingDeleteId(null);
            } else {
                toast.error('خطا در حذف اسلاید');
            }
        } catch (error) {
            console.error('Failed to delete slide:', error);
            toast.error('خطا در ارتباط با سرور');
        } finally {
            setIsDeleting(null);
        }
    };

    // Get link display text
    const getLinkText = (slide: Slide) => {
        if (slide.product) return `محصول: ${slide.product.name}`;
        if (slide.category) return `دسته: ${slide.category.name}`;
        if (slide.link) return slide.link;
        return '-';
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/dashboard/appearance"
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">بنرهای هیرو (بالای صفحه)</h1>
                        <p className="text-sm text-gray-500">{slides.length} بنر هیرو فعال</p>
                    </div>
                </div>
                <Link
                    href="/admin/dashboard/appearance/slides/add"
                    className="flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    افزودن بنر هیرو
                </Link>
            </div>

            {/* Layout Guide Notice */}
            <div className="mb-6 bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900 leading-relaxed flex items-start gap-3">
                <div className="font-bold shrink-0 text-base">💡</div>
                <div>
                    <strong>راهنمای چیدمان ۳ بنر هیرو بالای صفحه اصلی:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-blue-800 font-medium">
                        <li><strong>دسکتاپ:</strong> بنر اول (ترتیب ۱) به صورت عریض (دو ستون) و بنرهای ۲ و ۳ در سمت چپ آن قرار می‌گیرند.</li>
                        <li><strong>موبایل:</strong> بنر اول به صورت پوستر عمودی و بلند (۷۶۸×۴۰۰) در بالا و بنرهای ۲ و ۳ کنار هم زیر آن قرار می‌گیرند.</li>
                    </ul>
                </div>
            </div>

            {/* Slides List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-ocean animate-spin" />
                </div>
            ) : slides.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">هنوز اسلایدی اضافه نشده</h2>
                    <p className="text-gray-500 mb-4">اولین اسلاید را اضافه کنید</p>
                    <Link
                        href="/admin/dashboard/appearance/slides/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-xl"
                    >
                        <Plus className="w-5 h-5" />
                        افزودن اسلاید
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {slides.map((slide) => (
                            <div
                                key={slide.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Drag Handle (visual only for now) */}
                                <div className="text-gray-300 cursor-move">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                {/* Order */}
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                                    {slide.order}
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    <Image
                                        src={slide.desktopImage}
                                        alt={slide.alt}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">
                                        {slide.title || slide.alt}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {getLinkText(slide)}
                                    </p>
                                </div>

                                {/* Status Badge */}
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${slide.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {slide.isActive ? 'فعال' : 'غیرفعال'}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleActive(slide.id, slide.isActive)}
                                        className={`p-2 rounded-lg transition-colors ${slide.isActive
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={slide.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                    >
                                        {slide.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>

                                    <Link
                                        href={`/admin/dashboard/appearance/slides/${slide.id}/edit`}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="ویرایش"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>

                                    <button
                                        onClick={() => setPendingDeleteId(slide.id)}
                                        disabled={isDeleting === slide.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="حذف"
                                    >
                                        {isDeleting === slide.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={pendingDeleteId !== null}
                title="حذف اسلاید"
                message="آیا از حذف این اسلاید اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                confirmText="حذف اسلاید"
                isPending={isDeleting !== null}
                onConfirm={performDeleteSlide}
                onClose={() => setPendingDeleteId(null)}
            />
        </div>
    );
}
