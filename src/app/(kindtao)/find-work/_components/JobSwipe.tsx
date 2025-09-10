"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JobPost } from "@/types/jobPosts";
import JobCardMobile from "@/components/jobs/JobCardMobile";
import JobSearch, { Filters } from "@/components/jobs/JobSearch";
import { JobService } from "@/services/JobService";

type JobSwipeProps = {
  initialJobs: JobPost[];
  pageSize: number;
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
  initialFilters?: Filters;
  onApply?: (job: JobPost) => void;
  onSkip?: (job: JobPost) => void;
};

export default function JobSwipe({
  initialJobs,
  pageSize,
  locations,
  jobTypes,
  payTypes,
  initialFilters,
  onApply,
  onSkip,
}: JobSwipeProps) {
  const router = useRouter();
  const [cards, setCards] = useState<JobPost[]>(initialJobs);
  const [activeIndex, setActiveIndex] = useState(initialJobs.length - 1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const isApplyingRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // State management for jobs and filtering
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const [filters, setFilters] = useState<Filters>(
    initialFilters || {
      tags: [],
      location: "All",
      jobType: "All",
      payType: "All",
      keyword: "",
    }
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Update cards when jobs change
  useEffect(() => {
    setCards(jobs);
    setActiveIndex(jobs.length - 1);
  }, [jobs]);

  // Load more jobs when we're running low
  useEffect(() => {
    if (activeIndex <= 3 && hasMore && !loading) {
      loadMore();
    }
  }, [activeIndex, hasMore, loading]);

  // Handle filter changes
  const handleFilterChange = async (newFilters: Filters) => {
    setFilters(newFilters);
    setLoading(true);
    try {
      const filteredJobs = await JobService.fetchJobsClient({
        location: newFilters.location,
        jobType: newFilters.jobType,
        payType: newFilters.payType as any,
        keyword: newFilters.keyword,
        tags: newFilters.tags,
        limit: pageSize,
        offset: 0,
      });
      setJobs(filteredJobs);
      setHasMore(filteredJobs.length === pageSize);
    } catch (error) {
      console.error("Failed to filter jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load more jobs function
  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const more = await JobService.fetchJobsClient({
        location: filters.location,
        jobType: filters.jobType,
        payType: filters.payType as any,
        keyword: filters.keyword,
        tags: filters.tags,
        limit: pageSize,
        offset: jobs.length,
      });
      if (more.length > 0) {
        setJobs((prev) => [...prev, ...more]);
        if (more.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // No additional scroll prevention - rely on CSS touchAction and pointer events

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating || isApplying || isApplyingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isAnimating || isApplying || isApplyingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Allow more vertical movement but still limit it
    const limitedY = Math.abs(dy) > 100 ? (dy > 0 ? 100 : -100) : dy;

    setOffset({ x: dx, y: limitedY });
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging || isAnimating || isApplying || isApplyingRef.current) {
      return;
    }

    setIsDragging(false);
    setIsAnimating(true);

    const currentJob = cards[activeIndex];
    if (!currentJob) {
      setIsAnimating(false);
      return;
    }

    // Much easier swiping thresholds
    const SWIPE_THRESHOLD = 80; // Increased to make actions require very deliberate swipes
    const VELOCITY_THRESHOLD = 0.2;
    const RETURN_THRESHOLD = 70; // Much larger area for returning to middle

    // Calculate velocity based on distance and time
    const velocity = Math.abs(offset.x) / 50;

    // Check if user wants to return card to middle (swipe back towards center)
    if (Math.abs(offset.x) < RETURN_THRESHOLD) {
      // Reset card with smooth animation
      animateCardReset();
      return;
    }

    // Check for swipe with adjusted threshold
    if (
      offset.x > SWIPE_THRESHOLD ||
      (offset.x > 50 && velocity > VELOCITY_THRESHOLD)
    ) {
      // Swipe right = apply
      setIsApplying(true);
      isApplyingRef.current = true;
      animateCardExit("right", () => {
        onApply?.(currentJob);
        // Navigate to apply page
        router.push(`/apply?jobId=${currentJob.id}`);
        removeCard();
        // Keep isApplying true for a bit longer to prevent any additional swipes
        setTimeout(() => {
          setIsApplying(false);
          isApplyingRef.current = false;
        }, 1000);
      });
      return;
    } else if (
      offset.x < -SWIPE_THRESHOLD ||
      (offset.x < -50 && velocity > VELOCITY_THRESHOLD)
    ) {
      // Swipe left = skip
      animateCardExit("left", () => {
        onSkip?.(currentJob);
        removeCard();
      });
      return;
    }

    // If not enough for action but more than return threshold, still allow return to middle
    animateCardReset();
  }, [
    offset.x,
    cards,
    activeIndex,
    onApply,
    onSkip,
    isDragging,
    isAnimating,
    isApplying,
    router,
  ]);

  const animateCardExit = (
    direction: "left" | "right",
    callback: () => void
  ) => {
    const exitX = direction === "right" ? 1000 : -1000;
    setOffset({ x: exitX, y: 0 });

    setTimeout(() => {
      callback();
      // Clean up all states
      setOffset({ x: 0, y: 0 });
      setIsAnimating(false);
    }, 250);
  };

  const animateCardReset = () => {
    setOffset({ x: 0, y: 0 });
    setTimeout(() => {
      setIsAnimating(false);
    }, 150);
  };

  const removeCard = useCallback(() => {
    // Actually remove the card from the array
    setCards((prevCards) => {
      const newCards = prevCards.filter((_, index) => index !== activeIndex);
      return newCards;
    });

    // Update active index to point to the next card
    setActiveIndex((prev) => prev - 1);
  }, [activeIndex]);

  // More responsive rotation and overlay
  const rotation = offset.x * 0.15;
  const overlayText = offset.x > 80 ? "Apply" : offset.x < -80 ? "Skip" : null;
  const overlayOpacity = Math.min(Math.abs(offset.x) / 120, 0.9);

  // Show overlay with gradual color based on swipe direction
  const showOverlay = Math.abs(offset.x) > 20; // Start showing overlay at 20px
  const overlayColor = offset.x > 0 ? "bg-green-500" : "bg-red-500";

  // Show loading state when no cards and loading
  if (cards.length === 0 && loading) {
    return (
      <div className="relative w-full max-w-md h-[600px] mx-auto flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC0000]"></div>
      </div>
    );
  }

  // Show no more jobs state
  if (activeIndex < 0 || cards.length === 0) {
    return (
      <div className="relative w-full max-w-md h-[600px] mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No more jobs
          </h3>
          <p className="text-gray-600">
            You've seen all available jobs. Check back later for new
            opportunities!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Component */}
      <div className="px-4 pb-6 relative z-40">
        <JobSearch
          locations={locations}
          jobTypes={jobTypes}
          payTypes={payTypes}
          onSearch={handleFilterChange}
          initialFilters={initialFilters}
        />
      </div>

      {/* Swiper Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] mx-auto overflow-hidden"
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        {/* Full area overlay for active card */}
        {showOverlay && !isApplying && (
          <div
            className={`absolute inset-0 flex items-start justify-center pt-8 text-4xl font-bold text-white pointer-events-none transition-all duration-300 ease-in-out ${overlayColor}`}
            style={{ opacity: overlayOpacity, zIndex: 1 }}
          >
            {overlayText}
          </div>
        )}

        {/* Applying overlay */}
        {(isApplying || isApplyingRef.current) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none transition-all duration-300 ease-in-out"
            style={{ zIndex: 1 }}
          >
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mb-3"></div>
              <p className="text-lg font-semibold text-gray-800">Applying...</p>
            </div>
          </div>
        )}

        {cards.map((job, index) => {
          const isActive = index === activeIndex;
          const isVisible = index >= activeIndex - 2;

          if (!isVisible) return null;

          return (
            <div
              key={job.id}
              className={`absolute inset-0 flex items-center justify-center w-full ${
                (isApplying || isApplyingRef.current) && isActive
                  ? "pointer-events-none"
                  : ""
              }`}
              style={{ zIndex: index + 1 }} // Higher z-index to stay above overlay
              onPointerDown={
                isActive && !isApplying && !isApplyingRef.current
                  ? handlePointerDown
                  : undefined
              }
              onPointerMove={
                isActive && !isApplying && !isApplyingRef.current
                  ? handlePointerMove
                  : undefined
              }
              onPointerUp={
                isActive && !isApplying && !isApplyingRef.current
                  ? handlePointerUp
                  : undefined
              }
            >
              {/* Card */}
              <div
                className={`w-full max-w-md transition-transform duration-150 ${
                  isActive ? "" : "scale-95"
                }`}
                style={
                  isActive
                    ? {
                        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                      }
                    : {
                        transform: `scale(${
                          0.95 - (activeIndex - index) * 0.05
                        })`,
                      }
                }
              >
                <JobCardMobile
                  job={job}
                  isApplying={(isApplying || isApplyingRef.current) && isActive}
                  onApply={(j) => {
                    if (isApplying || isApplyingRef.current) return;
                    setIsApplying(true);
                    isApplyingRef.current = true;
                    onApply?.(j);
                    router.push(`/apply?jobId=${j.id}`);
                    removeCard();
                    // Keep isApplying true for a bit longer to prevent any additional swipes
                    setTimeout(() => {
                      setIsApplying(false);
                      isApplyingRef.current = false;
                    }, 1000);
                  }}
                  onSkip={(j) => {
                    onSkip?.(j);
                    removeCard();
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            style={{ zIndex: 10 }}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000]"></div>
          </div>
        )}
      </div>
    </div>
  );
}
