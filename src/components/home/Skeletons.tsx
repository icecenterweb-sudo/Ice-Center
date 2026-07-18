'use client';

// Skeleton components for homepage streaming

export function HeroSkeleton() {
    return (
        <div className="w-full">
            <div className="hidden md:block">
                <div className="relative w-full h-[400px] skeleton-shimmer" />
            </div>
            <div className="md:hidden px-4 py-3">
                <div className="w-full h-[160px] skeleton-shimmer rounded-xl" />
            </div>
        </div>
    );
}

export function CategorySkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 my-6">
            <div className="flex gap-4 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-24 flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full skeleton-shimmer" />
                        <div className="w-16 h-3 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function OfferSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto my-6">
            <div className="bg-gradient-to-l from-rose-500 to-rose-600 rounded-2xl mx-4 lg:mx-8 p-6">
                <div className="flex gap-4 overflow-hidden">
                    <div className="flex-shrink-0 w-32 h-40 flex flex-col items-center justify-center">
                        <div className="w-20 h-6 bg-white/30 rounded animate-pulse mb-2" />
                        <div className="w-16 h-10 bg-white/30 rounded animate-pulse" />
                    </div>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-44 bg-white rounded-xl p-3 animate-pulse">
                            <div className="w-full h-28 skeleton-shimmer rounded mb-2" />
                            <div className="w-full h-3 skeleton-shimmer rounded mb-2" />
                            <div className="w-2/3 h-4 skeleton-shimmer rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ProductCarouselSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto my-8 px-4 lg:px-8">
            <div className="border border-gray-200 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="w-40 h-5 skeleton-shimmer rounded" />
                    <div className="w-20 h-4 skeleton-shimmer rounded" />
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-48 animate-pulse">
                            <div className="w-full h-36 skeleton-shimmer rounded-lg mb-3" />
                            <div className="w-full h-3 skeleton-shimmer rounded mb-2" />
                            <div className="w-2/3 h-4 skeleton-shimmer rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function BannerSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto my-6 px-4 lg:px-8">
            <div className="w-full h-[180px] skeleton-shimmer rounded-2xl" />
        </div>
    );
}

export function BlogSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto my-8 px-4 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <div className="w-32 h-5 skeleton-shimmer rounded" />
                <div className="w-20 h-4 skeleton-shimmer rounded" />
            </div>
            <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-72 animate-pulse">
                        <div className="w-full h-40 skeleton-shimmer rounded-xl mb-3" />
                        <div className="w-full h-3 skeleton-shimmer rounded mb-2" />
                        <div className="w-2/3 h-3 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
