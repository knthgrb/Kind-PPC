"use client";

export default function ChatSkeleton({
  hasSelectedConversation = false,
  showSwipeSkeletonWhenEmpty = true,
}: {
  hasSelectedConversation?: boolean;
  showSwipeSkeletonWhenEmpty?: boolean;
}) {
  return (
    <div className="flex flex-1 h-full relative">
      {/* Sidebar Skeleton (Matches/Messages) */}
      <div className="hidden md:flex w-80 flex-col border-r border-gray-200 bg-white">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-4 py-2 bg-gray-100 gap-1">
            <div className="flex-1 py-3 rounded bg-white border border-gray-200 animate-pulse" />
            <div className="flex-1 py-3 rounded bg-white border border-gray-200 animate-pulse" />
          </div>
        </div>

        {/* Conversations/Matches list */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 border-b border-gray-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-3 bg-gray-300 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 h-full overflow-hidden">
        {hasSelectedConversation ? (
          // Chat panel skeleton
          <>
            <div className="flex-1 flex flex-col h-full">
              {/* Chat Header Skeleton */}
              <div className="flex items-center justify-between p-4 shrink-0 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="ml-3 space-y-1">
                    <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              </div>

              {/* Messages area skeleton */}
              <div className="flex-1 p-4 space-y-4 bg-[#f5f6fa]">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      index % 3 === 0 ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-xs rounded-lg p-3">
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message input skeleton */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 bg-gray-300 rounded-lg animate-pulse flex-1"></div>
                  <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Profile Side Panel Skeleton */}
            <div className="hidden lg:flex w-72 border-l border-gray-200 bg-white animate-pulse flex-col h-full">
              {/* Profile header skeleton */}
              <div className="p-4 border-b border-gray-100">
                <div className="w-full flex items-center justify-center mb-3">
                  <div className="w-32 h-32 bg-gray-300 rounded-full" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                </div>
              </div>

              {/* Profile info skeleton */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                  <div className="h-4 bg-gray-300 rounded w-full" />
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="h-3 bg-gray-300 rounded w-1/3" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="h-6 bg-gray-300 rounded w-20" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="h-3 bg-gray-300 rounded w-1/3" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2].map((idx) => (
                      <div key={idx} className="h-6 bg-gray-300 rounded w-24" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                  <div className="space-y-3">
                    {[1, 2].map((idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg space-y-2"
                      >
                        <div className="h-3 bg-gray-300 rounded w-2/3" />
                        <div className="h-3 bg-gray-300 rounded w-1/2" />
                        <div className="h-3 bg-gray-300 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="h-3 bg-gray-300 rounded w-1/4" />
                  <div className="flex items-center gap-2">
                    <div className="h-8 bg-gray-300 rounded w-12" />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 bg-gray-300 rounded"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 space-y-2">
                <div className="h-10 bg-gray-300 rounded-lg" />
                <div className="h-10 bg-gray-300 rounded-lg" />
                <div className="h-10 bg-gray-300 rounded-lg" />
              </div>
            </div>
          </>
        ) : showSwipeSkeletonWhenEmpty ? (
          // Swipe UI skeleton (no conversation selected)
          <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50">
            <div className="flex-1 flex items-center justify-center p-1 md:p-4">
              <div className="w-full max-w-sm md:max-w-md h-full flex items-center justify-center">
                <div className="bg-white rounded-xl border border-[#E0E6F7] shadow-lg overflow-hidden relative w-full max-w-sm md:max-w-lg max-h-[600px] flex flex-col mx-auto">
                  {/* Card header lines */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="h-5 w-40 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  {/* Card body lines */}
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-11/12 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-10/12 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-8/12 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-9/12 animate-pulse" />
                  </div>
                  {/* Action bar skeleton */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
                      <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat panel skeleton (used when we don't want the swipe skeleton)
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between p-4 shrink-0 bg-white border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="ml-3 space-y-1">
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-300 rounded animate-pulse w-20"></div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-4 bg-[#f5f6fa]">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex ${
                    index % 3 === 0 ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-xs rounded-lg p-3">
                    <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 bg-gray-300 rounded-lg animate-pulse flex-1"></div>
                <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
