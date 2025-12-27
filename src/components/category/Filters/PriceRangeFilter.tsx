'use client';

import { ChevronUp, ChevronDown, DollarSign } from 'lucide-react';
import { PRICE_RANGES } from '@/lib/utils/formatters';

interface PriceRangeFilterProps {
    expanded: boolean;
    onToggle: () => void;
    selectedMin?: number;
    selectedMax?: number;
    onPriceChange: (min: number | undefined, max: number | undefined) => void;
}

export default function PriceRangeFilter({
    expanded,
    onToggle,
    selectedMin,
    selectedMax,
    onPriceChange
}: PriceRangeFilterProps) {
    const isRangeSelected = (min: number, max: number) => {
        return selectedMin === min && (max === Infinity ? selectedMax === undefined : selectedMax === max);
    };

    const handleRangeClick = (min: number, max: number) => {
        if (isRangeSelected(min, max)) {
            onPriceChange(undefined, undefined);
        } else {
            onPriceChange(min, max === Infinity ? undefined : max);
        }
    };

    return (
        <div className="border-b border-neutral-100 pb-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full text-sm font-bold text-neutral-800"
            >
                <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-neutral-500" />
                    محدوده قیمت
                </div>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expanded && (
                <div className="mt-3 space-y-2">
                    {PRICE_RANGES.map((range, i) => (
                        <button
                            key={i}
                            onClick={() => handleRangeClick(range.min, range.max)}
                            className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${isRangeSelected(range.min, range.max)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
