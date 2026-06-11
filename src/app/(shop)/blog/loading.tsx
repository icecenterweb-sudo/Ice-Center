'use client';

import React from 'react';

export default function BlogLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-8 animate-pulse" dir="rtl">
      {/* Page Header */}
      <div className="space-y-3 text-center py-6">
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 h-[420px] flex flex-col">
            <div className="w-full h-48 bg-gray-200" />
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-5 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
