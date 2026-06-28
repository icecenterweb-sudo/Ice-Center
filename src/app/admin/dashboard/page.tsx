import { prisma } from '@/lib/db';
import DashboardView from './DashboardView';
import { connection } from 'next/server';
import { Suspense } from 'react';

async function DashboardContent() {
    await connection(); // Required for dynamic data access with cacheComponents
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch real data from database
    const [productCount, userCount, blogPostCount, pendingComments, ordersThisMonth, newOrdersCount, recentAuditLogs] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
        prisma.blogComment.count({ where: { status: 'PENDING' } }),
        prisma.order.findMany({
            where: { createdAt: { gte: startOfCurrentMonth }, status: { not: 'CANCELLED' } },
            select: { total: true },
        }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.auditLog ? prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { admin: { select: { name: true } } },
        }) : Promise.resolve([]),
    ]);

    const monthlySales = ordersThisMonth.reduce((sum, o) => sum + o.total, 0);

    return (
        <DashboardView
            productCount={productCount}
            userCount={userCount}
            monthlySales={monthlySales}
            newOrdersCount={newOrdersCount}
            blogPostCount={blogPostCount}
            pendingComments={pendingComments}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recentAuditLogs={recentAuditLogs as any[]}
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

