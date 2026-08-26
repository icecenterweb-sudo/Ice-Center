'use client';

import { useAdminSidebar } from '@/context/AdminSidebarContext';

export default function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useAdminSidebar();

    return (
        <div className={`flex-1 min-w-0 flex flex-col ${isCollapsed ? 'lg:mr-20' : 'lg:mr-72'} transition-all duration-300`}>
            {children}
        </div>
    );
}
