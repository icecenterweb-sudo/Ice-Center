'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Loader2, Grid3X3 } from 'lucide-react';

interface Subcategory {
    id: number;
    name: string;
    slug: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    subcategories?: Subcategory[];
}

interface MobileCategoriesPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileCategoriesPanel({ isOpen, onClose }: MobileCategoriesPanelProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setSelectedCategory(null);
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/categories?withSubs=true');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
                // Auto-select first category
                if (data.data.length > 0) {
                    setSelectedCategory(data.data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-x-0 top-0 bottom-16 z-[60] bg-white flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
                        <h2 className="text-sm font-bold text-gray-800">دسته‌بندی محصولات</h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Two Column Layout */}
                    <div className="flex flex-1 overflow-hidden">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-ocean animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Right Column: Categories */}
                                <div className="w-24 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                                    {categories.map((category) => {
                                        const isSelected = selectedCategory?.id === category.id;

                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`
                                                    w-full flex flex-col items-center gap-1.5 py-4 px-2
                                                    transition-colors duration-200 border-l-2
                                                    ${isSelected
                                                        ? 'bg-white border-l-ocean text-ocean'
                                                        : 'border-l-transparent text-gray-600 hover:bg-gray-100'
                                                    }
                                                `}
                                            >
                                                {/* Category Image or Fallback Icon */}
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {category.image ? (
                                                        <Image
                                                            src={category.image}
                                                            alt={category.name}
                                                            width={40}
                                                            height={40}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <Grid3X3 className={`w-5 h-5 ${isSelected ? 'text-ocean' : 'text-gray-400'}`} />
                                                    )}
                                                </div>
                                                <span className={`text-[11px] text-center leading-tight ${isSelected ? 'font-bold' : 'font-medium'}`}>
                                                    {category.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Left Column: Subcategories */}
                                <div className="flex-1 overflow-y-auto bg-white">
                                    {selectedCategory && (
                                        <div className="p-4">
                                            {/* "View All" Header */}
                                            <Link
                                                href={`/category/${selectedCategory.slug}`}
                                                onClick={onClose}
                                                className="flex items-center justify-between py-2.5 px-3 mb-2 bg-ocean/5 rounded-lg hover:bg-ocean/10 transition-colors"
                                            >
                                                <span className="text-xs text-ocean font-bold">
                                                    همه محصولات {selectedCategory.name}
                                                </span>
                                                <ChevronLeft className="w-4 h-4 text-ocean" />
                                            </Link>

                                            {/* Subcategories List */}
                                            <div className="space-y-1">
                                                {selectedCategory.subcategories?.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/category/${selectedCategory.slug}/${sub.slug}`}
                                                        onClick={onClose}
                                                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <span className="text-xs text-gray-700 group-hover:text-gray-900">
                                                            {sub.name}
                                                        </span>
                                                        <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                                                    </Link>
                                                ))}

                                                {(!selectedCategory.subcategories || selectedCategory.subcategories.length === 0) && (
                                                    <div className="py-8 text-center text-gray-500 text-sm">
                                                        زیردسته‌ای موجود نیست
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

