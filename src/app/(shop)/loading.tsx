'use client';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      {/* Hero Slider Skeleton */}
      <div className="w-full h-[200px] md:h-[350px] lg:h-[400px] bg-neutral-200 animate-shimmer" />

      {/* Category Section Skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-neutral-200 rounded animate-shimmer" />
          <div className="h-4 w-20 bg-neutral-200 rounded animate-shimmer" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-neutral-200 animate-shimmer"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div
                className="h-3 w-14 bg-neutral-200 rounded animate-shimmer"
                style={{ animationDelay: `${i * 80 + 50}ms` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Amazing Offers Section Skeleton */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 py-6">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-8 w-40 bg-white/20 rounded animate-shimmer" />
            <div className="h-6 w-24 bg-white/20 rounded animate-shimmer" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[180px] md:w-[200px] bg-white/10 rounded-xl p-4"
              >
                <div
                  className="aspect-square bg-white/20 rounded-lg mb-3 animate-shimmer"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
                <div className="space-y-2">
                  <div className="h-3 bg-white/20 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                  <div className="h-3 w-3/4 bg-white/20 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                  <div className="h-4 w-1/2 bg-white/20 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 200}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Single Banner Skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
        <div className="h-[130px] md:h-[180px] bg-neutral-200 rounded-xl animate-shimmer" />
      </div>

      {/* Product Carousel Skeleton #1 */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 bg-neutral-200 rounded animate-shimmer" />
          <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] md:w-[230px] bg-white rounded-xl border border-neutral-100 p-4">
              <div
                className="aspect-[4/5] bg-neutral-200 rounded-lg mb-3 animate-shimmer"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 100}ms` }} />
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 150}ms` }} />
                <div className="h-5 w-1/2 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 200}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Carousel Skeleton #2 */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-neutral-200 rounded animate-shimmer" />
          <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] md:w-[230px] bg-white rounded-xl border border-neutral-100 p-4">
              <div
                className="aspect-[4/5] bg-neutral-200 rounded-lg mb-3 animate-shimmer"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 100}ms` }} />
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 150}ms` }} />
                <div className="h-5 w-1/2 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 200}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Double Banner Skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[130px] md:h-[180px] bg-neutral-200 rounded-xl animate-shimmer" />
          <div className="h-[130px] md:h-[180px] bg-neutral-200 rounded-xl animate-shimmer" style={{ animationDelay: '100ms' }} />
        </div>
      </div>

      {/* Product Carousel Skeleton #3 */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-neutral-200 rounded animate-shimmer" />
          <div className="h-4 w-24 bg-neutral-200 rounded animate-shimmer" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] md:w-[230px] bg-white rounded-xl border border-neutral-100 p-4">
              <div
                className="aspect-[4/5] bg-neutral-200 rounded-lg mb-3 animate-shimmer"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 100}ms` }} />
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 150}ms` }} />
                <div className="h-5 w-1/2 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 80 + 200}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blog Carousel Skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-28 bg-neutral-200 rounded animate-shimmer" />
          <div className="h-4 w-20 bg-neutral-200 rounded animate-shimmer" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-xl border border-neutral-100 overflow-hidden">
              <div
                className="h-[160px] bg-neutral-200 animate-shimmer"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                <div className="h-3 w-1/3 bg-neutral-200 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 200}ms` }} />
              </div>
            </div>
          ))}
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