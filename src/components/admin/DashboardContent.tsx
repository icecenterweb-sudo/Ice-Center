'use client';

import { useEffect, useState } from 'react';

export default function DashboardContent({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        // Listen to localStorage changes
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved) {
            setIsCollapsed(JSON.parse(saved));
        }

        // Listen for storage events from sidebar
        const handleStorage = () => {
            const saved = localStorage.getItem('sidebarCollapsed');
            if (saved) {
                setIsCollapsed(JSON.parse(saved));
            }
        };

        window.addEventListener('storage', handleStorage);
        // Custom event for same-window updates
        window.addEventListener('sidebarToggle', handleStorage as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('sidebarToggle', handleStorage as EventListener);
        };
    }, []);

    return (
        <div className={`flex-1 ${isCollapsed ? 'lg:mr-20' : 'lg:mr-72'} w-full transition-all duration-300`}>
            {children}
        </div>
    );
}
