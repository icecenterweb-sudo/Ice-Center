'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    Users,
    ShoppingCart,
    LogOut,
    ChevronRight,
    X
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'داشبورد', href: '/admin/dashboard' },
    { icon: Package, label: 'محصولات', href: '/admin/dashboard/products' },
    { icon: FolderTree, label: 'دسته‌بندی‌ها', href: '/admin/dashboard/categories' },
    { icon: Users, label: 'کاربران', href: '/admin/dashboard/users' },
    { icon: ShoppingCart, label: 'سفارشات', href: '/admin/dashboard/orders' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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
            <aside className={`w-72 bg-gray-700 text-white flex flex-col h-screen fixed right-0 top-0 shadow-2xl z-50 overflow-hidden transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                }`}>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden absolute left-4 top-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-50"
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
                        className="flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">پنل مدیریت</h1>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">آیس سنتر ایران</p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <nav className="relative flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                        ? 'bg-slate-700/50 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
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
                                    <div className="relative z-10 flex items-center gap-4 w-full">
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
                                        <span className="font-medium">{item.label}</span>

                                        {isActive && (
                                            <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                                        )}
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Footer */}
                <div className="relative p-4 mt-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-red-400 hover:text-red-300 transition-colors group"
                        >
                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold">خروج از حساب</span>
                                <span className="text-xs text-slate-500 group-hover:text-red-400/70 transition-colors">پایان نشست کاربری</span>
                            </div>
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-slate-600 mt-4 font-mono">
                        v1.0.0 • Ice Center Admin
                    </p>
                </div>
            </aside>
        </>
    );
}
