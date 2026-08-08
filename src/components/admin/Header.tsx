'use client';

import { Bell, Search, PanelRightClose, PanelRight } from 'lucide-react';
import { useAdminSidebar } from '@/context/AdminSidebarContext';

const ROLE_BADGES: Record<string, { label: string; bg: string }> = {
    SUPER_ADMIN: { label: 'سوپر ادمین', bg: 'bg-red-100 text-red-700 border-red-200' },
    GENERAL_MANAGER: { label: 'مدیر کل', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    BLOG_WRITER: { label: 'نویسنده', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    SUPPORT_ADMIN: { label: 'پشتیبان', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
    INVENTORY_MANAGER: { label: 'انباردار', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
    ADMIN: { label: 'مدیر معمولی', bg: 'bg-gray-100 text-gray-700 border-gray-200' },
    EDITOR: { label: 'ویرایشگر', bg: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
};

export default function Header({ adminName, adminRoles = [] }: { adminName?: string; adminRoles?: string[] }) {
    const { isCollapsed, toggleSidebar } = useAdminSidebar();

    const primaryRole = adminRoles[0] || 'ADMIN';
    const roleBadge = ROLE_BADGES[primaryRole] || ROLE_BADGES.ADMIN;

    return (
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Sidebar Toggle Button (Desktop) */}
            <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={isCollapsed ? 'باز کردن منو' : 'بستن منو'}
            >
                {isCollapsed ? (
                    <PanelRight className="w-5 h-5" />
                ) : (
                    <PanelRightClose className="w-5 h-5" />
                )}
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجو..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:border-ocean focus:ring-2 focus:ring-frost transition-all outline-none text-sm md:text-base"
                    />
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 md:gap-4 ml-4 md:ml-6">
                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Admin Info */}
                <div className="flex items-center gap-2 md:gap-3 border-r border-gray-200 pr-2 md:pr-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-800">{adminName || 'مدیر سیستم'}</p>
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border mt-0.5 ${roleBadge.bg}`}>
                            {roleBadge.label}
                        </span>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-ocean to-sky-breeze flex items-center justify-center text-white font-bold shadow-lg text-sm md:text-base">
                        {adminName?.[0] || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
}
