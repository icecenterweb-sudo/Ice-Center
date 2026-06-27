'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
}

interface ProductReviewsProps {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    productId: number;
}

export default function ProductReviews({ reviews, averageRating, totalReviews, productId }: ProductReviewsProps) {
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (comment.trim().length < 5) {
            toast.error('حداقل ۵ کاراکتر وارد کنید');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'خطا در ثبت نظر');
                return;
            }
            toast.success('نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود');
            setComment('');
            setRating(5);
            setShowForm(false);
        } catch {
            toast.error('خطا در ارتباط با سرور');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">نظرات خریداران</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            ))}
                        </div>
                        <div className="text-lg font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                        <div className="text-sm text-gray-500">({totalReviews} نظر)</div>
                    </div>
                </div>
            </div>

            {/* Submit button */}
            <div className="px-6 py-4 border-b border-gray-100">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    {showForm ? 'انصراف' : 'ثبت نظر جدید'}
                </button>
            </div>

            {/* Review form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="px-6 py-5 border-b border-gray-100 bg-gray-50 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">امتیاز شما</label>
                        <div className="flex gap-1" dir="ltr">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1"
                                >
                                    <Star
                                        className={`w-7 h-7 transition-colors ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">دیدگاه شما</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="تجربه خود را از این محصول با ما در میان بگذارید..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'در حال ارسال...' : 'ارسال نظر'}
                    </button>
                </form>
            )}

            {/* Reviews List */}
            <div className="divide-y divide-gray-100">
                {reviews.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                        <p className="text-sm">هنوز نظری برای این محصول ثبت نشده است.</p>
                        <p className="text-xs mt-1">اولین نفری باشید که نظر می‌دهد.</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900">{review.customerName}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1" dir="ltr">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-500">{review.date}</span>
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
