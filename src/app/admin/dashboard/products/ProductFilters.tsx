'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface ProductFiltersProps {
    onFilterChange: (filters: {
        search: string;
        subcategory: string;
        stock: string;
    }) => void;
    subcategories: { id: number; name: string; category: { name: string } }[];
}

export default function ProductFilters({ onFilterChange, subcategories }: ProductFiltersProps) {
    const [search, setSearch] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [stock, setStock] = useState('');

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        const filters = {
            search: newFilters.search ?? search,
            subcategory: newFilters.subcategory ?? subcategory,
            stock: newFilters.stock ?? stock,
        };

        setSearch(filters.search);
        setSubcategory(filters.subcategory);
        setStock(filters.stock);

        onFilterChange(filters);
    };

    const clearFilters = () => {
        handleFilterChange({ search: '', subcategory: '', stock: '' });
    };

    const hasActiveFilters = search || subcategory || stock;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجو در محصولات..."
                        value={search}
                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                        className="w-full pr-12 pl-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                    />
                </div>

                {/* Subcategory Filter */}
                <select
                    value={subcategory}
                    onChange={(e) => handleFilterChange({ subcategory: e.target.value })}
                    className="px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none min-w-[200px]"
                >
                    <option value="">همه دسته‌بندی‌ها</option>
                    {subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                            {sub.category.name} / {sub.name}
                        </option>
                    ))}
                </select>

                {/* Stock Filter */}
                <select
                    value={stock}
                    onChange={(e) => handleFilterChange({ stock: e.target.value })}
                    className="px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none min-w-[150px]"
                >
                    <option value="">همه موجودی‌ها</option>
                    <option value="in-stock">موجود</option>
                    <option value="low-stock">کم موجود</option>
                    <option value="out-of-stock">ناموجود</option>
                </select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        پاک کردن فیلترها
                    </button>
                )}
            </div>
        </div>
    );
}
