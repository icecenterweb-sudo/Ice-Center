'use client';

import { ChevronUp, ChevronDown, Tag } from 'lucide-react';

interface BrandFilterProps {
    expanded: boolean;
    onToggle: () => void;
    brands: string[];
    selectedBrands: string[];
    onBrandChange: (brands: string[]) => void;
}

export default function BrandFilter({
    expanded,
    onToggle,
    brands,
    selectedBrands,
    onBrandChange
}: BrandFilterProps) {
    const handleBrandToggle = (brand: string) => {
        const newBrands = selectedBrands.includes(brand)
            ? selectedBrands.filter(b => b !== brand)
            : [...selectedBrands, brand];
        onBrandChange(newBrands);
    };

    if (brands.length === 0) return null;

    return (
        <div className="border-b border-neutral-100 pb-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full text-sm font-bold text-neutral-800"
            >
                <div className="flex items-center gap-2">
                    <Tag size={16} className="text-neutral-500" />
                    برند
                </div>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expanded && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                        <label
                            key={brand}
                            className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer hover:text-neutral-900"
                        >
                            <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand)}
                                onChange={() => handleBrandToggle(brand)}
                                className="w-4 h-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
                            />
                            {brand}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
