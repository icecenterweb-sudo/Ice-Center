import { prisma } from '@/lib/db';
import { Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import ReviewsTable from './ReviewsTable';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { requireRolePage } from '@/lib/admin-auth';

async function getReviews() {
    await connection(); // Opt out of caching
    return prisma.productReview.findMany({
        include: {
            product: { select: { id: true, name: true, slug: true } },
            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
}

async function getStats() {
    await connection(); // Opt out of caching
    const [total, pending, approved, rejected] = await Promise.all([
        prisma.productReview.count(),
        prisma.productReview.count({ where: { status: 'PENDING' } }),
        prisma.productReview.count({ where: { status: 'APPROVED' } }),
        prisma.productReview.count({ where: { status: 'REJECTED' } }),
    ]);
    return { total, pending, approved, rejected };
}

async function AdminReviewsContent() {
    await requireRolePage('PRODUCTS');
    const [reviews, stats] = await Promise.all([getReviews(), getStats()]);

    return (
        <div className="p-6" dir="rtl">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">نظرات محصولات</h1>
                        <p className="text-gray-500 text-sm mt-1">تایید، رد و مدیریت نقدهای کاربران</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Star className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                            <div className="text-sm text-gray-500">کل نقدها</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-gray-500">در انتظار تایید</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                            <div className="text-sm text-gray-500">تایید شده</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-sm text-gray-500">رد شده</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Table with Dialog */}
            <ReviewsTable reviews={reviews} />
        </div>
    );
}

export default function AdminReviewsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری نظرات...</div>}>
            <AdminReviewsContent />
        </Suspense>
    );
}
