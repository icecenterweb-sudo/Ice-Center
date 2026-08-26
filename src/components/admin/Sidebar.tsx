'use client';

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
    ChevronRight,
    X,
    Tag,
    Palette,
    BarChart3,
    MessageSquare,
    Terminal,
    Shield,
    Settings,
    Star
} from 'lucide-react';
import { canAccessSection, AdminSection } from '@/lib/admin-roles';

const menuItems: { icon: React.ComponentType<{ className?: string }>; label: string; href: string; section: AdminSection }[] = [
    { icon: LayoutDashboard, label: 'داشبورد', href: '/admin/dashboard', section: 'DASHBOARD' },
    { icon: Package, label: 'محصولات', href: '/admin/dashboard/products', section: 'PRODUCTS' },
    { icon: Star, label: 'نظرات محصولات', href: '/admin/dashboard/reviews', section: 'PRODUCTS' },
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
];

// Grouped navigation (IA1) — heading style mirrors MobileMenu.tsx's labeled
// sections (text-xs font-bold, small padding), recolored for the dark sidebar.
// Ordering follows operational-first principle (IA2): daily ops → store → content
// → marketing/appearance → system/config.
const MENU_GROUPS: { title: string; items: typeof menuItems }[] = [
    {
        title: 'عملیات روزمره',
        items: [
            menuItems[0], // Dashboard
            menuItems[10], // Orders
            menuItems[9], // Users
            menuItems[11], // Support
        ],
    },
    {
        title: 'فروشگاه',
        items: [
            menuItems[1], // Products
            menuItems[2], // Product Reviews
            menuItems[3], // Offers
            menuItems[4], // Categories
        ],
    },
    {
        title: 'محتوا',
        items: [menuItems[5]], // Blog
    },
    {
        title: 'بازاریابی و ظاهر',
        items: [menuItems[7]], // Appearance
    },
    {
        title: 'سیستم',
        items: [
            menuItems[6], // Analytics
            menuItems[8], // Settings
            menuItems[12], // Errors
            menuItems[13], // Admin Management
        ],
    },
];

// Items whose section owns real nested/dynamic sub-routes — they stay active
// while an admin is inside a child page (e.g. /orders/123). Everything else,
// including Dashboard (/admin/dashboard, which is a prefix of EVERY admin
// route), must match exactly so only one item — and therefore only one
// framer-motion layoutId="activeTab" pill — is ever active.
const PREFIX_ACTIVE_HREFS = new Set([
    '/admin/dashboard/products',    // add / [id] / [id]/edit
    '/admin/dashboard/orders',      // [id]
    '/admin/dashboard/users',       // [id]
    '/admin/dashboard/offers',      // add / [id] / [id]/edit
    '/admin/dashboard/categories',  // add / edit/[id] / subcategories/**
    '/admin/dashboard/blog',        // comments / new / [id] / [id]/edit
    '/admin/dashboard/appearance',  // banners/** / slides/**
]);

export default function Sidebar({ adminRoles = [] }: { adminRoles?: string[] }) {
    const pathname = usePathname();
    const { isCollapsed, isMobileOpen, setIsMobileOpen } = useAdminSidebar();

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
                <div className="relative p-8 mb-4">
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

                {/* Navigation — grouped (IA1); role filtering unchanged */}
                <nav className="relative flex-1 px-4 space-y-4 overflow-y-auto custom-scrollbar">
                    {MENU_GROUPS.map((group) => {
                        const visibleItems = group.items.filter(item => canAccessSection(adminRoles, item.section));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.title}>
                                {!isCollapsed && (
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 px-2">{group.title}</h4>
                                )}
                                <div className="space-y-2">
                                    {visibleItems.map((item, index) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href
                                            || (PREFIX_ACTIVE_HREFS.has(item.href) && pathname.startsWith(item.href + '/'));

                                        return (
                                            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`relative group flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                                        ? 'bg-slate-700/50 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    title={isCollapsed ? item.label : undefined}
                                                >
                                                    {/* Active Indicator & Glow */}
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeTab"
                                                            className="absolute inset-0 bg-slate-600 rounded-xl shadow-lg"
                                                            initial={false}
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        />
                                                    )}

                                                    {/* Content */}
                                                    <div className={`relative z-10 flex items-center ${isCollapsed ? '' : 'gap-4 w-full'}`}>
                                                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                                                        {!isCollapsed && (
                                                            <>
                                                                <span className="font-medium">{item.label}</span>
                                                                {isActive && (
                                                                    <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        );
                                    })}
                                </div>
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
