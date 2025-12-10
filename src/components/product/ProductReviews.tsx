import { Star } from 'lucide-react';

interface Review {
    id: number;
    customerName: string;
    businessType: string;
    rating: number;
    comment: string;
    date: string;
}

interface ProductReviewsProps {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
}

export default function ProductReviews({ reviews, averageRating, totalReviews }: ProductReviewsProps) {
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
                                    className={`w-5 h-5 ${i < Math.floor(averageRating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                            {averageRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">
                            ({totalReviews} نظر)
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="divide-y divide-gray-100">
                {reviews.map((review) => (
                    <div key={review.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-bold text-gray-900">{review.customerName}</h4>
                                <p className="text-sm text-gray-600 mt-1">{review.businessType}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
