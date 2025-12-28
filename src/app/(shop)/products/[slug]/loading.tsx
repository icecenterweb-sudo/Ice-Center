'use client';

export default function ProductLoading() {
    return (
        <div className="min-h-screen bg-neutral-50" dir="rtl">
            {/* Breadcrumb Skeleton */}
            <div className="bg-white border-b border-neutral-100">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-neutral-200 rounded animate-shimmer" />
                        <div className="h-4 w-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '50ms' }} />
                        <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '100ms' }} />
                        <div className="h-4 w-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '150ms' }} />
                        <div className="h-4 w-40 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '200ms' }} />
                    </div>
                </div>
            </div>

            {/* Main Product Section */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Image Gallery Skeleton */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-xl border border-neutral-100 p-4">
                            {/* Main Image */}
                            <div className="aspect-square bg-neutral-200 rounded-lg mb-4 animate-shimmer" />

                            {/* Thumbnails */}
                            <div className="flex gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-16 h-16 bg-neutral-200 rounded-lg animate-shimmer"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Info Skeleton */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-xl border border-neutral-100 p-5">
                            {/* Brand & Model */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-4 w-20 bg-neutral-200 rounded animate-shimmer" />
                                <div className="h-4 w-px bg-neutral-200" />
                                <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '50ms' }} />
                            </div>

                            {/* Title */}
                            <div className="space-y-2 mb-4">
                                <div className="h-6 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '100ms' }} />
                                <div className="h-6 w-3/4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '150ms' }} />
                            </div>

                            {/* English Name */}
                            <div className="h-4 w-32 bg-neutral-200 rounded mb-4 animate-shimmer" style={{ animationDelay: '200ms' }} />

                            {/* Rating */}
                            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-4 h-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${250 + i * 50}ms` }} />
                                    ))}
                                </div>
                                <div className="h-4 w-16 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: '500ms' }} />
                            </div>

                            {/* Color Selector */}
                            <div className="py-4 border-b border-neutral-100">
                                <div className="h-4 w-20 bg-neutral-200 rounded mb-3 animate-shimmer" />
                                <div className="flex gap-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="w-8 h-8 bg-neutral-200 rounded-full animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="py-4">
                                <div className="h-4 w-28 bg-neutral-200 rounded mb-3 animate-shimmer" />
                                <div className="space-y-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-neutral-200 rounded-full animate-shimmer" />
                                            <div className="h-4 flex-1 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Box Skeleton */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-neutral-100 p-5 sticky top-4">
                            {/* Seller Card */}
                            <div className="bg-neutral-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-4 w-16 bg-neutral-200 rounded animate-shimmer" />
                                    <div className="h-3 w-20 bg-neutral-200 rounded animate-shimmer" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-neutral-200 rounded animate-shimmer" />
                                    <div className="space-y-1">
                                        <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" />
                                        <div className="h-3 w-32 bg-neutral-200 rounded animate-shimmer" />
                                    </div>
                                </div>
                            </div>

                            {/* Warranty */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-5 h-5 bg-neutral-200 rounded animate-shimmer" />
                                <div className="h-4 w-28 bg-neutral-200 rounded animate-shimmer" />
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-5 h-5 bg-neutral-200 rounded animate-shimmer" />
                                <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" />
                            </div>

                            {/* Price */}
                            <div className="border-t border-neutral-100 pt-4">
                                <div className="flex flex-col items-end gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-20 bg-neutral-200 rounded animate-shimmer" />
                                        <div className="h-5 w-10 bg-neutral-200 rounded-full animate-shimmer" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-32 bg-neutral-200 rounded animate-shimmer" />
                                        <div className="h-4 w-10 bg-neutral-200 rounded animate-shimmer" />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="h-12 bg-neutral-200 rounded-lg mb-2 animate-shimmer" />
                                <div className="h-10 bg-neutral-100 rounded-lg animate-shimmer" style={{ animationDelay: '100ms' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="mt-8">
                    <div className="bg-white rounded-xl border border-neutral-100 p-6">
                        <div className="flex gap-4 border-b border-neutral-100 pb-4 mb-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-8 w-24 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 50}ms`, width: `${85 - i * 5}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shimmer Animation Styles */}
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200px 0;
                    }
                    100% {
                        background-position: calc(200px + 100%) 0;
                    }
                }
                .animate-shimmer {
                    background: linear-gradient(
                        90deg,
                        #e5e7eb 0px,
                        #f3f4f6 40px,
                        #e5e7eb 80px
                    );
                    background-size: 200px 100%;
                    animation: shimmer 2.5s infinite linear;
                }
            `}</style>
        </div>
    );
}
