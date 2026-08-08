'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronDown, ChevronUp, X, SlidersHorizontal, ArrowUpDown, Tag, DollarSign, Package, Layers } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toPersianDigits } from '@/lib/persian';

type Product = {
    id: number;
    name: string;
    slug: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    inventoryStatus: string;
    brand?: string | null;
    subcategory: { name: string; slug: string } | null;
};

type Subcategory = {
    id: number;
    name: string;
    slug: string;
    _count: { products: number };
};

type CategoryClientProps = {
    category: {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        image: string | null;
    };
    subcategories: Subcategory[];
    initialProducts: Product[];
    initialTotalCount: number;
    initialTotalPages: number;
    initialCurrentPage: number;
    initialSort?: string;
    initialSubcategoryId?: number;
    availableBrands?: string[];
};

// Price range presets
const PRICE_RANGES = [
    { label: 'زیر ۱ میلیون', min: 0, max: 1000000 },
    { label: '۱ تا ۵ میلیون', min: 1000000, max: 5000000 },
    { label: '۵ تا ۱۰ میلیون', min: 5000000, max: 10000000 },
    { label: '۱۰ تا ۲۰ میلیون', min: 10000000, max: 20000000 },
    { label: 'بالای ۲۰ میلیون', min: 20000000, max: Infinity },
];

const AVAILABILITY_OPTIONS = [
    { value: 'IN_STOCK', label: 'موجود در انبار', color: 'text-green-600' },
    { value: 'LOW_STOCK', label: 'موجودی کم', color: 'text-yellow-600' },
    { value: 'OUT_OF_STOCK', label: 'ناموجود', color: 'text-red-600' },
];

