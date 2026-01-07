'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Plus, Trash2, Edit, Eye, EyeOff, Loader2, ImageIcon } from 'lucide-react';

interface Banner {
    id: number;
    title: string;
    position: 'SINGLE_FULL' | 'DOUBLE';
    desktopImage: string;
    mobileImage: string;
    alt: string;
    link: string | null;
    isActive: boolean;
    order: number;
    product: { id: number; name: string; slug: string } | null;
    category: { id: number; name: string; slug: string } | null;
}

const positionLabels: Record<string, string> = {
    'SINGLE_FULL': 'تک بنر تمام‌عرض',
    'DOUBLE': 'دو بنر کنار هم',
};

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Load banners
    useEffect(() => {
        async function loadBanners() {
            try {
                const res = await fetch('/api/admin/banners');
                const data = await res.json();
                if (data.success) {
                    setBanners(data.banners);
                }
            } catch (error) {
                console.error('Failed to load banners:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadBanners();
    }, []);

    // Toggle banner active status
    const toggleActive = async (bannerId: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/banners/${bannerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (res.ok) {
                setBanners(banners.map(b =>
                    b.id === bannerId ? { ...b, isActive: !currentStatus } : b
                ));
            }
        } catch (error) {
            console.error('Failed to toggle banner:', error);
        }
    };

    // Delete banner
    const deleteBanner = async (bannerId: number) => {
        if (!confirm('آیا از حذف این بنر اطمینان دارید؟')) return;

        setIsDeleting(bannerId);
        try {
            const res = await fetch(`/api/admin/banners/${bannerId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setBanners(banners.filter(b => b.id !== bannerId));
            }
        } catch (error) {
            console.error('Failed to delete banner:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    // Get link display text
    const getLinkText = (banner: Banner) => {
        if (banner.product) return `محصول: ${banner.product.name}`;
        if (banner.category) return `دسته: ${banner.category.name}`;
        if (banner.link) return banner.link;
        return '-';
    };

    // Group banners by position
    const singleBanners = banners.filter(b => b.position === 'SINGLE_FULL');
    const doubleBanners = banners.filter(b => b.position === 'DOUBLE');

    return (
        <div className="p-6 max-w-6xl mx-auto" dir="rtl">
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
                        <h1 className="text-2xl font-bold text-gray-800">بنرها</h1>
                        <p className="text-sm text-gray-500">{banners.length} بنر</p>
                    </div>
                </div>
                <Link
                    href="/admin/dashboard/appearance/banners/add"
                    className="flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-xl hover:bg-ocean/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    افزودن بنر
                </Link>
            </div>

            {/* Banners List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-ocean animate-spin" />
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">هنوز بنری اضافه نشده</h2>
                    <p className="text-gray-500 mb-4">اولین بنر را اضافه کنید</p>
                    <Link
                        href="/admin/dashboard/appearance/banners/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-xl"
                    >
                        <Plus className="w-5 h-5" />
                        افزودن بنر
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Single Full Width Banners */}
                    {singleBanners.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-3">تک بنر تمام‌عرض</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {singleBanners.map((banner) => (
                                        <BannerRow
                                            key={banner.id}
                                            banner={banner}
                                            getLinkText={getLinkText}
                                            toggleActive={toggleActive}
                                            deleteBanner={deleteBanner}
                                            isDeleting={isDeleting}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Double Banners */}
                    {doubleBanners.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-3">دو بنر کنار هم</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {doubleBanners.map((banner) => (
                                        <BannerRow
                                            key={banner.id}
                                            banner={banner}
                                            getLinkText={getLinkText}
                                            toggleActive={toggleActive}
                                            deleteBanner={deleteBanner}
                                            isDeleting={isDeleting}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Banner Row Component
function BannerRow({
    banner,
    getLinkText,
    toggleActive,
    deleteBanner,
    isDeleting,
}: {
    banner: Banner;
    getLinkText: (banner: Banner) => string;
    toggleActive: (id: number, status: boolean) => void;
    deleteBanner: (id: number) => void;
    isDeleting: number | null;
}) {
    return (
        <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            {/* Order */}
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                {banner.order}
            </div>

            {/* Thumbnail */}
            <div className="w-28 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                <Image
                    src={banner.desktopImage}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                    {banner.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {getLinkText(banner)}
                </p>
            </div>

            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${banner.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
                }`}>
                {banner.isActive ? 'فعال' : 'غیرفعال'}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => toggleActive(banner.id, banner.isActive)}
                    className={`p-2 rounded-lg transition-colors ${banner.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                        }`}
                    title={banner.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                    {banner.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <Link
                    href={`/admin/dashboard/appearance/banners/${banner.id}/edit`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="ویرایش"
                >
                    <Edit className="w-5 h-5" />
                </Link>

                <button
                    onClick={() => deleteBanner(banner.id)}
                    disabled={isDeleting === banner.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="حذف"
                >
                    {isDeleting === banner.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Trash2 className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
