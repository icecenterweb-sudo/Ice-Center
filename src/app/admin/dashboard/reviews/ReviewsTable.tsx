'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, X, Star, User, Calendar, Package } from 'lucide-react';
import ReviewActions from './ReviewActions';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusTone } from '@/components/ui/StatusBadge';

const REVIEW_TONE: Record<string, StatusTone> = {
    APPROVED: 'green',
    PENDING: 'yellow',
    REJECTED: 'red',
};

interface ProductReview {
    id: number;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    adminNote: string | null;
    createdAt: Date;
    product: { id: number; name: string; slug: string };
    user: { id: number; firstName: string | null; lastName: string | null; phone: string } | null;
}

interface ReviewsTableProps {
    reviews: ProductReview[];
}



const getStatusLabel = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'تایید شده';
        case 'PENDING':
            return 'در انتظار';
        case 'REJECTED':
            return 'رد شده';
        default:
            return status;
    }
};

const getDisplayName = (review: ProductReview) => {
    if (review.user) {
        return `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'کاربر';
    }
    return 'کاربر';
};

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                        i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
}

export default function ReviewsTable({ reviews }: ReviewsTableProps) {
    const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);

    const pendingFirst = [...reviews].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <>
            {/* Reviews Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto scrollbar-sleek">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    کاربر
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    امتیاز
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    متن نقد
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    محصول
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    وضعیت
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                                    تاریخ
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                                    عملیات
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingFirst.length > 0 ? (
                                pendingFirst.map((review) => (
                                    <tr
                                        key={review.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {getDisplayName(review)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StarRating rating={review.rating} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedReview(review)}
                                                className="text-sm text-gray-700 hover:text-ocean transition-colors text-right"
                                            >
                                                {(review.title || review.comment).split(/\s+/).slice(0, 5).join(' ')}
                                                {(review.title || review.comment).split(/\s+/).length > 5 ? '...' : ''}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/products/${review.product.slug}`}
                                                target="_blank"
                                                className="text-sm text-ocean hover:underline line-clamp-1"
                                            >
                                                {review.product.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                label={getStatusLabel(review.status)}
                                                tone={REVIEW_TONE[review.status] ?? 'gray'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(review.createdAt).toLocaleDateString('fa-IR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setSelectedReview(review)}
                                                    className="p-2 text-gray-500 hover:text-ocean transition-colors"
                                                    title="مشاهده کامل"
                aria-label="مشاهده کامل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <ReviewActions
                                                    reviewId={review.id}
                                                    currentStatus={review.status}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        هنوز نظری ثبت نشده است.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Detail Dialog */}
            {selectedReview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto scrollbar-sleek shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">جزئیات نقد</h3>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Dialog Content */}
                        <div className="p-6 space-y-4">
                            {/* User Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ocean/10 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-ocean" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">
                                        {getDisplayName(selectedReview)}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(selectedReview.createdAt).toLocaleDateString('fa-IR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Rating + Status */}
                            <div className="flex items-center gap-4">
                                <StarRating rating={selectedReview.rating} />
                                <StatusBadge
                                    label={getStatusLabel(selectedReview.status)}
                                    tone={REVIEW_TONE[selectedReview.status] ?? 'gray'}
                                />
                            </div>

                            {/* Product Link */}
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">محصول:</span>
                                <Link
                                    href={`/products/${selectedReview.product.slug}`}
                                    target="_blank"
                                    className="text-sm text-ocean hover:underline"
                                >
                                    {selectedReview.product.name}
                                </Link>
                            </div>

                            {/* Full Review Content */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                {selectedReview.title && (
                                    <div className="font-medium text-gray-800 mb-2">
                                        {selectedReview.title}
                                    </div>
                                )}
                                <p className="text-gray-800 leading-7 whitespace-pre-wrap">
                                    {selectedReview.comment}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <ReviewActions
                                        reviewId={selectedReview.id}
                                        currentStatus={selectedReview.status}
                                    />
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    بستن
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
