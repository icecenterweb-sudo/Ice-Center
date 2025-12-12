'use client';

import { Bell, Search, Menu } from 'lucide-react';

export default function Header({ adminName }: { adminName?: string }) {
    return (
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            {/* Mobile Menu Button - will be rendered by Sidebar component */}

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجو..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm md:text-base"
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
                        <p className="text-xs text-gray-500">ادمین</p>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg text-sm md:text-base">
                        {adminName?.[0] || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
}
