'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminSidebar } from '@/context/AdminSidebarContext';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    Users,
    ShoppingCart,
    FileText,
    LogOut,
    ChevronDown,
    X,
    Tag,
    Palette,
    BarChart3,
    MessageSquare,
    Terminal,
    Shield,
    Settings,
    Compass,
    ShoppingBag,
    BookOpen,
    Sparkles,
    Ticket,
    Sliders
} from 'lucide-react';
import { canAccessSection, AdminSection } from '@/lib/admin-roles';

const menuItems: { icon: React.ComponentType<{ className?: string }>; label: string; href: string; section: AdminSection }[] = [
    { icon: LayoutDashboard, label: 'داشبورد', href: '/admin/dashboard', section: 'DASHBOARD' },
    { icon: Package, label: 'محصولات', href: '/admin/dashboard/products', section: 'PRODUCTS' },
    { icon: MessageSquare, label: 'مدیریت نظرات', href: '/admin/dashboard/comments', section: 'COMMENTS' },
    { icon: Tag, label: 'پیشنهادها', href: '/admin/dashboard/offers', section: 'OFFERS' },
    { icon: FolderTree, label: 'دسته‌بندی‌ها', href: '/admin/dashboard/categories', section: 'CATEGORIES' },
    { icon: FileText, label: 'بلاگ', href: '/admin/dashboard/blog', section: 'BLOG' },
    { icon: BarChart3, label: 'سئو و آنالیتیکس', href: '/admin/dashboard/analytics', section: 'ANALYTICS' },
    { icon: Palette, label: 'ظاهر', href: '/admin/dashboard/appearance', section: 'APPEARANCE' },
    { icon: Settings, label: 'تنظیمات عمومی', href: '/admin/dashboard/settings', section: 'SETTINGS' },
    { icon: Users, label: 'کاربران', href: '/admin/dashboard/users', section: 'USERS' },
    { icon: ShoppingCart, label: 'سفارشات', href: '/admin/dashboard/orders', section: 'ORDERS' },
    { icon: MessageSquare, label: 'پشتیبانی آنلاین', href: '/admin/dashboard/support', section: 'SUPPORT' },
    { icon: Terminal, label: 'مدیریت خطاها', href: '/admin/dashboard/errors', section: 'ERRORS' },
    { icon: Shield, label: 'مدیریت دسترسی‌ها', href: '/admin/dashboard/admins', section: 'ADMIN_MANAGEMENT' },
    { icon: Ticket, label: 'کوپن‌ها', href: '/admin/dashboard/coupons', section: 'COUPONS' },
];

/**
 * Stable-reference grouping (BUG_ANALYSIS.md §5):
 * MENU_GROUPS used to reference items positionally (menuItems[10], ...) which
 * silently broke if an item was ever inserted mid-array. Items are now
 * resolved by their unique href, so inserting/reordering menuItems is safe.
 */
const MENU_ITEM_BY_HREF = new Map(menuItems.map((item) => [item.href, item]));

function getMenuItem(href: string): (typeof menuItems)[number] {
    const item = MENU_ITEM_BY_HREF.get(href);
    if (!item) {
        // Fail fast: a renamed href must be updated here too.
        throw new Error(`Sidebar: no menu item registered for href "${href}"`);
    }
    return item;
}

const MENU_GROUPS: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: typeof menuItems;
}[] = [
    {
        title: 'عملیات روزمره',
        icon: Compass,
        items: [
            getMenuItem('/admin/dashboard'), // Dashboard
            getMenuItem('/admin/dashboard/orders'), // Orders
            getMenuItem('/admin/dashboard/users'), // Users
            getMenuItem('/admin/dashboard/support'), // Support
        ],
    },
    {
        title: 'فروشگاه',
        icon: ShoppingBag,
        items: [
            getMenuItem('/admin/dashboard/products'), // Products
            getMenuItem('/admin/dashboard/offers'), // Offers
            getMenuItem('/admin/dashboard/coupons'), // Coupons
            getMenuItem('/admin/dashboard/categories'), // Categories
        ],
    },
    {
        title: 'محتوا',
        icon: BookOpen,
        items: [
            getMenuItem('/admin/dashboard/blog'), // Blog
            getMenuItem('/admin/dashboard/comments'), // Comments Management
        ],
    },
    {
        title: 'بازاریابی و ظاهر',
        icon: Sparkles,
        items: [getMenuItem('/admin/dashboard/appearance')], // Appearance
    },
    {
        title: 'سیستم',
        icon: Sliders,
        items: [
            getMenuItem('/admin/dashboard/analytics'), // Analytics
            getMenuItem('/admin/dashboard/settings'), // Settings
            getMenuItem('/admin/dashboard/errors'), // Errors
            getMenuItem('/admin/dashboard/admins'), // Admin Management
        ],
    },
];

const PREFIX_ACTIVE_HREFS = new Set([
    '/admin/dashboard/products',    // add / [id] / [id]/edit
    '/admin/dashboard/comments',    // unified comments hub
    '/admin/dashboard/orders',      // [id]
    '/admin/dashboard/users',       // [id]
    '/admin/dashboard/offers',      // add / [id] / [id]/edit
    '/admin/dashboard/coupons',     // add / [id] / [id]/edit
    '/admin/dashboard/categories',  // add / edit/[id] / subcategories/**
    '/admin/dashboard/blog',        // new / [id] / [id]/edit
    '/admin/dashboard/appearance',  // banners/** / slides/**
]);

