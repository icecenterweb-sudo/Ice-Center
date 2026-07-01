'use client';

export default function BlogPostLoading() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse" dir="rtl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-4" />
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>

            {/* Cover Image */}
            <div className="w-full h-64 md:h-80 bg-gray-200 rounded-2xl" />

            {/* Title */}
            <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
            </div>

            {/* Content */}
            <div className="space-y-4 pt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="h-4 bg-gray-200 rounded"
                        style={{ width: `${90 - i * 5}%` }}
                    />
                ))}
            </div>

            {/* Paragraph blocks */}
            <div className="space-y-6 pt-4">
                {[1, 2].map((i) => (
                    <div key={i} className="space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    );
}
