import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: { default: 'پنل مدیریت آیس سنتر', template: '%s | پنل مدیریت آیس سنتر' },
};

import { Suspense } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import DashboardContent from '@/components/admin/DashboardContent';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/hooks/useAuth';
import { AdminSidebarProvider } from '@/context/AdminSidebarContext';
import { requireAdminAction } from '@/lib/admin-auth';

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-ocean animate-spin" />
        </div>
    );
}

function HeaderFallback() {
    return <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />;
}

async function DynamicHeader() {
    await connection();
    let adminName = undefined;
    let adminRoles: string[] = [];
    try {
        const payload = await requireAdminAction();
        adminName = payload.phone;
        adminRoles = payload.roles || [];
    } catch {
        // Fallback for unauthenticated or DB error state handled by AuthGuard
    }

    return <Header adminName={adminName} adminRoles={adminRoles} />;
}

async function DynamicSidebar() {
    await connection();
    let adminRoles: string[] = [];
    try {
        const payload = await requireAdminAction();
        adminRoles = payload.roles || [];
    } catch {
        // Fallback for unauthenticated or DB error state handled by AuthGuard
    }

    return <Sidebar adminRoles={adminRoles} />;
}

async function AuthGuard({ children }: { children: React.ReactNode }) {
    await connection();
    try {
        await requireAdminAction();
    } catch {
        redirect('/admin/login');
    }

    return <>{children}</>;
}

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AdminSidebarProvider>
                <div className="flex min-h-screen bg-gray-50">
                    {/* Sidebar */}
                    <Suspense fallback={<div className="w-20 lg:w-72 bg-gray-700 h-screen fixed right-0 top-0 transition-all duration-300" />}>
                        <DynamicSidebar />
                    </Suspense>

                    {/* Main Content */}
                    <DashboardContent>
                        <Suspense fallback={<HeaderFallback />}>
                            <DynamicHeader />
                        </Suspense>

                        <main className="p-4 md:p-6">
                            <Suspense fallback={<LoadingFallback />}>
                                <AuthGuard>
                                    {children}
                                </AuthGuard>
                            </Suspense>
                        </main>
                    </DashboardContent>
                </div>
            </AdminSidebarProvider>
        </AuthProvider>
    );
}

