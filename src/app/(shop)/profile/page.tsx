'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    ChevronLeft,
    Edit2,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toPersianDigits } from '@/lib/persian';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    href?: string;
    onClick?: () => void;
    badge?: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        router.push('/');
    };

    const menuItems: MenuItem[] = [
        { id: 'orders', label: 'سفارش‌های من', icon: ShoppingBag, href: '/profile/orders' },
        { id: 'addresses', label: 'آدرس‌های من', icon: MapPin, href: '/profile/addresses' },
        { id: 'wishlist', label: 'لیست علاقه‌مندی‌ها', icon: Heart, href: '/profile/wishlist' },
        { id: 'wallet', label: 'کیف پول', icon: Wallet, href: '/profile/wallet' },
        { id: 'notifications', label: 'اعلان‌ها', icon: Bell, href: '/profile/notifications' },
        { id: 'discounts', label: 'کد تخفیف', icon: Ticket, href: '/profile/discounts' },
    ];

    const supportItems: MenuItem[] = [
        { id: 'contact', label: 'تماس با ما', icon: Phone, href: '/contact' },
        { id: 'faq', label: 'سوالات متداول', icon: HelpCircle, href: '/faq' },
    ];

    const displayName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || 'کاربر آیس سنتر';

    return (
        <div className="pb-20 lg:pb-0">
            {/* Mobile: Profile Header Card (hidden on desktop - sidebar shows this) */}
            <div className="lg:hidden bg-white rounded-2xl p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-ocean to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-800 truncate">
                            {displayName}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5" dir="ltr">
                            {user?.phone ? toPersianDigits(user.phone) : ''}
                        </p>
                    </div>
                    <Link
                        href="/profile/edit"
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <Edit2 className="w-5 h-5 text-gray-600" />
                    </Link>
                </div>
            </div>

            {/* Desktop: Welcome Card */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            سلام، {displayName}! 👋
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            به پروفایل کاربری خود خوش آمدید
                        </p>
                    </div>
                    <Link
                        href="/profile/edit"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">ویرایش پروفایل</span>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 lg:mb-6 select-none">
                <Link href="/profile/orders" className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center shadow-sm hover:border-ocean border border-transparent transition-all">
                    <div className="text-xl lg:text-2xl font-bold text-gray-800">سفارش‌ها</div>
                    <div className="text-[11px] lg:text-sm text-ocean font-medium mt-1 flex items-center justify-center gap-1">
                        <span>مشاهده تاریخچه</span>
                        <ChevronLeft className="w-3 h-3" />
                    </div>
                </Link>
                <Link href="/profile/wishlist" className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center shadow-sm hover:border-ocean border border-transparent transition-all">
                    <div className="text-xl lg:text-2xl font-bold text-gray-800">علاقه‌مندی</div>
                    <div className="text-[11px] lg:text-sm text-ocean font-medium mt-1 flex items-center justify-center gap-1">
                        <span>لیست ذخیره‌ها</span>
                        <ChevronLeft className="w-3 h-3" />
                    </div>
                </Link>
                <Link href="/profile/wallet" className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center shadow-sm hover:border-ocean border border-transparent transition-all">
                    <div className="text-xl lg:text-2xl font-bold text-ocean">کیف پول</div>
                    <div className="text-[11px] lg:text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <span>اعتبار اولیه</span>
                        <ChevronLeft className="w-3 h-3" />
                    </div>
                </Link>
            </div>

            {/* Mobile: Main Menu (hidden on desktop - sidebar has this) */}
            <div className="lg:hidden bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.id}
                            href={item.href || '#'}
                            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="flex-1 text-sm font-medium text-gray-700">
                                {item.label}
                            </span>
                            {item.badge && item.badge > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                    {toPersianDigits(item.badge.toString())}
                                </span>
                            )}
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                    );
                })}
            </div>

            {/* Mobile: Support Menu */}
            <div className="lg:hidden bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
                {supportItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.id}
                            href={item.href || '#'}
                            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${index !== supportItems.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="flex-1 text-sm font-medium text-gray-700">
                                {item.label}
                            </span>
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                    );
                })}
            </div>

            {/* Mobile: Logout Button */}
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="lg:hidden w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
            >
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                    {isLoggingOut ? (
                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    ) : (
                        <LogOut className="w-5 h-5 text-red-500" />
                    )}
                </div>
                <span className="flex-1 text-sm font-medium text-red-600 text-right">
                    خروج از حساب کاربری
                </span>
            </button>

            {/* Mobile: App Version */}
            <div className="lg:hidden text-center mt-6 text-[11px] text-gray-500">
                نسخه ۱.۰.۰
            </div>

            {/* Desktop: Recent Activity or other content could go here */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-4">فعالیت‌های اخیر</h2>
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">هنوز فعالیتی ثبت نشده است</p>
                </div>
            </div>
        </div>
    );
}
