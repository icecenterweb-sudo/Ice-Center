import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import DashboardContent from '@/components/admin/DashboardContent';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/jwt';
import { redirect } from 'next/navigation';

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get admin token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    // Verify token and get admin data
    let adminName = 'مدیر سیستم';

    if (token) {
        const payload = await verifyAdminToken(token);
        if (payload) {
            adminName = payload.phone; // You can enhance this to get actual name from DB
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <DashboardContent>
                <Header adminName={adminName} />
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </DashboardContent>
        </div>
    );
}