export default function Sidebar({ adminRoles = [] }: { adminRoles?: string[] }) {
    const pathname = usePathname();
    const { isCollapsed, isMobileOpen, setIsMobileOpen } = useAdminSidebar();

    // Track explicit user toggle overrides
    const [toggledGroups, setToggledGroups] = useState<Record<string, boolean>>({});

    // Helper to check if a specific item is active
    const isItemActive = (href: string) => {
        return pathname === href || (PREFIX_ACTIVE_HREFS.has(href) && pathname.startsWith(href + '/'));
    };

    // Check if group should be expanded
    const isGroupOpen = (group: typeof MENU_GROUPS[number]) => {
        if (isCollapsed) return true;
        if (toggledGroups[group.title] !== undefined) {
            return toggledGroups[group.title];
        }
        // Default: Open the group that contains the active route or the first group
        const hasActive = group.items.some(item => isItemActive(item.href));
        return hasActive || group.title === MENU_GROUPS[0].title;
    };

    const toggleGroup = (title: string, currentlyOpen: boolean) => {
        setToggledGroups((prev) => ({
            ...prev,
            [title]: !currentlyOpen,
        }));
    };

    const handleLogout = async () => {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-gray-700 text-white flex flex-col h-screen fixed right-0 top-0 shadow-2xl z-50 overflow-hidden transition-all duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                }`}>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden absolute left-4 top-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-50 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                    <div className="absolute top-[10%] -right-[10%] w-64 h-64 bg-slate-600 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[10%] -left-[10%] w-64 h-64 bg-stone-600 rounded-full blur-[100px]" />
                </div>

                {/* Header / Brand */}
                <div className="relative p-8 mb-2">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden p-1.5">
                            <Image
                                src="/logo/icecenter-logo-300.webp"
                                alt="آیس سنتر"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {!isCollapsed && (
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">پنل مدیریت</h1>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">آیس سنتر ایران</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Navigation — collapsible topic dropdowns */}
                <nav className="relative flex-1 px-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {MENU_GROUPS.map((group) => {
                        const visibleItems = group.items.filter(item => canAccessSection(adminRoles, item.section));
                        if (visibleItems.length === 0) return null;

                        const GroupIcon = group.icon;
                        const hasActiveChild = visibleItems.some(item => isItemActive(item.href));
                        const isOpen = isGroupOpen(group);

                        return (
                            <div key={group.title} className="rounded-2xl transition-colors">
                                {!isCollapsed && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.title, isOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all select-none group/header cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <GroupIcon className={`w-4 h-4 transition-colors ${hasActiveChild ? 'text-sky-400' : 'text-slate-500 group-hover/header:text-slate-300'}`} />
                                            <span className={hasActiveChild ? 'text-white' : ''}>{group.title}</span>
                                            {hasActiveChild && !isOpen && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                            )}
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-slate-500 group-hover/header:text-slate-300"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </motion.div>
                                    </button>
                                )}

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key={`content-${group.title}`}
                                            initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={isCollapsed ? undefined : { height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className={`space-y-1.5 ${isCollapsed ? 'pt-2' : 'pt-1.5 pr-1'}`}>
                                                {visibleItems.map((item, index) => {
                                                    const Icon = item.icon;
                                                    const isActive = isItemActive(item.href);

                                                    return (
                                                        <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                                                            <motion.div
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.03 }}
                                                                className={`relative group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'} px-3.5 py-3 rounded-xl transition-all duration-200 ${isActive
                                                                    ? 'bg-slate-700/60 text-white'
                                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                                    }`}
                                                                title={isCollapsed ? item.label : undefined}
                                                            >
                                                                {/* Active Indicator & Glow */}
                                                                {isActive && (
                                                                    <motion.div
                                                                        layoutId="activeTab"
                                                                        className="absolute inset-0 bg-slate-600 rounded-xl shadow-md"
                                                                        initial={false}
                                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                    />
                                                                )}

                                                                {/* Content */}
                                                                <div className={`relative z-10 flex items-center ${isCollapsed ? '' : 'gap-3.5 w-full'}`}>
                                                                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                                                                    {!isCollapsed && (
                                                                        <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </nav>

                {/* Logout Footer */}
                <div className="relative p-4 mt-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
                        <button
                            onClick={handleLogout}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} w-full text-red-400 hover:text-red-300 transition-colors group cursor-pointer`}
                            title={isCollapsed ? 'خروج از حساب' : undefined}
                        >
                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors flex-shrink-0">
                                <LogOut className="w-5 h-5" />
                            </div>
                            {!isCollapsed && (
                                <div className="text-right">
                                    <span className="block text-sm font-bold">خروج از حساب</span>
                                    <span className="text-xs text-slate-500 group-hover:text-red-400/70 transition-colors">پایان نشست کاربری</span>
                                </div>
                            )}
                        </button>
                    </div>

                    {!isCollapsed && (
                        <p className="text-center text-[10px] text-slate-600 mt-4 font-mono">
                            v1.0.0 • Ice Center Admin
                        </p>
                    )}
                </div>
            </aside>
        </>
    );
}
