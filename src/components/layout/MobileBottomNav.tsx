'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MobileCategoriesPanel from './MobileCategoriesPanel';

interface NavItem {
    id: string;
    href?: string;
    label: string;
    icon: React.ElementType;
    matchPaths?: string[];
    isButton?: boolean;
}

const navItems: NavItem[] = [
    {
        id: 'home',
        href: '/',
        label: 'خانه',
        icon: Home,
        matchPaths: ['/'],
    },
    {
        id: 'categories',
        label: 'دسته‌بندی',
        icon: Grid3X3,
        matchPaths: ['/categories', '/category'],
        isButton: true,
    },
    {
        id: 'cart',
        href: '/checkout',
        label: 'سبد خرید',
        icon: ShoppingCart,
        matchPaths: ['/checkout', '/cart'],
    },
    {
        id: 'profile',
        href: '/profile',
        label: 'حساب من',
        icon: User,
        matchPaths: ['/profile', '/auth'],
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { itemCount } = useCart();
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

    const isActive = (item: NavItem) => {
        if (item.id === 'categories' && isCategoriesOpen) return true;
        if (item.href === '/' && pathname === '/') return true;
        if (item.href && item.href !== '/') {
            return item.matchPaths?.some(path => pathname.startsWith(path)) || false;
        }
        return false;
    };

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const Icon = item.icon;
                        const isCart = item.id === 'cart';

                        // Categories button
                        if (item.isButton) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setIsCategoriesOpen(true)}
                                    className={`
                                        flex flex-col items-center justify-center
                                        flex-1 h-full gap-0.5
                                        transition-colors duration-200
                                        ${active
                                            ? 'text-ocean'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }
                                    `}
                                >
                                    <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                                    <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        // Regular link items
                        return (
                            <Link
                                key={item.id}
                                href={item.href || '/'}
                                className={`
                                    flex flex-col items-center justify-center
                                    flex-1 h-full gap-0.5
                                    transition-colors duration-200
                                    ${active
                                        ? 'text-ocean'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }
                                `}
                            >
                                <div className="relative">
                                    <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                                    {/* Cart Badge */}
                                    {isCart && itemCount > 0 && (
                                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {itemCount > 99 ? '99+' : itemCount}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Categories Panel */}
            <MobileCategoriesPanel
                isOpen={isCategoriesOpen}
                onClose={() => setIsCategoriesOpen(false)}
            />
        </>
    );
}
