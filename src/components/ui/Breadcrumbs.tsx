'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex items-center gap-1 text-sm text-gray-500 ${className}`}
        >
            {/* Home */}
            <Link
                href="/"
                className="flex items-center gap-1 hover:text-ocean transition-colors"
            >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">خانه</span>
            </Link>

            {/* Separator */}
            <ChevronLeft className="w-4 h-4 text-gray-400" />

            {/* Items */}
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <React.Fragment key={index}>
                        {isLast ? (
                            <span className="text-gray-800 font-medium line-clamp-1 max-w-[200px] sm:max-w-[300px]">
                                {item.label}
                            </span>
                        ) : (
                            <>
                                <Link
                                    href={item.href || '#'}
                                    className="hover:text-ocean transition-colors line-clamp-1 max-w-[150px]"
                                >
                                    {item.label}
                                </Link>
                                <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0" />
                            </>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
