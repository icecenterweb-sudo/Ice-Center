'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminSidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export const AdminSidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsCollapsed(JSON.parse(saved));
        }
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebarCollapsed', JSON.stringify(next));
            return next;
        });
    };

    return (
        <AdminSidebarContext.Provider
            value={{
                isCollapsed,
                toggleSidebar,
                isMobileOpen,
                setIsMobileOpen,
            }}
        >
            {children}
        </AdminSidebarContext.Provider>
    );
};

export const useAdminSidebar = () => {
    const context = useContext(AdminSidebarContext);
    if (!context) {
        throw new Error('useAdminSidebar must be used within an AdminSidebarProvider');
    }
    return context;
};