export default function CategoryClient({
    category,
    subcategories,
    initialProducts,
    initialTotalCount,
    initialTotalPages,
    initialCurrentPage,
    initialSort = 'newest',
    initialSubcategoryId,
    availableBrands = [],
}: CategoryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Filter panel states
    const [subCatExpanded, setSubCatExpanded] = useState(true);
    const [priceExpanded, setPriceExpanded] = useState(false);
    const [brandExpanded, setBrandExpanded] = useState(false);
    const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Get current filters from URL
    const currentFilters = useMemo(() => ({
        minPrice: searchParams.get('minPrice'),
        maxPrice: searchParams.get('maxPrice'),
        brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
        availability: searchParams.get('availability')?.split(',').filter(Boolean) || [],
        onlyDiscount: searchParams.get('discount') === 'true',
    }), [searchParams]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const getDiscount = (price: number, listPrice: number | null) => {
        if (!listPrice || listPrice <= price) return null;
        return Math.round(((listPrice - price) / listPrice) * 100);
    };

    const updateURL = useCallback((params: Record<string, string | undefined>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                current.set(key, value);
            } else {
                current.delete(key);
            }
        });

        const search = current.toString();
        const query = search ? `?${search}` : '';

        startTransition(() => {
            router.push(`/categories/${category.slug}${query}`, { scroll: false });
        });
    }, [searchParams, router, category.slug]);

    const handleSortChange = (newSort: string) => {
        updateURL({ sort: newSort, page: undefined });
    };

    const handleSubcategoryFilter = (subcategoryId: number | null) => {
        updateURL({
            subcategory: subcategoryId ? subcategoryId.toString() : undefined,
            page: undefined
        });
    };

    const handlePriceRange = (min: number, max: number | null) => {
        updateURL({
            minPrice: min > 0 ? min.toString() : undefined,
            maxPrice: max && max !== Infinity ? max.toString() : undefined,
            page: undefined
        });
    };

    const handleBrandToggle = (brand: string) => {
        const current = currentFilters.brands;
        const updated = current.includes(brand)
            ? current.filter(b => b !== brand)
            : [...current, brand];

        updateURL({
            brands: updated.length > 0 ? updated.join(',') : undefined,
            page: undefined
        });
    };

    const handleAvailabilityToggle = (status: string) => {
        const current = currentFilters.availability;
        const updated = current.includes(status)
            ? current.filter(s => s !== status)
            : [...current, status];

        updateURL({
            availability: updated.length > 0 ? updated.join(',') : undefined,
            page: undefined
        });
    };

    const handleDiscountToggle = () => {
        updateURL({
            discount: !currentFilters.onlyDiscount ? 'true' : undefined,
            page: undefined
        });
    };

    const handlePageChange = (newPage: number) => {
        updateURL({ page: newPage === 1 ? undefined : newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        router.push(`/categories/${category.slug}`);
    };

    const hasActiveFilters =
        initialSubcategoryId !== undefined ||
        currentFilters.minPrice ||
        currentFilters.maxPrice ||
        currentFilters.brands.length > 0 ||
        currentFilters.availability.length > 0 ||
        currentFilters.onlyDiscount;

    const activeFilterCount =
        (initialSubcategoryId ? 1 : 0) +
        (currentFilters.minPrice || currentFilters.maxPrice ? 1 : 0) +
        currentFilters.brands.length +
        currentFilters.availability.length +
        (currentFilters.onlyDiscount ? 1 : 0);

    return (
        <div className="min-h-screen bg-neutral-50" dir="rtl">
            {isPending && <LoadingSpinner />}

            {/* Breadcrumb */}
            <div className="bg-white border-b border-neutral-100">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Link href="/" className="hover:text-blue-500 transition-colors">
                            آیس سنتر
                        </Link>
                        <ChevronLeft size={14} className="text-neutral-300" />
                        <span className="text-neutral-800 font-medium">{category.name}</span>
                    </div>
                </div>
            </div>

            {/* Subcategories Showcase */}
            {subcategories.length > 0 && (
                <div className="bg-white border-b border-neutral-100">
                    <div className="max-w-[1440px] mx-auto py-4 px-4 lg:px-6">
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                            {/* "All" option */}
                            <button
                                onClick={() => handleSubcategoryFilter(null)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md flex-shrink-0 ${!initialSubcategoryId
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-neutral-200 bg-white hover:border-blue-200'
                                    }`}
                            >
                                <span className={`text-sm font-medium whitespace-nowrap ${!initialSubcategoryId ? 'text-blue-700' : 'text-neutral-700'
                                    }`}>
                                    همه محصولات
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${!initialSubcategoryId
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-neutral-100 text-neutral-500'
                                    }`}>
                                    {initialTotalCount}
                                </span>
                            </button>

                            {subcategories.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => handleSubcategoryFilter(sub.id)}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md flex-shrink-0 ${initialSubcategoryId === sub.id
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-neutral-200 bg-white hover:border-blue-200'
                                        }`}
                                >
                                    <span className={`text-sm font-medium whitespace-nowrap ${initialSubcategoryId === sub.id ? 'text-blue-700' : 'text-neutral-700'
                                        }`}>
                                        {sub.name}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${initialSubcategoryId === sub.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-neutral-100 text-neutral-500'
                                        }`}>
                                        {sub._count.products}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden sticky top-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={18} className="text-blue-600" />
                                    <h2 className="font-bold text-neutral-800 text-sm">فیلترها</h2>
                                    {activeFilterCount > 0 && (
                                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-[11px] text-red-500 hover:text-red-600 font-medium"
                                    >
                                        حذف همه
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
                                {/* Subcategories */}
                                {subcategories.length > 0 && (
                                    <div className="border-b border-neutral-100">
                                        <button
                                            onClick={() => setSubCatExpanded(!subCatExpanded)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors"
                                        >
                                            <span>دسته‌بندی‌ها</span>
                                            {subCatExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {subCatExpanded && (
                                            <div className="px-4 pb-4 space-y-1">
                                                <label className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group">
                                                    <input
                                                        type="radio"
                                                        name="subcategory"
                                                        checked={!initialSubcategoryId}
                                                        onChange={() => handleSubcategoryFilter(null)}
                                                        className="w-4 h-4 text-blue-500 border-neutral-300 focus:ring-blue-500 focus:ring-offset-0"
                                                    />
                                                    <span className={`text-sm flex-1 ${!initialSubcategoryId ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                        همه موارد
                                                    </span>
                                                </label>

                                                {subcategories.map((sub) => (
                                                    <label
                                                        key={sub.id}
                                                        className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="subcategory"
                                                            checked={initialSubcategoryId === sub.id}
                                                            onChange={() => handleSubcategoryFilter(sub.id)}
                                                            className="w-4 h-4 text-blue-500 border-neutral-300 focus:ring-blue-500 focus:ring-offset-0"
                                                        />
                                                        <span className={`text-sm flex-1 ${initialSubcategoryId === sub.id ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                            {sub.name}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                                                            {sub._count.products}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Price Range */}
                                <div className="border-b border-neutral-100">
                                    <button
                                        onClick={() => setPriceExpanded(!priceExpanded)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} />
                                            <span>محدوده قیمت</span>
                                        </div>
                                        {priceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {priceExpanded && (
                                        <div className="px-4 pb-4 space-y-2">
                                            {PRICE_RANGES.map((range, idx) => {
                                                const isActive =
                                                    parseInt(currentFilters.minPrice || '0') === range.min &&
                                                    (range.max === Infinity ? !currentFilters.maxPrice : parseInt(currentFilters.maxPrice || '0') === range.max);

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handlePriceRange(range.min, range.max)}
                                                        className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-all ${isActive
                                                            ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                                                            : 'text-neutral-600 hover:bg-neutral-50'
                                                            }`}
                                                    >
                                                        {range.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Brands */}
                                {availableBrands.length > 0 && (
                                    <div className="border-b border-neutral-100">
                                        <button
                                            onClick={() => setBrandExpanded(!brandExpanded)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} />
                                                <span>برند</span>
                                            </div>
                                            {brandExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {brandExpanded && (
                                            <div className="px-4 pb-4 space-y-1 max-h-48 overflow-y-auto">
                                                {availableBrands.map((brand) => (
                                                    <label
                                                        key={brand}
                                                        className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={currentFilters.brands.includes(brand)}
                                                            onChange={() => handleBrandToggle(brand)}
                                                            className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                                        />
                                                        <span className={`text-sm flex-1 ${currentFilters.brands.includes(brand) ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                            {brand}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Availability */}
                                <div className="border-b border-neutral-100">
                                    <button
                                        onClick={() => setAvailabilityExpanded(!availabilityExpanded)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Package size={16} />
                                            <span>وضعیت موجودی</span>
                                        </div>
                                        {availabilityExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {availabilityExpanded && (
                                        <div className="px-4 pb-4 space-y-1">
                                            {AVAILABILITY_OPTIONS.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={currentFilters.availability.includes(option.value)}
                                                        onChange={() => handleAvailabilityToggle(option.value)}
                                                        className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                                    />
                                                    <span className={`text-sm flex-1 ${currentFilters.availability.includes(option.value) ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                        {option.label}
                                                    </span>
                                                    <div className={`w-2 h-2 rounded-full ${option.color.replace('text-', 'bg-')}`} />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Only Discount */}
                                <div className="p-4">
                                    <label className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={currentFilters.onlyDiscount}
                                            onChange={handleDiscountToggle}
                                            className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className={`text-sm font-medium ${currentFilters.onlyDiscount ? 'text-rose-600' : 'text-neutral-700'}`}>
                                            فقط کالاهای تخفیف‌دار
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header & Sort */}
                        <div className="mb-4">
                            {/* Mobile Header */}
                            <div className="lg:hidden flex items-center justify-between mb-4">
                                <h1 className="text-lg font-bold text-neutral-800">{category.name}</h1>
                                <button
                                    onClick={() => setMobileFiltersOpen(true)}
                                    className="flex items-center gap-1.5 text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                >
                                    <SlidersHorizontal size={16} />
                                    فیلتر
                                    {activeFilterCount > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Sort Bar (Desktop) */}
                            <div className="hidden lg:flex items-center gap-6 border-b border-neutral-200 pb-2">
                                <div className="flex items-center gap-2 text-neutral-800 font-medium text-sm">
                                    <ArrowUpDown size={16} />
                                    مرتب‌سازی:
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSortChange('newest')}
                                        className={`px-3 py-2 text-sm rounded-lg transition-all ${initialSort === 'newest'
                                            ? 'text-blue-600 font-medium bg-blue-50'
                                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                                            }`}
                                    >
                                        جدیدترین
                                    </button>
                                    <button
                                        onClick={() => handleSortChange('price-asc')}
                                        className={`px-3 py-2 text-sm rounded-lg transition-all ${initialSort === 'price-asc'
                                            ? 'text-blue-600 font-medium bg-blue-50'
                                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                                            }`}
                                    >
                                        ارزان‌ترین
                                    </button>
                                    <button
                                        onClick={() => handleSortChange('price-desc')}
                                        className={`px-3 py-2 text-sm rounded-lg transition-all ${initialSort === 'price-desc'
                                            ? 'text-blue-600 font-medium bg-blue-50'
                                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                                            }`}
                                    >
                                        گران‌ترین
                                    </button>
                                </div>
                                <div className="mr-auto text-xs text-neutral-400">
                                    {initialTotalCount.toLocaleString('fa-IR')} کالا
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Chips */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="text-xs text-neutral-500">فیلترهای فعال:</span>

                                {initialSubcategoryId && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        {subcategories.find(s => s.id === initialSubcategoryId)?.name}
                                        <button
                                            onClick={() => handleSubcategoryFilter(null)}
                                            className="text-blue-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {(currentFilters.minPrice || currentFilters.maxPrice) && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        قیمت: {currentFilters.minPrice ? formatPrice(parseInt(currentFilters.minPrice)) : '۰'} - {currentFilters.maxPrice ? formatPrice(parseInt(currentFilters.maxPrice)) : '∞'}
                                        <button
                                            onClick={() => handlePriceRange(0, null)}
                                            className="text-blue-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {currentFilters.brands.map(brand => (
                                    <div key={brand} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        برند: {brand}
                                        <button
                                            onClick={() => handleBrandToggle(brand)}
                                            className="text-blue-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                {currentFilters.availability.map(status => (
                                    <div key={status} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        {AVAILABILITY_OPTIONS.find(o => o.value === status)?.label}
                                        <button
                                            onClick={() => handleAvailabilityToggle(status)}
                                            className="text-blue-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                {currentFilters.onlyDiscount && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-full text-xs text-rose-700 shadow-sm">
                                        تخفیف‌دار
                                        <button
                                            onClick={handleDiscountToggle}
                                            className="text-rose-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium underline"
                                >
                                    حذف همه
                                </button>
                            </div>
                        )}

                        {/* Product Grid */}
                        {initialProducts.length === 0 ? (
                            <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center shadow-sm">
                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <SlidersHorizontal size={32} className="text-neutral-400" />
                                </div>
                                <h3 className="text-neutral-800 font-bold mb-2">نتیجه‌ای یافت نشد</h3>
                                <p className="text-sm text-neutral-500 mb-4">
                                    لطفاً فیلترهای خود را تغییر دهید یا دسته‌بندی دیگری را انتخاب کنید.
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        حذف فیلترها
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                                    {initialProducts.map((product) => {
                                        const discount = getDiscount(product.price, product.listPrice);
                                        const isCallForPrice = !product.price || product.price === 0;

                                        return (
                                            <Link
                                                key={product.id}
                                                href={`/products/${product.slug}`}
                                                className="relative bg-white border border-gray-100 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col h-full select-none"
                                            >
                                                {/* Red Discount Badge (Top Right Corner) */}
                                                {discount && discount > 0 && (
                                                    <div className="absolute top-2.5 right-2.5 z-10 bg-rose-500 text-white text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-0.5 shadow-sm">
                                                        <span>٪</span>
                                                        <span>{toPersianDigits(discount)}</span>
                                                    </div>
                                                )}

                                                {/* Image Container */}
                                                <div className="relative aspect-square mb-3 overflow-hidden rounded-2xl bg-white flex items-center justify-center p-2">
                                                    {product.thumbnail ? (
                                                        <Image
                                                            src={product.thumbnail}
                                                            alt={product.name}
                                                            fill
                                                            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                                                            sizes="(max-width: 640px) 50vw, 25vw"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">
                                                            تصویر ندارد
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content & Price Container */}
                                                <div className="flex flex-col flex-1 text-right">
                                                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[38px] group-hover:text-ocean transition-colors mb-3">
                                                        {product.name}
                                                    </h3>

                                                    {/* Price Section (Positioned on Left Side of Box, Toman to the Left of Price Number) */}
                                                    <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col items-start w-full">
                                                        {product.listPrice && product.listPrice > product.price && (
                                                            <div className="text-[12px] text-gray-400 line-through text-left w-full mb-0.5 font-medium dir-ltr">
                                                                {formatPrice(product.listPrice)}
                                                            </div>
                                                        )}

                                                        <div className="w-full flex items-baseline justify-end gap-1">
                                                            {isCallForPrice ? (
                                                                <span className="text-xs sm:text-sm font-bold text-orange-600">تماس بگیرید</span>
                                                            ) : (
                                                                <>
                                                                    <span className="text-lg font-black text-[#0f172a] tracking-tight">
                                                                        {formatPrice(product.price)}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-rose-500 shrink-0">
                                                                        تومان
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {initialTotalPages > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(initialCurrentPage - 1)}
                                            disabled={initialCurrentPage === 1}
                                            className="h-10 px-4 text-xs font-medium border border-neutral-200 bg-white rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-colors"
                                        >
                                            قبلی
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: initialTotalPages }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === initialTotalPages ||
                                                    Math.abs(page - initialCurrentPage) <= 1
                                                ) {
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all ${page === initialCurrentPage
                                                                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700'
                                                                : 'text-neutral-600 hover:bg-neutral-100'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                } else if (Math.abs(page - initialCurrentPage) === 2) {
                                                    return <span key={page} className="text-neutral-300 px-1">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(initialCurrentPage + 1)}
                                            disabled={initialCurrentPage === initialTotalPages}
                                            className="h-10 px-4 text-xs font-medium border border-neutral-200 bg-white rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-colors"
                                        >
                                            بعدی
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Filter Sheet - Simplified for now */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between z-10">
                            <h2 className="font-bold text-neutral-800">فیلترها</h2>
                            <button onClick={() => setMobileFiltersOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4">
                            {/* Subcategories */}
                            {subcategories.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-700">
                                        <Layers size={16} />
                                        <span>دسته‌بندی‌ها</span>
                                    </div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        <label className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group">
                                            <input
                                                type="radio"
                                                name="mobile-subcategory"
                                                checked={!initialSubcategoryId}
                                                onChange={() => handleSubcategoryFilter(null)}
                                                className="w-4 h-4 text-blue-500 border-neutral-300 focus:ring-blue-500 focus:ring-offset-0"
                                            />
                                            <span className={`text-sm flex-1 ${!initialSubcategoryId ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                همه موارد
                                            </span>
                                        </label>

                                        {subcategories.map((sub) => (
                                            <label
                                                key={sub.id}
                                                className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group"
                                            >
                                                <input
                                                    type="radio"
                                                    name="mobile-subcategory"
                                                    checked={initialSubcategoryId === sub.id}
                                                    onChange={() => handleSubcategoryFilter(sub.id)}
                                                    className="w-4 h-4 text-blue-500 border-neutral-300 focus:ring-blue-500 focus:ring-offset-0"
                                                />
                                                <span className={`text-sm flex-1 ${initialSubcategoryId === sub.id ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                    {sub.name}
                                                </span>
                                                <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                                                    {sub._count.products}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price ranges */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-700">
                                    <Tag size={16} />
                                    <span>محدوده قیمت</span>
                                </div>
                                <div className="space-y-2">
                                    {PRICE_RANGES.map((range, idx) => {
                                        const isActive =
                                            parseInt(currentFilters.minPrice || '0') === range.min &&
                                            (range.max === Infinity ? !currentFilters.maxPrice : parseInt(currentFilters.maxPrice || '0') === range.max);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handlePriceRange(range.min, range.max)}
                                                className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-all ${isActive
                                                    ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                                                    : 'text-neutral-600 hover:bg-neutral-50'
                                                    }`}
                                            >
                                                {range.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Brands */}
                            {availableBrands.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-700">
                                        <Tag size={16} />
                                        <span>برند</span>
                                    </div>
                                    <div className="space-y-1 max-h-56 overflow-y-auto">
                                        {availableBrands.map((brand) => (
                                            <label
                                                key={brand}
                                                className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={currentFilters.brands.includes(brand)}
                                                    onChange={() => handleBrandToggle(brand)}
                                                    className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                                />
                                                <span className={`text-sm flex-1 ${currentFilters.brands.includes(brand) ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                    {brand}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Availability */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-700">
                                    <Package size={16} />
                                    <span>وضعیت موجودی</span>
                                </div>
                                <div className="space-y-1">
                                    {AVAILABILITY_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={currentFilters.availability.includes(option.value)}
                                                onChange={() => handleAvailabilityToggle(option.value)}
                                                className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                            />
                                            <span className={`text-sm flex-1 ${currentFilters.availability.includes(option.value) ? 'text-blue-600 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                                                {option.label}
                                            </span>
                                            <div className={`w-2 h-2 rounded-full ${option.color.replace('text-', 'bg-')}`} />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Only Discount */}
                            <label className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors mb-4">
                                <input
                                    type="checkbox"
                                    checked={currentFilters.onlyDiscount}
                                    onChange={handleDiscountToggle}
                                    className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className={`text-sm font-medium ${currentFilters.onlyDiscount ? 'text-rose-600' : 'text-neutral-700'}`}>
                                    فقط کالاهای تخفیف‌دار
                                </span>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-neutral-100">
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}
                                        className="flex-1 py-2.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                    >
                                        پاک کردن
                                    </button>
                                )}
                                <button
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    مشاهده نتایج
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
