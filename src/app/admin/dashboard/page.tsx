import { prisma } from '@/lib/db';
import DashboardView from './DashboardView';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    // Fetch real data from database
    const [productCount, userCount, blogPostCount, pendingComments] = await Promise.all([
        prisma.product.count(),
        prisma.user.count(),
        prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
        prisma.blogComment.count({ where: { status: 'PENDING' } }),
    ]);

    // Calculate monthly sales (placeholder - you'll need Order model for real data)
    const monthlySales = 0; // Will be updated when Order model exists

    // Get recent orders count (placeholder - you'll need Order model)
    const newOrdersCount = 0; // Will be updated when Order model exists

    return (
        <DashboardView
            productCount={productCount}
            userCount={userCount}
            monthlySales={monthlySales}
            newOrdersCount={newOrdersCount}
            blogPostCount={blogPostCount}
            pendingComments={pendingComments}
        />
    );
}

