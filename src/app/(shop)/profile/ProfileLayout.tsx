'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    User,
    MapPin,
    ShoppingBag,
    Heart,
    Wallet,
    Bell,
    Ticket,
    Phone,
    HelpCircle,
    LogOut,
    Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toPersianDigits } from '@/lib/numbers';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
}

const menuItems: MenuItem[] = [
    { id: 'profile', label: 'پروفایل من', icon: User, href: '/profile' },
    { id: 'orders', label: 'سفارش‌های من', icon: ShoppingBag, href: '/profile/orders' },
    { id: 'addresses', label: 'آدرس‌های من', icon: MapPin, href: '/profile/addresses' },
    { id: 'wishlist', label: 'علاقه‌مندی‌ها', icon: Heart, href: '/profile/wishlist' },
    { id: 'wallet', label: 'کیف پول', icon: Wallet, href: '/profile/wallet' },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell, href: '/profile/notifications' },
    { id: 'discounts', label: 'کد تخفیف', icon: Ticket, href: '/profile/discounts' },
];

const supportItems: MenuItem[] = [
    { id: 'contact', label: 'تماس با ما', icon: Phone, href: '/contact' },
    { id: 'faq', label: 'سوالات متداول', icon: HelpCircle, href: '/faq' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const displayName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || 'کاربر آیس سنتر';

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar - Hidden on mobile, shown on desktop (RIGHT side in RTL) */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-4">

                            {/* User Header */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-ocean to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-sm font-bold text-gray-800 truncate">
                                            {displayName}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5" dir="ltr">
                                            {user?.phone ? toPersianDigits(user.phone) : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <nav className="p-2">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/profile' && pathname.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors mb-1 ${isActive
                                                    ? 'bg-ocean/10 text-ocean'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-ocean' : 'text-gray-400'}`} />
                                            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Divider */}
                            <div className="mx-4 border-t border-gray-100" />

                            {/* Support Items */}
                            <nav className="p-2">
                                {supportItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors mb-1"
                                        >
                                            <Icon className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Logout */}
                            <div className="p-2 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-sm font-medium">خروج از حساب</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content (LEFT side in RTL) */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>

                </div>
            </div>
        </div>
    );
}
