'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    const [isInitialized, setIsInitialized] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('sidebarCollapsed');
            if (saved) {
                setIsCollapsed(JSON.parse(saved) === true);
            }
        } catch (e) {
            console.error('Failed to parse sidebarCollapsed:', e);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Persist state changes after initialization (#8)
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
            } catch (e) {
                console.error('Failed to save sidebarCollapsed:', e);
            }
        }
    }, [isCollapsed, isInitialized]);

    const toggleSidebar = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

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
