'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2 } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

// Simple price formatter
const formatPrice = (price: number): string => {
    return price.toLocaleString('fa-IR');
};

interface SearchProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    image: string | null;
}

interface SearchCategory {
    id: number;
    name: string;
    slug: string;
}

interface SearchResults {
    products: SearchProduct[];
    categories: SearchCategory[];
}

interface SearchBarProps {
    className?: string;
    placeholder?: string;
}

export default function SearchBar({
    className = '',
    placeholder = 'جستجو در محصولات...'
}: SearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ products: [], categories: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const searchSeqRef = useRef<number>(0);

    // Debounced search with AbortController and sequence protection (#20)
    const search = useCallback(async (searchQuery: string) => {
        // Abort previous in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setResults({ products: [], categories: [] });
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const currentSeq = ++searchSeqRef.current;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=5`, {
                signal: controller.signal,
            });
            const data = await response.json();

            // Guard against stale response if another search was triggered
            if (currentSeq !== searchSeqRef.current) {
                return;
            }

            if (data.success) {
                setResults({
                    products: data.products || [],
                    categories: data.categories || [],
                });
                setIsOpen(true);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            console.error('Search failed:', error);
        } finally {
            if (currentSeq === searchSeqRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    // Clean up timeout and active fetch on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            search(value);
        }, 300);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = results.products.length + results.categories.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                // Navigate to selected item
                if (selectedIndex < results.products.length) {
                    const product = results.products[selectedIndex];
                    router.push(`/products/${product.slug}`);
                } else {
                    const categoryIndex = selectedIndex - results.products.length;
                    const category = results.categories[categoryIndex];
                    router.push(`/categories/${category.slug}`);
                }
                closeDropdown();
            } else if (query.trim()) {
                // Navigate to search results page
                router.push(`/products?search=${encodeURIComponent(query)}`);
                closeDropdown();
            }
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    };

    // Close dropdown
    const closeDropdown = () => {
        setIsOpen(false);
        setSelectedIndex(-1);
        setQuery('');
        inputRef.current?.blur();
    };

    // Click outside to close
    // Close on outside click / Escape via shared hook (#33)
    useClickOutside(dropdownRef, () => setIsOpen(false));

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const hasResults = results.products.length > 0 || results.categories.length > 0;

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative rounded-full">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && hasResults && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-12 pl-10 pr-14 bg-white border border-gray-300 hover:border-gray-400 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-full text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-150"
                />

                {/* Circular Search Button on leading edge (Right in RTL) */}
                <button
                    type="button"
                    onClick={() => {
                        if (query.trim()) {
                            router.push(`/products?search=${encodeURIComponent(query)}`);
                            closeDropdown();
                        }
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-royal hover:bg-ocean text-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shadow-sm active:scale-95"
                    aria-label="جستجو"
                >
                    <Search className="w-5 h-5" />
                </button>

                {/* Loading/Clear Button */}
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : query && (
                        <button
                            type="button"
                            onClick={closeDropdown}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-150 active:scale-95"
                            aria-label="پاک کردن جستجو"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            <div
                ref={dropdownRef}
                className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto origin-top transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isOpen && (isLoading || hasResults)
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 -translate-y-1.5 scale-95 pointer-events-none'
                }`}
            >
                    {!hasResults && !isLoading && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            نتیجه‌ای یافت نشد
                        </div>
                    )}

                    {/* Categories */}
                    {results.categories.length > 0 && (
                        <div className="border-b border-gray-100">
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                                دسته‌بندی‌ها
                            </div>
                            {results.categories.map((category, index) => {
                                const itemIndex = results.products.length + index;
                                return (
                                    <Link
                                        key={category.id}
                                        href={`/categories/${category.slug}`}
                                        onClick={closeDropdown}
                                        className={`
                      block px-4 py-3 hover:bg-gray-50 transition-[background-color,color] duration-[125ms] ease-out
                      ${selectedIndex === itemIndex ? 'bg-ocean/10' : ''}
                    `}
                                    >
                                        <span className="text-sm text-gray-700">{category.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Products */}
                    {results.products.length > 0 && (
                        <div>
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                                محصولات
                            </div>
                            {results.products.map((product, index) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    onClick={closeDropdown}
                                    className={`
                    flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-[background-color,color] duration-[125ms] ease-out
                    ${selectedIndex === index ? 'bg-ocean/10' : ''}
                  `}
                                >
                                    {/* Product Image */}
                                    <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        {product.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Search className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 line-clamp-1">{product.name}</p>
                                        <p className="text-xs text-ocean font-medium mt-0.5">
                                            {toPersianDigits(formatPrice(product.price))} تومان
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* View All Results */}
                    {hasResults && (
                        <Link
                            href={`/products?search=${encodeURIComponent(query)}`}
                            onClick={closeDropdown}
                            className="block px-4 py-3 text-center text-sm text-ocean font-medium hover:bg-ocean/5 border-t border-gray-100 transition-[background-color,color] duration-[125ms] ease-out"
                        >
                            مشاهده همه نتایج
                        </Link>
                    )}
                </div>
        </div>
    );
}
