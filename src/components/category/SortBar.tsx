'use client';

import { useState } from 'react';
import { List, BarChart2, Filter } from 'lucide-react';

interface SortBarProps {
    totalResults: number;
    onSortChange?: (sort: string) => void;
    onViewChange?: (view: 'grid' | 'list') => void;
    onToggleSidebar?: () => void;
    onMobileFilterClick?: () => void;
    isSidebarOpen?: boolean;
}

export default function SortBar({
    totalResults,
    onSortChange,
    onViewChange,
    onToggleSidebar,
    isSidebarOpen
}: SortBarProps) {
    const [selectedSort, setSelectedSort] = useState('newest');

    const sortOptions = [
        { value: 'newest', label: 'جدیدترین' },
        { value: 'cheapest', label: 'ارزان‌ترین' },
        { value: 'expensive', label: 'گران‌ترین' },
        { value: 'popular', label: 'پرفروش‌ترین' },
    ];

    const handleSortChange = (value: string) => {
        setSelectedSort(value);
        onSortChange?.(value);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Sort Options & Count (85%) - Modern Background */}
            <div className="flex-1 bg-slate-100  border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Sidebar Toggle (Desktop Only) */}
                    <button
                        onClick={onToggleSidebar}
                        className={`hidden lg:flex items-center gap-2 text-sm font-bold transition-colors ${isSidebarOpen ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Filter className="w-5 h-5" />
                        <span className="hidden md:inline">فیلترها</span>
                    </button>

                    {/* Mobile Filter Trigger (Inside Sort Bar for better layout) */}
                    <button
                        onClick={onToggleSidebar} // Actually should trigger mobile modal
                        className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-700"
                    >
                        <Filter className="w-5 h-5" />
                        <span>فیلترها</span>
                    </button>

                    <div className="w-px h-6 bg-gray-300 hidden md:block"></div>

                    {/* Sort Tabs */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-sm hidden xl:flex">
                            <List className="w-5 h-5" />
                            <span>مرتب‌سازی:</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSortChange(option.value)}
                                    className={`px-3 py-1.5 text-[13px] rounded-lg transition-all whitespace-nowrap ${selectedSort === option.value
                                        ? 'bg-blue-200 text-gray-900 font-bold shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Count */}
                <div className="hidden lg:flex items-center gap-2 text-[12px] text-gray-500 mr-4">
                    <span className="font-bold text-gray-900 text-[14px]">
                        {new Intl.NumberFormat('fa-IR').format(totalResults)}
                    </span>
                    کالا
                </div>
            </div>

            {/* Compare Button (15%) */}
            <div className="w-full lg:w-[15%]">
                <button className="w-full h-full min-h-[50px] bg-blue-500 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl flex items-center justify-center gap-2 transition-all group">
                    <span className="font-bold text-sm text-white">مقایسه محصولات</span>
                </button>
            </div>
        </div>
    );
}
