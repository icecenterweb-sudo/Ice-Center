'use client';

import React from 'react';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 md:p-6" dir="rtl">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
      
      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-32 flex flex-col justify-between">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Content layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main section (e.g. table/chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 h-[400px]">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 h-[400px]">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
