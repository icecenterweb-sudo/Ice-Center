'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Demo brands data
const brands = [
    { id: 'ice-center', name: 'آیس سنتر', logo: null },
    { id: 'techno', name: 'تکنو آیس', logo: null },
    { id: 'freezer-ind', name: 'فریزر صنعت', logo: null },
    { id: 'cooler-iran', name: 'کولر ایران', logo: null },
    { id: 'electro', name: 'الکترو استیل', logo: null },
    { id: 'sarma', name: 'سرما آفرین', logo: null },
    { id: 'yakh', name: 'یخچال سازان', logo: null },
    { id: 'shams', name: 'شمس', logo: null },
    { id: 'nik', name: 'نیک', logo: null },
];

export default function BrandFilterBar() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative group mb-4">
            {/* Scroll Buttons */}
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden lg:block"
            >
                <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden lg:block"
            >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            {/* Chips Container */}
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1"
                dir="rtl"
            >
                {/* All Brands Chip */}
                <button className="flex-shrink-0 bg-gray-900 text-white text-[13px] font-medium px-4 py-2 rounded-full border border-gray-900 shadow-sm transition-all">
                    همه برندها
                </button>

                {/* Brand Chips */}
                {brands.map((brand) => (
                    <button
                        key={brand.id}
                        className="flex-shrink-0 bg-white text-gray-600 text-[13px] font-medium px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all whitespace-nowrap"
                    >
                        {brand.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
