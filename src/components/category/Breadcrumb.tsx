'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <div className="bg-white border-b border-neutral-100">
            <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {items.map((item, index) => (
                        <span key={index} className="flex items-center gap-2">
                            {index > 0 && <ChevronLeft size={14} className="text-neutral-300" />}
                            {item.href ? (
                                <Link href={item.href} className="hover:text-blue-500 transition-colors">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-neutral-800 font-medium">{item.label}</span>
                            )}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
