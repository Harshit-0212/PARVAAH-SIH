import React from 'react';

export const LandingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F7F5] flex flex-col font-sans text-[#1F2937] pb-16 animate-fadeIn">
      {/* Top Banner Skeleton */}
      <div className="bg-red-50 border-b border-red-100 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="h-4 w-72 skeleton-shimmer rounded"></div>
          <div className="h-4 w-32 skeleton-shimmer rounded hidden sm:block"></div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12 w-full space-y-6">
        <div className="space-y-4 max-w-3xl">
          <div className="h-6 w-48 skeleton-shimmer rounded-full"></div>
          <div className="h-12 w-full skeleton-shimmer rounded-xl"></div>
          <div className="h-12 w-3/4 skeleton-shimmer rounded-xl"></div>
          <div className="h-5 w-full skeleton-shimmer rounded"></div>
        </div>

        <div className="flex gap-4 pt-4">
          <div className="h-12 w-48 skeleton-shimmer rounded-xl"></div>
          <div className="h-12 w-44 skeleton-shimmer rounded-xl"></div>
        </div>

        {/* 3 Value Pillars Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="w-12 h-12 skeleton-shimmer rounded-xl"></div>
              <div className="h-6 w-3/4 skeleton-shimmer rounded"></div>
              <div className="space-y-2">
                <div className="h-4 w-full skeleton-shimmer rounded"></div>
                <div className="h-4 w-5/6 skeleton-shimmer rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
