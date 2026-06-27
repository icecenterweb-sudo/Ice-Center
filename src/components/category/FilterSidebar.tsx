'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSidebarProps {
    onFilterChange?: (filters: any) => void;
}

export default function FilterSidebar({}: FilterSidebarProps) {
    const [priceRange, setPriceRange] = useState([0, 500000000]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [expandedSections, setExpandedSections] = useState({
        brand: true,
        price: true,
        usage: true,
        compressor: false,
        power: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const brands = [
        { id: 'ice-center', name: 'آیس سنتر', count: 12 },
        { id: 'techno', name: 'تکنو آیس', count: 8 },
        { id: 'freezer-ind', name: 'فریزر صنعت', count: 5 },
        { id: 'cooler-iran', name: 'کولر ایران', count: 3 },
    ];

    return (
        <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-4">
            {/* Header */}
            <div className="backdrop-blur-sm px-4 py-3.5 border-b border-slate-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                    <h2 className="font-bold text-gray-800 text-[15px]">فیلترها</h2>
                </div>
                <button
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                    onClick={() => {
                        setSelectedBrands([]);
                        setPriceRange([0, 500000000]);
                    }}
                >
                    پاک کردن
                </button>
            </div>

            {/* Filter Sections */}
            <div className="p-3 space-y-2">
                {/* Available Only Switch */}
                <div className="rounded-xl p-2 shadow-sm border border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="font-semibold text-[13px] text-gray-700 group-hover:text-blue-600 transition-colors">فقط کالاهای موجود</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-gray-200 transition-colors checked:bg-gradient-to-r checked:from-blue-500 checked:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 shadow-inner"
                            />
                            <span className="pointer-events-none absolute right-[2px] top-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 shadow-sm transition-transform peer-checked:-translate-x-5 peer-checked:border-white" />
                        </div>
                    </label>
                </div>

                {/* Brands Filter */}
                <div className="rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => toggleSection('brand')}
                        className="flex items-center justify-between w-full px-3 py-3 group hover:bg-slate-50 transition-colors"
                    >
                        <span className="font-semibold text-[13px] text-gray-700 group-hover:text-blue-600 transition-colors">برند سازنده</span>
                        <div className={`transition-transform duration-200 ${expandedSections.brand ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </button>
                    {expandedSections.brand && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-3">
                            {brands.map((brand) => (
                                <label key={brand.id} className="flex items-center justify-between cursor-pointer group hover:bg-slate-50 -mx-1 px-1 py-1.5 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 transition-all cursor-pointer"
                                                checked={selectedBrands.includes(brand.id)}
                                                onChange={() => {
                                                    setSelectedBrands(prev => prev.includes(brand.id) ? prev.filter(x => x !== brand.id) : [...prev, brand.id])
                                                }}
                                            />
                                        </div>
                                        <span className="text-[13px] text-gray-600 group-hover:text-gray-900 font-medium transition-colors">{brand.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-md font-medium">{brand.count}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Range */}
                <div className="rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => toggleSection('price')}
                        className="flex items-center justify-between w-full px-3 py-3 group hover:bg-slate-50 transition-colors"
                    >
                        <span className="font-semibold text-[13px] text-gray-700 group-hover:text-blue-600 transition-colors">محدوده قیمت</span>
                        <div className={`transition-transform duration-200 ${expandedSections.price ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </button>

                    {expandedSections.price && (
                        <div className="px-3 pb-4 space-y-3 border-t border-slate-100 pt-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-medium block">از (تومان)</label>
                                    <input
                                        type="text"
                                        value={new Intl.NumberFormat('fa-IR').format(priceRange[0])}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-center text-[12px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-medium block">تا (تومان)</label>
                                    <input
                                        type="text"
                                        value={new Intl.NumberFormat('fa-IR').format(priceRange[1])}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-center text-[12px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="pt-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="500000000"
                                    step="5000000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 slider-thumb"
                                    style={{
                                        background: `linear-gradient(to left, #3b82f6 0%, #3b82f6 ${(priceRange[1] / 500000000) * 100}%, #e2e8f0 ${(priceRange[1] / 500000000) * 100}%, #e2e8f0 100%)`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Technical Specs - Compressor */}
                <div className="rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => toggleSection('compressor')}
                        className="flex items-center justify-between w-full px-3 py-3 group hover:bg-slate-50 transition-colors"
                    >
                        <span className="font-semibold text-[13px] text-gray-700 group-hover:text-blue-600 transition-colors">نوع کمپرسور</span>
                        <div className={`transition-transform duration-200 ${expandedSections.compressor ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </button>
                    {expandedSections.compressor && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-3">
                            {['پیستونی (Reciprocating)', 'اسکرو (Screw)', 'اسکرال (Scroll)'].map((type, idx) => (
                                <label key={idx} className="flex items-center gap-2.5 cursor-pointer group hover:bg-slate-50 -mx-1 px-1 py-1.5 rounded-lg transition-colors">
                                    <input type="checkbox" className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer" />
                                    <span className="text-[13px] text-gray-600 group-hover:text-gray-900 font-medium transition-colors">{type}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
