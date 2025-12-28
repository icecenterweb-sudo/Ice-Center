'use client';

export default function CategoryLoading() {
    return (
        <div className="min-h-screen bg-neutral-50" dir="rtl">
            {/* Breadcrumb Skeleton */}
            <div className="bg-white border-b border-neutral-100">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Subcategories Showcase Skeleton */}
            <div className="bg-white border-b border-neutral-100">
                <div className="max-w-[1440px] mx-auto py-4 px-4 lg:px-6">
                    <div className="flex gap-3 overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-[140px] h-[44px] bg-neutral-200 rounded-xl animate-shimmer"
                                style={{ animationDelay: `${i * 80}ms` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Skeleton */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden sticky top-4">
                            {/* Header */}
                            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 bg-neutral-200 rounded animate-pulse" />
                                    <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse" />
                                </div>
                            </div>

                            {/* Filter Sections */}
                            <div className="p-4 space-y-4">
                                {/* Subcategory Filter */}
                                <div className="space-y-3">
                                    <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse" />
                                    <div className="space-y-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="h-4 w-4 bg-neutral-200 rounded-full animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                                                <div className="h-4 flex-1 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-neutral-100 pt-4" />

                                {/* Price Filter */}
                                <div className="space-y-3">
                                    <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                                    <div className="space-y-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-8 bg-neutral-200 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-neutral-100 pt-4" />

                                {/* Brand Filter */}
                                <div className="space-y-3">
                                    <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="h-4 w-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                                                <div className="h-4 flex-1 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Skeleton */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile Header Skeleton */}
                        <div className="lg:hidden flex items-center justify-between mb-4">
                            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
                            <div className="h-8 w-20 bg-neutral-200 rounded-lg animate-pulse" />
                        </div>

                        {/* Sort Bar Skeleton */}
                        <div className="hidden lg:flex items-center gap-4 mb-6 pb-4 border-b border-neutral-200">
                            <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse" />
                            <div className="flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-8 w-20 bg-neutral-200 rounded-lg animate-pulse" />
                                ))}
                            </div>
                            <div className="mr-auto h-4 w-16 bg-neutral-200 rounded animate-pulse" />
                        </div>

                        {/* Product Grid Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl p-4 border border-neutral-100"
                                >
                                    {/* Image Skeleton */}
                                    <div
                                        className="aspect-[4/5] bg-neutral-200 rounded-lg mb-3 animate-shimmer"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    />

                                    {/* Title Skeleton */}
                                    <div className="space-y-2 mb-3">
                                        <div
                                            className="h-4 bg-neutral-200 rounded animate-shimmer"
                                            style={{ animationDelay: `${i * 50 + 100}ms` }}
                                        />
                                        <div
                                            className="h-4 w-3/4 bg-neutral-200 rounded animate-shimmer"
                                            style={{ animationDelay: `${i * 50 + 150}ms` }}
                                        />
                                    </div>

                                    {/* Price Skeleton */}
                                    <div className="flex flex-col items-end gap-1">
                                        <div
                                            className="h-3 w-16 bg-neutral-200 rounded animate-shimmer"
                                            style={{ animationDelay: `${i * 50 + 200}ms` }}
                                        />
                                        <div
                                            className="h-5 w-24 bg-neutral-200 rounded animate-shimmer"
                                            style={{ animationDelay: `${i * 50 + 250}ms` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Skeleton */}
                        <div className="mt-10 flex items-center justify-center gap-2">
                            <div className="h-10 w-16 bg-neutral-200 rounded-lg animate-pulse" />
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-10 w-10 bg-neutral-200 rounded-lg animate-pulse" />
                                ))}
                            </div>
                            <div className="h-10 w-16 bg-neutral-200 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
            </main>

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
