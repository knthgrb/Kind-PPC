"use client";

export default function InfoSkeleton() {
  return (
    <div className="space-y-6">
      {/* Personal Information Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-gray-200 animate-pulse shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business Information Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-gray-200 animate-pulse shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Information Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded bg-gray-200 animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

