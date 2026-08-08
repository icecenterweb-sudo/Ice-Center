'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, SlidersHorizontal, ArrowUpDown, Tag, DollarSign, Package, Grid3X3, Trash2, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';
import ProductCard from '@/components/product/ProductCard';

type Category = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    description: string | null;
    productCount: number;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    price: number;
    listPrice: number | null;
    thumbnail: string | null;
    inventoryStatus: string;
    brand?: string | null;
};

type Props = {
    categories: Category[];
    products: Product[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    currentSort: string;
    availableBrands: string[];
    selectedCategoryId?: number;
    searchQuery?: string;
};

const PRICE_RANGES = [
    { label: 'زیر ۱ میلیون', min: 0, max: 1000000 },
    { label: '۱ تا ۵ میلیون', min: 1000000, max: 5000000 },
    { label: '۵ تا ۱۰ میلیون', min: 5000000, max: 10000000 },
    { label: '۱۰ تا ۲۰ میلیون', min: 10000000, max: 20000000 },
    { label: 'بالای ۲۰ میلیون', min: 20000000, max: Infinity },
];

const AVAILABILITY_OPTIONS = [
    { value: 'IN_STOCK', label: 'موجود در انبار', color: 'bg-green-500' },
    { value: 'LOW_STOCK', label: 'موجودی کم', color: 'bg-yellow-500' },
    { value: 'OUT_OF_STOCK', label: 'ناموجود', color: 'bg-red-500' },
];

export default function CategoriesClient({
    categories,
    products,
    totalCount,
    totalPages,
    currentPage,
    currentSort,
    availableBrands,
    selectedCategoryId,
    searchQuery,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Embla Carousel for categories
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        direction: 'rtl',
        slidesToScroll: 2,
        containScroll: 'trimSnaps',
        loop: false,
        skipSnaps: false,
        dragThreshold: 0
    });
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi]);

    const [categoryExpanded, setCategoryExpanded] = useState(true);
    const [priceExpanded, setPriceExpanded] = useState(false);
    const [brandExpanded, setBrandExpanded] = useState(false);
    const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const currentFilters = useMemo(() => ({
        minPrice: searchParams.get('minPrice'),
        maxPrice: searchParams.get('maxPrice'),
        brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
        availability: searchParams.get('availability')?.split(',').filter(Boolean) || [],
        onlyDiscount: searchParams.get('discount') === 'true',
    }), [searchParams]);

    const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

    const getDiscount = (price: number, listPrice: number | null) => {
        if (!listPrice || listPrice <= price) return null;
        return Math.round(((listPrice - price) / listPrice) * 100);
    };

    const updateURL = useCallback((params: Record<string, string | undefined>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(params).forEach(([key, value]) => {
            if (value) current.set(key, value);
            else current.delete(key);
        });
        const query = current.toString();
        router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    }, [searchParams, router, pathname]);

    const handleSortChange = (newSort: string) => updateURL({ sort: newSort, page: undefined });

    const handleCategoryFilter = (categoryId: number | null) => {
        updateURL({ category: categoryId?.toString(), page: undefined });
    };

    const handlePriceRange = (min: number, max: number | null) => {
        updateURL({
            minPrice: min > 0 ? min.toString() : undefined,
            maxPrice: max && max !== Infinity ? max.toString() : undefined,
            page: undefined
        });
    };

    const handleBrandToggle = (brand: string) => {
        const updated = currentFilters.brands.includes(brand)
            ? currentFilters.brands.filter(b => b !== brand)
            : [...currentFilters.brands, brand];
        updateURL({ brands: updated.length ? updated.join(',') : undefined, page: undefined });
    };

    const handleAvailabilityToggle = (status: string) => {
        const updated = currentFilters.availability.includes(status)
            ? currentFilters.availability.filter(s => s !== status)
            : [...currentFilters.availability, status];
        updateURL({ availability: updated.length ? updated.join(',') : undefined, page: undefined });
    };

    const handleDiscountToggle = () => {
        updateURL({ discount: !currentFilters.onlyDiscount ? 'true' : undefined, page: undefined });
    };

    const handlePageChange = (newPage: number) => {
        updateURL({ page: newPage === 1 ? undefined : newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => router.push(pathname);

    const hasActiveFilters = selectedCategoryId || currentFilters.minPrice || currentFilters.maxPrice ||
        currentFilters.brands.length > 0 || currentFilters.availability.length > 0 || currentFilters.onlyDiscount;

    const activeFilterCount = (selectedCategoryId ? 1 : 0) + (currentFilters.minPrice || currentFilters.maxPrice ? 1 : 0) +
        currentFilters.brands.length + currentFilters.availability.length + (currentFilters.onlyDiscount ? 1 : 0);

    const renderFilterContent = () => (
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
            {/* Categories */}
            <div className="border-b border-neutral-100">
                <button onClick={() => setCategoryExpanded(!categoryExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
                    <div className="flex items-center gap-2">
                        <Grid3X3 size={16} />
                        <span>دسته‌بندی</span>
                    </div>
                    {categoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {categoryExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                        <label className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group">
                            <input type="radio" name="category" checked={!selectedCategoryId}
                                onChange={() => handleCategoryFilter(null)}
                                className="w-4 h-4 text-blue-500 border-neutral-300 focus:ring-blue-500" />
                            <span className={`text-sm flex-1 ${!selectedCategoryId ? 'text-blue-600 font-medium' : 'text-neutral-600'}`}>
                                همه دسته‌ها
                            </span>
                        </label>
                        {categories.map((cat) => (
                            <label key={cat.id}
                                className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group">
                                <input type="radio" name="category" checked={selectedCategoryId === cat.id}
                                    onChange={() => handleCategoryFilter(cat.id)}
                                    className="w-4 h-4 text-blue-500 border-neutral-300 focus:ring-blue-500" />
                                <span className={`text-sm flex-1 ${selectedCategoryId === cat.id ? 'text-blue-600 font-medium' : 'text-neutral-600'}`}>
                                    {cat.name}
                                </span>
                                <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                                    {cat.productCount}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Price Range */}
            <div className="border-b border-neutral-100">
                <button onClick={() => setPriceExpanded(!priceExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
                    <div className="flex items-center gap-2">
                        <DollarSign size={16} />
                        <span>محدوده قیمت</span>
                    </div>
                    {priceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {priceExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                        {PRICE_RANGES.map((range, idx) => {
                            const isActive = parseInt(currentFilters.minPrice || '0') === range.min &&
                                (range.max === Infinity ? !currentFilters.maxPrice : parseInt(currentFilters.maxPrice || '0') === range.max);
                            return (
                                <button key={idx} onClick={() => handlePriceRange(range.min, range.max)}
                                    className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200' : 'text-neutral-600 hover:bg-neutral-50'
                                        }`}>
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
                    <button onClick={() => setBrandExpanded(!brandExpanded)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
                        <div className="flex items-center gap-2">
                            <Tag size={16} />
                            <span>برند</span>
                        </div>
                        {brandExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {brandExpanded && (
                        <div className="px-4 pb-4 space-y-1 max-h-48 overflow-y-auto">
                            {availableBrands.map((brand) => (
                                <label key={brand}
                                    className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group">
                                    <input type="checkbox" checked={currentFilters.brands.includes(brand)}
                                        onChange={() => handleBrandToggle(brand)}
                                        className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500" />
                                    <span className={`text-sm flex-1 ${currentFilters.brands.includes(brand) ? 'text-blue-600 font-medium' : 'text-neutral-600'}`}>
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
                <button onClick={() => setAvailabilityExpanded(!availabilityExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
                    <div className="flex items-center gap-2">
                        <Package size={16} />
                        <span>وضعیت موجودی</span>
                    </div>
                    {availabilityExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {availabilityExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                        {AVAILABILITY_OPTIONS.map((option) => (
                            <label key={option.value}
                                className="flex items-center gap-2.5 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group">
                                <input type="checkbox" checked={currentFilters.availability.includes(option.value)}
                                    onChange={() => handleAvailabilityToggle(option.value)}
                                    className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500" />
                                <span className={`text-sm flex-1 ${currentFilters.availability.includes(option.value) ? 'text-blue-600 font-medium' : 'text-neutral-600'}`}>
                                    {option.label}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${option.color}`} />
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Discount */}
            <div className="p-4">
                <label className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors">
                    <input type="checkbox" checked={currentFilters.onlyDiscount}
                        onChange={handleDiscountToggle}
                        className="w-4 h-4 text-blue-500 border-neutral-300 rounded focus:ring-blue-500" />
                    <span className={`text-sm font-medium ${currentFilters.onlyDiscount ? 'text-rose-600' : 'text-neutral-700'}`}>
                        فقط کالاهای تخفیف‌دار
                    </span>
                </label>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50" dir="rtl">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-neutral-100">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Link href="/" className="hover:text-blue-500 transition-colors">آیس سنتر</Link>
                        <ChevronLeft size={14} className="text-neutral-300" />
                        <span className="text-neutral-800 font-medium">همه محصولات</span>
                    </div>
                </div>
            </div>

            {/* Category Showcase Section with Embla Carousel */}
            <div className="border-b border-neutral-100">
                <div className="max-w-[1440px] mx-auto py-4 px-4 lg:px-6 relative">
                    {/* Carousel container */}
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex flex-row gap-2 sm:gap-3 touch-pan-y">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/categories/${cat.slug}`}
                                    className={`flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl border transition-all hover:shadow-md group flex-shrink-0 ${selectedCategoryId === cat.id
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-neutral-200 bg-white hover:border-blue-200'
                                        }`}
                                >
                                    {/* Image */}
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0 rounded-lg bg-neutral-50 overflow-hidden">
                                        {cat.image ? (
                                            <Image
                                                src={cat.image}
                                                alt={cat.name}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Grid3X3 size={14} className="text-neutral-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name Only */}
                                    <span className={`text-[10px] sm:text-sm font-medium whitespace-nowrap ${selectedCategoryId === cat.id ? 'text-blue-600' : 'text-neutral-700 group-hover:text-blue-600'
                                        }`}>
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-neutral-200 rounded-full items-center justify-center shadow-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 disabled:opacity-0 disabled:pointer-events-none transition-all"
                        aria-label="قبلی"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-neutral-200 rounded-full items-center justify-center shadow-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 disabled:opacity-0 disabled:pointer-events-none transition-all"
                        aria-label="بعدی"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar - Collapsible */}
                    <aside className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-72'}`}>
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden sticky top-4">
                            {/* Sidebar Header with Toggle */}
                            <div className={`flex items-center border-b border-neutral-100 bg-neutral-50 ${sidebarCollapsed ? 'justify-center p-3' : 'justify-between p-4'}`}>
                                {!sidebarCollapsed && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <SlidersHorizontal size={18} className="text-blue-600" />
                                            <h2 className="font-bold text-neutral-800 text-sm">فیلترها</h2>
                                            {activeFilterCount > 0 && (
                                                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {activeFilterCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasActiveFilters && (
                                                <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium">
                                                    <Trash2 size={12} />
                                                    حذف فیلتر ها
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSidebarCollapsed(true)}
                                                className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                                                title="بستن فیلترها"
                                            >
                                                <PanelLeftClose size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                                {sidebarCollapsed && (
                                    <button
                                        onClick={() => setSidebarCollapsed(false)}
                                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="باز کردن فیلترها"
                                    >
                                        <PanelLeftOpen size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Collapsed State - Just Icons */}
                            {sidebarCollapsed && (
                                <div className="py-4 flex flex-col items-center gap-3">
                                    <button
                                        onClick={() => setSidebarCollapsed(false)}
                                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="دسته‌بندی"
                                    >
                                        <Grid3X3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setSidebarCollapsed(false)}
                                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="قیمت"
                                    >
                                        <DollarSign size={18} />
                                    </button>
                                    <button
                                        onClick={() => setSidebarCollapsed(false)}
                                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="برند"
                                    >
                                        <Tag size={18} />
                                    </button>
                                    <button
                                        onClick={() => setSidebarCollapsed(false)}
                                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="موجودی"
                                    >
                                        <Package size={18} />
                                    </button>
                                    {activeFilterCount > 0 && (
                                        <div className="mt-2 w-6 h-6 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {activeFilterCount}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded State - Full Filters */}
                            {!sidebarCollapsed && renderFilterContent()}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile Header */}
                        <div className="lg:hidden flex items-center justify-between mb-4">
                            <h1 className="text-sm font-bold text-neutral-800">همه محصولات</h1>
                            <button onClick={() => setMobileFiltersOpen(true)}
                                className="flex items-center gap-1.5 text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                <SlidersHorizontal size={16} />
                                فیلتر
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        {/* Sort Bar */}
                        <div className="hidden lg:flex items-center gap-6 border-b border-neutral-200 pb-2 mb-4">
                            <div className="flex items-center gap-2 text-neutral-800 font-medium text-sm">
                                <ArrowUpDown size={16} />
                                مرتب‌سازی:
                            </div>
                            <div className="flex items-center gap-1">
                                {[{ id: 'newest', label: 'جدیدترین' }, { id: 'price-asc', label: 'ارزان‌ترین' }, { id: 'price-desc', label: 'گران‌ترین' }].map(sort => (
                                    <button key={sort.id} onClick={() => handleSortChange(sort.id)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-all ${currentSort === sort.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                                            }`}>
                                        {sort.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mr-auto text-xs text-neutral-400">{totalCount.toLocaleString('fa-IR')} کالا</div>
                        </div>

                        {/* Active Filter Chips */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="text-xs text-neutral-500">فیلترهای فعال:</span>
                                {selectedCategoryId && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        {categories.find(c => c.id === selectedCategoryId)?.name}
                                        <button onClick={() => handleCategoryFilter(null)} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                )}
                                {(currentFilters.minPrice || currentFilters.maxPrice) && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        قیمت: {currentFilters.minPrice ? formatPrice(parseInt(currentFilters.minPrice)) : '۰'} - {currentFilters.maxPrice ? formatPrice(parseInt(currentFilters.maxPrice)) : '∞'}
                                        <button onClick={() => handlePriceRange(0, null)} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                )}
                                {currentFilters.brands.map(brand => (
                                    <div key={brand} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        {brand}
                                        <button onClick={() => handleBrandToggle(brand)} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                ))}
                                {currentFilters.availability.map(status => (
                                    <div key={status} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 shadow-sm">
                                        {AVAILABILITY_OPTIONS.find(o => o.value === status)?.label}
                                        <button onClick={() => handleAvailabilityToggle(status)} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                ))}
                                {currentFilters.onlyDiscount && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-full text-xs text-rose-700 shadow-sm">
                                        تخفیف‌دار
                                        <button onClick={handleDiscountToggle} className="text-rose-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                )}
                                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
                                    <Trash2 size={14} />
                                    حذف فیلتر ها
                                </button>
                            </div>
                        )}

                        {/* Search Query Banner */}
                        {searchQuery && (
                            <div className="bg-gradient-to-l from-ocean/5 to-transparent border border-ocean/20 rounded-2xl px-5 py-4 mb-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 text-right">
                                    <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center shrink-0">
                                        <Search size={18} className="text-ocean" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            نتایج جستجو برای: <span className="text-ocean">&laquo;{searchQuery}&raquo;</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {products.length > 0 ? `${toPersianDigits(totalCount)} محصول یافت شد` : 'محصولی یافت نشد'}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/products"
                                    className="text-xs font-bold text-ocean hover:text-royal transition-colors shrink-0 flex items-center gap-1"
                                >
                                    <X size={14} />
                                    <span>پاک کردن</span>
                                </Link>
                            </div>
                        )}

                        {/* Product Grid */}
                        {products.length === 0 ? (
                            <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center shadow-sm">
                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {searchQuery ? (
                                        <Search size={32} className="text-neutral-400" />
                                    ) : (
                                        <SlidersHorizontal size={32} className="text-neutral-400" />
                                    )}
                                </div>
                                {searchQuery ? (
                                    <>
                                        <h3 className="text-neutral-800 font-bold mb-2">محصولی با عنوان &laquo;{searchQuery}&raquo; یافت نشد</h3>
                                        <p className="text-sm text-neutral-500 mb-4">لطفاً عبارت دیگری را جستجو کنید یا از دسته‌بندی‌ها استفاده نمایید.</p>
                                        <Link href="/products" className="px-4 py-2 bg-ocean text-white text-sm font-medium rounded-lg hover:bg-royal transition-colors inline-block">
                                            مشاهده همه محصولات
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-neutral-800 font-bold mb-2">نتیجه‌ای یافت نشد</h3>
                                        <p className="text-sm text-neutral-500 mb-4">لطفاً فیلترهای خود را تغییر دهید.</p>
                                        {hasActiveFilters && (
                                            <button onClick={clearFilters} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600">
                                                حذف فیلترها
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-2">
                                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                                            className="h-10 px-4 text-xs font-medium border border-neutral-200 bg-white rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            قبلی
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                                                    return (
                                                        <button key={page} onClick={() => handlePageChange(page)}
                                                            className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all ${page === currentPage ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200' : 'text-neutral-600 hover:bg-neutral-100'
                                                                }`}>
                                                            {page}
                                                        </button>
                                                    );
                                                } else if (Math.abs(page - currentPage) === 2) {
                                                    return <span key={page} className="text-neutral-300 px-1">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>
                                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                                            className="h-10 px-4 text-xs font-medium border border-neutral-200 bg-white rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            بعدی
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Filter Sheet */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl overflow-y-auto flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between z-10">
                            <h2 className="font-bold text-neutral-800">فیلترها</h2>
                            <button onClick={() => setMobileFiltersOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {renderFilterContent()}
                        </div>
                        <div className="p-4 border-t border-neutral-100 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setMobileFiltersOpen(false)}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
                            >
                                مشاهده نتایج ({totalCount.toLocaleString('fa-IR')} کالا)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
