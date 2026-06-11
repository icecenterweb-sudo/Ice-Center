'use client';

import React from 'react';

export default function CategorySlugLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-8 animate-pulse" dir="rtl">
      {/* Title & Desc Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-96" />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar Skeleton */}
        <div className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="space-y-2 pt-2 pr-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Bar Skeleton */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-full aspect-square bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
