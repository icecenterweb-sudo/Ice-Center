'use client';

import { useState } from 'react';

interface Tab {
    id: string;
    label: string;
}

interface ProductTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export default function ProductTabs({ tabs, activeTab, onTabChange }: ProductTabsProps) {
    return (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 mb-6">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'text-red-500'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-t-full"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
