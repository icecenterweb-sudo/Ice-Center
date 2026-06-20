'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import FilterSidebar from '@/components/category/FilterSidebar';
import SortBar from '@/components/category/SortBar';
import BrandFilterBar from '@/components/category/BrandFilterBar';
import { Home, ChevronLeft, Loader2 } from 'lucide-react';

// Demo products data - Enriched for B2B
const allDemoProducts = [
    {
        id: 1,
        slug: 'ice-cream-maker-pro-3000',
        name: 'دستگاه بستنی ساز صنعتی مدل ICE-Pro 3000 (سه فاز)',
        price: 285000000,
        listPrice: 320000000,
        image: '/uploads/products/001-min-2_ip52ev.jpg',
        rating: 4.7,
        reviewCount: 127,
        inventoryStatus: 'IN_STOCK',
        isSpecialOffer: true,
        specs: {
            capacity: '3000 بستنی/ساعت',
            power: '3.5 کیلووات (سه فاز)',
            temp: '-12 درجه سانتیگراد'
        }
    },
    {
        id: 2,
        slug: 'industrial-freezer-ts50',
        name: 'فریزر ایستاده صنعتی دو درب TS-50',
        price: 185000000,
        image: '/uploads/products/dc2c39_kz3wpy.jpg',
        rating: 4.5,
        reviewCount: 89,
        inventoryStatus: 'IN_STOCK',
        specs: {
            capacity: '500 لیتر',
            power: '1.2 کیلووات',
            temp: '-18 ~ -22 درجه'
        }
    },
    {
        id: 3,
        slug: 'ice-maker-50kg',
        name: 'یخ ساز حبه‌ای صنعتی 50 کیلویی - مناسب رستوران',
        price: 45000000,
        image: '/uploads/products/yakhsaz-50kg-1232_adlyut.jpg',
        rating: 4.3,
        reviewCount: 56,
        inventoryStatus: 'IN_STOCK',
        specs: {
            capacity: '50 کیلوگرم/24 ساعت',
            power: 'تک فاز',
            temp: 'سیستم Air Cooled'
        }
    },
    {
        id: 4,
        slug: 'cone-machine-x200',
        name: 'دستگاه قیف زن اتوماتیک مدل X-200',
        price: 0,
        listPrice: 0,
        image: '/uploads/products/001-min-2_ip52ev.jpg',
        rating: 4.6,
        reviewCount: 72,
        inventoryStatus: 'IN_STOCK',
        specs: {
            capacity: '200 عدد/ساعت',
            power: 'نیمه اتوماتیک',
            temp: 'قابل تنظیم'
        }
    },
    {
        id: 5,
        slug: 'soft-serve-machine',
        name: 'بستنی ساز قیفی ایستاده - موتور امبراکو',
        price: 195000000,
        image: '/uploads/products/dc2c39_kz3wpy.jpg',
        rating: 4.8,
        reviewCount: 143,
        inventoryStatus: 'OUT_OF_STOCK',
        specs: {
            capacity: 'دو مخزن 12 لیتری',
            power: '2.2 کیلووات',
            temp: 'کمپرسور Aspera'
        }
    },
    {
        id: 6,
        slug: 'commercial-blender',
        name: 'بلندر صنعتی 12 لیتری فوق سنگین',
        price: 38000000,
        image: '/uploads/products/yakhsaz-50kg-1232_adlyut.jpg',
        rating: 4.2,
        reviewCount: 34,
        inventoryStatus: 'IN_STOCK',
        specs: {
            capacity: '12 لیتر',
            power: '1600 وات',
            temp: 'دور موتور 28000'
        }
    },
    {
        id: 7,
        slug: 'display-fridge-120cm',
        name: 'یخچال شوکیک مدل 120 (جزیره‌ای)',
        price: 52000000,
        listPrice: 55000000,
        image: '/uploads/products/dc2c39_kz3wpy.jpg',
        rating: 4.9,
        reviewCount: 22,
        inventoryStatus: 'IN_STOCK',
        specs: {
            capacity: 'طول 120 سانتیمتر',
            power: '-',
            temp: 'دیجیتال'
        }
    },
    {
        id: 8,
        slug: 'slush-machine',
        name: 'دستگاه یخ در بهشت ساز 3 مخزن',
        price: 32000000,
        image: '/uploads/products/yakhsaz-50kg-1232_adlyut.jpg',
        rating: 4.4,
        reviewCount: 41,
        inventoryStatus: 'IN_STOCK',
        specs: {
            capacity: '3x10 لیتر',
            power: 'تک فاز',
            temp: '-'
        }
    },
];

