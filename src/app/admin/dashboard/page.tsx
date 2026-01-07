import { prisma } from '@/lib/db';
import DashboardView from './DashboardView';
import { connection } from 'next/server';
import { Suspense } from 'react';

async function DashboardContent() {
    await connection(); // Required for dynamic data access with cacheComponents
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

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری اطلاعات...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

