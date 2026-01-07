import { Suspense } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import DashboardContent from '@/components/admin/DashboardContent';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/jwt';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Loader2 } from 'lucide-react';

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
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    // We don't redirect here, just get info if available. 
    // AuthGuard handles the protection.
    let adminName = undefined;
    if (token) {
        const payload = await verifyAdminToken(token);
        if (payload) {
            adminName = payload.phone;
        }
    }

    return <Header adminName={adminName} />;
}

async function AuthGuard({ children }: { children: React.ReactNode }) {
    await connection();
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
        redirect('/admin/login');
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
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
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Suspense fallback={<div className="w-20 lg:w-72 bg-gray-700 h-screen fixed right-0 top-0 transition-all duration-300" />}>
                <Sidebar />
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
    );
}