// Duplicate products to simulate more data
const generateMoreProducts = () => {
    const moreProducts: typeof allDemoProducts = [];
    for (let i = 0; i < 5; i++) {
        allDemoProducts.forEach(product => {
            moreProducts.push({
                ...product,
                id: product.id + (i + 1) * 100,
                slug: `${product.slug}-${i + 1}`
            });
        });
    }
    return [...allDemoProducts, ...moreProducts];
};

const allProducts = generateMoreProducts();

export default function ProductsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [displayedProducts, setDisplayedProducts] = useState(allProducts.slice(0, 12));
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);

    const loadMore = () => {
        setIsLoading(true);

        // Simulate API delay
        setTimeout(() => {
            const currentLength = displayedProducts.length;
            const nextProducts = allProducts.slice(currentLength, currentLength + 12);

            if (nextProducts.length === 0) {
                setHasMore(false);
            } else {
                setDisplayedProducts(prev => [...prev, ...nextProducts]);
            }

            setIsLoading(false);
        }, 800);
    };

    // Infinite scroll logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;

        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, isLoading, displayedProducts.length]);

    return (
        <div className="min-h-screen bg-[#f5f7fa]" dir="rtl">
            {/* Minimal Breadcrumb */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="max-w-[1700px] mx-auto px-4">
                    <div className="flex items-center h-10 text-[11px] text-gray-500 overflow-x-auto no-scrollbar gap-2">
                        <Link href="/" className="hover:text-red-500 transition-colors whitespace-nowrap flex items-center gap-1">
                            <Home className="w-3 h-3 mb-0.5" />
                            آیس سنتر
                        </Link>
                        <ChevronLeft className="w-3 h-3 text-gray-300" />
                        <Link href="/products" className="hover:text-red-500 transition-colors whitespace-nowrap font-bold text-gray-800">
                            تجهیزات صنعتی و کارگاهی
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1700px] mx-auto px-4 py-4">

                {/* Brand Filter Bar */}
                <BrandFilterBar />

                <div className="flex gap-4 lg:gap-6 mt-4 relative">
                    {/* Filter Sidebar - Collapsible */}
                    <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen
                        ? 'w-full lg:w-[270px] xl:w-[300px] opacity-100'
                        : 'w-0 opacity-0 overflow-hidden hidden lg:block'
                        }`}>
                        {/* Desktop Sidebar (only visible when open) */}
                        <div className="hidden lg:block sticky top-20">
                            <FilterSidebar />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Sort Bar */}
                        <SortBar
                            totalResults={allProducts.length}
                            onMobileFilterClick={() => setShowMobileFilters(true)}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            isSidebarOpen={isSidebarOpen}
                        />

                        {/* Product Grid - Dynamic Columns based on Sidebar */}
                        <div className={`grid gap-3 ${isSidebarOpen
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                            }`}>
                            {displayedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Loading Indicator / Observer Target */}
                        <div ref={observerTarget} className="mt-8 flex justify-center pb-8">
                            {isLoading && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">در حال بارگذاری...</span>
                                </div>
                            )}
                            {!hasMore && displayedProducts.length > 0 && (
                                <div className="text-center text-gray-500 text-sm py-4">
                                    همه محصولات نمایش داده شد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Filter Modal Overlay */}
            {showMobileFilters && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
                    onClick={() => setShowMobileFilters(false)}
                >
                    <div
                        className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-white overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="font-bold text-lg text-gray-900">فیلترها</h2>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-2">
                            <FilterSidebar />
                        </div>
                        <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
                            >
                                مشاهده نتایج ({allProducts.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
