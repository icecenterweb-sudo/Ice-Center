'use client';

import { ChevronUp, ChevronDown, Package } from 'lucide-react';
import { AVAILABILITY_OPTIONS } from '@/lib/utils/formatters';

interface AvailabilityFilterProps {
    expanded: boolean;
    onToggle: () => void;
    selectedStatuses: string[];
    onStatusChange: (statuses: string[]) => void;
}

export default function AvailabilityFilter({
    expanded,
    onToggle,
    selectedStatuses,
    onStatusChange
}: AvailabilityFilterProps) {
    const handleStatusToggle = (status: string) => {
        const newStatuses = selectedStatuses.includes(status)
            ? selectedStatuses.filter(s => s !== status)
            : [...selectedStatuses, status];
        onStatusChange(newStatuses);
    };

    return (
        <div className="border-b border-neutral-100 pb-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full text-sm font-bold text-neutral-800"
            >
                <div className="flex items-center gap-2">
                    <Package size={16} className="text-neutral-500" />
                    وضعیت موجودی
                </div>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expanded && (
                <div className="mt-3 space-y-2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer hover:text-neutral-900"
                        >
                            <input
                                type="checkbox"
                                checked={selectedStatuses.includes(option.value)}
                                onChange={() => handleStatusToggle(option.value)}
                                className="w-4 h-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className={option.color}>{option.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
