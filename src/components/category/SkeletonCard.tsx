'use client';

interface SkeletonCardProps {
    delay?: number;
}

export default function SkeletonCard({ delay = 0 }: SkeletonCardProps) {
    return (
        <div className="bg-white rounded-xl p-4 border border-neutral-100">
            {/* Image Skeleton */}
            <div
                className="aspect-[4/5] bg-neutral-200 rounded-lg mb-3 animate-shimmer"
                style={{ animationDelay: `${delay}ms` }}
            />

            {/* Title Skeleton */}
            <div className="space-y-2 mb-3">
                <div
                    className="h-4 bg-neutral-200 rounded animate-shimmer"
                    style={{ animationDelay: `${delay + 100}ms` }}
                />
                <div
                    className="h-4 w-3/4 bg-neutral-200 rounded animate-shimmer"
                    style={{ animationDelay: `${delay + 150}ms` }}
                />
            </div>

            {/* Price Skeleton */}
            <div className="flex flex-col items-end gap-1">
                <div
                    className="h-3 w-16 bg-neutral-200 rounded animate-shimmer"
                    style={{ animationDelay: `${delay + 200}ms` }}
                />
                <div
                    className="h-5 w-24 bg-neutral-200 rounded animate-shimmer"
                    style={{ animationDelay: `${delay + 250}ms` }}
                />
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
                    animation: shimmer 1.5s infinite linear;
                }
            `}</style>
        </div>
    );
}
