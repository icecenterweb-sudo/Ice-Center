import { prisma } from '@/lib/db';
import DashboardView from './DashboardView';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const productCount = await prisma.product.count();

    return <DashboardView productCount={productCount} />;
}
