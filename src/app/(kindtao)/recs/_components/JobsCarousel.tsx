"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import SwipeableJobCard from "./SwipeableJobCard";
import { MatchedJob } from "@/services/JobMatchingService";
import { SwipeService } from "@/services/SwipeService";
import { useAuthStore } from "@/stores/useAuthStore";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
import JobSearchingAnimation from "./JobSearchingAnimation";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import { FiBriefcase } from "react-icons/fi";

export type SwipeAction = "like" | "skip" | "superlike";

// Shared flag to prevent multiple components from fetching simultaneously
let globalFetchInProgress = false;

interface JobsCarouselProps {
  jobs?: MatchedJob[];
  matchingScores?: number[];
  initialSwipeLimit?: {
    remainingSwipes: number;
    dailyLimit: number;
    canSwipe: boolean;
  };
}

interface SwipeQueueItem {
  jobId: string;
  action: SwipeAction;
  job: MatchedJob;
}

export default function JobsCarousel({
  jobs: initialJobs,
  matchingScores,
  initialSwipeLimit,
}: JobsCarouselProps) {
  const { user } = useAuthStore();
  const { showError } = useToastActions();
  const hasLoadedRef = useRef(false);
  const hasInitialData = initialJobs !== undefined;
  const hasInitialJobsRef = useRef(hasInitialData);
  const minAnimationTimeRef = useRef<number | null>(null);
  const swipeQueueRef = useRef<SwipeQueueItem[]>([]);
  const isProcessingQueueRef = useRef(false);

  // Memoize initial jobs to prevent rerenders - only compute once
  const memoizedInitialJobs = useMemo(() => {
    return initialJobs ?? [];
  }, [initialJobs]);

  useEffect(() => {
    hasInitialJobsRef.current = hasInitialData;
  }, [hasInitialData]);

  const [jobs, setJobs] = useState<MatchedJob[]>(memoizedInitialJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Show loading animation for at least 1.5 seconds even with server-side data
  const [isLoading, setIsLoading] = useState(true);
  const [swipeLimit, setSwipeLimit] = useState(initialSwipeLimit);
  const [isTopCardDragging, setIsTopCardDragging] = useState(false);
  // Initialize offset based on whether we have initial jobs
  const [currentOffset, setCurrentOffset] = useState(
    memoizedInitialJobs.length > 0 ? 10 : 0
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSwipedJobs, setHasSwipedJobs] = useState(false);
  // Track the most recent swiped job for rewind functionality (cached for fast rewind)
  const [mostRecentSwipe, setMostRecentSwipe] = useState<{
    job: MatchedJob;
    interactionId: string;
  } | null>(null);

  // Set minimum animation time when component mounts
  useEffect(() => {
    if (hasInitialJobsRef.current) {
      // If we have initial jobs, show animation for at least 1.5 seconds
      const startTime = Date.now();
      minAnimationTimeRef.current = startTime + 1500;
      // Still show loading initially
      setIsLoading(true);

      // Set jobs immediately but keep loading state
      setJobs(memoizedInitialJobs);

      // Check if minimum time has passed
      const checkMinTime = () => {
        const now = Date.now();
        if (minAnimationTimeRef.current && now >= minAnimationTimeRef.current) {
          setIsLoading(false);
          minAnimationTimeRef.current = null;
        } else if (minAnimationTimeRef.current) {
          const remaining = minAnimationTimeRef.current - now;
          setTimeout(checkMinTime, Math.min(remaining, 100));
        }
      };

      // Start checking after a short delay
      setTimeout(checkMinTime, 100);
    } else {
      // No initial jobs, will load client-side
      setIsLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only load if we don't have initial jobs and haven't loaded yet
  useEffect(() => {
    // Skip if we already have initial jobs
    if (hasInitialJobsRef.current) {
      return;
    }

    // Skip if we already loaded
    if (hasLoadedRef.current) {
      return;
    }

    // Skip if another component is already fetching
    if (globalFetchInProgress) {
      // Wait a bit and check again
      const checkInterval = setInterval(() => {
        if (!globalFetchInProgress && hasLoadedRef.current) {
          // Another component finished loading, we can stop
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    // Skip if no user
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Mark as loading and set minimum animation time
    hasLoadedRef.current = true;
    globalFetchInProgress = true;
    minAnimationTimeRef.current = Date.now() + 1500;
    setIsLoading(true);

    const loadJobs = async () => {
      try {
        const { getMatchedJobs } = await import(
          "@/actions/recs/get-matched-jobs"
        );
        const [jobsResult, limit] = await Promise.all([
          getMatchedJobs(10, 0), // Initial fetch: only 10 jobs
          SwipeService.getSwipeLimitStatus(convex, user.id),
        ]);

        setJobs(jobsResult.jobs || []);
        setCurrentOffset(10); // Set offset to 10 for next fetch
        setSwipeLimit(limit);

        // Ensure minimum animation time has passed
        const startTime = minAnimationTimeRef.current || Date.now();
        const elapsed = Date.now() - startTime + 1500;
        if (elapsed < 1500) {
          setTimeout(() => {
            setIsLoading(false);
            minAnimationTimeRef.current = null;
            globalFetchInProgress = false;
          }, 1500 - elapsed);
        } else {
          setIsLoading(false);
          minAnimationTimeRef.current = null;
          globalFetchInProgress = false;
        }
      } catch (error) {
        logger.error("Error loading jobs:", error);
        setIsLoading(false);
        minAnimationTimeRef.current = null;
        globalFetchInProgress = false;
      }
    };

    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadMoreJobs = useCallback(async () => {
    if (isLoadingMore || !user?.id) return;

    setIsLoadingMore(true);
    try {
      const { getMatchedJobs } = await import(
        "@/actions/recs/get-matched-jobs"
      );
      const jobsResult = await getMatchedJobs(10, currentOffset);

      if (jobsResult.jobs && jobsResult.jobs.length > 0) {
        setJobs((prev) => [...prev, ...jobsResult.jobs]);
        setCurrentOffset((prev) => prev + 10);
      }
    } catch (error) {
      logger.error("Error loading more jobs:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentOffset, isLoadingMore, user?.id]);

  // Update hasSwipedJobs based on cached swipe (session-only, not persisted)
  useEffect(() => {
    setHasSwipedJobs(mostRecentSwipe !== null);
  }, [mostRecentSwipe]);

  const handleRewind = async () => {
    if (!user?.id || !mostRecentSwipe) return;

    try {
      // Mark the interaction as rewound in the database
      await convex.mutation(api.swipes.rewindInteraction, {
        interactionId: mostRecentSwipe.interactionId as any,
      });

      // Add the rewound job back to the beginning of the list
      const rewoundJobExists = jobs.some(
        (job) => job.id === mostRecentSwipe.job.id
      );

      if (!rewoundJobExists) {
        setJobs((prev) => [mostRecentSwipe.job, ...prev]);
      }

      // Clear the cached swipe (rewind only works within current session)
      setMostRecentSwipe(null);

      // Invalidate matched jobs cache so rewound job appears in fresh results
      try {
        const { invalidateMatchedJobsCacheAction } = await import(
          "@/actions/recs/invalidate-matched-jobs-cache"
        );
        await invalidateMatchedJobsCacheAction(user.id);
      } catch (error) {
        // Cache invalidation failure shouldn't break the rewind
        logger.error("Error invalidating cache:", error);
      }
    } catch (error) {
      logger.error("Error rewinding job:", error);
    }
  };

  const processSwipeQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || swipeQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      let performSwipeActionFn:
        | (typeof import("@/actions/swipes/perform-swipe-action"))["performSwipeAction"]
        | null = null;

      while (swipeQueueRef.current.length > 0) {
        const [currentItem] = swipeQueueRef.current;

        try {
          if (!performSwipeActionFn) {
            ({ performSwipeAction: performSwipeActionFn } = await import(
              "@/actions/swipes/perform-swipe-action"
            ));
          }

          const result = await performSwipeActionFn({
            jobId: currentItem.jobId,
            action: currentItem.action,
          });

          if (!result?.success) {
            throw new Error(result?.error || "Swipe failed");
          }

          if (result.swipeStatus) {
            setSwipeLimit(result.swipeStatus);
          }

          if (result.interactionId) {
            setMostRecentSwipe({
              job: currentItem.job,
              interactionId: result.interactionId,
            });
          }
        } catch (error) {
          logger.error("Swipe queue item failed:", error);

          setSwipeLimit((prev) => {
            if (!prev) {
              return prev;
            }

            const isUnlimited = prev.remainingSwipes >= 999999;
            if (isUnlimited) {
              return { ...prev, canSwipe: true };
            }

            const restored = Math.min(
              prev.dailyLimit,
              prev.remainingSwipes + 1
            );
            return {
              ...prev,
              remainingSwipes: restored,
              canSwipe: true,
            };
          });

          setJobs((prev) => {
            const exists = prev.some((job) => job.id === currentItem.job.id);
            if (exists) {
              return prev;
            }
            return [currentItem.job, ...prev];
          });

          showError("We couldn't process that swipe. Please try again.");
        } finally {
          swipeQueueRef.current = swipeQueueRef.current.slice(1);
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
      if (swipeQueueRef.current.length > 0) {
        void processSwipeQueue();
      }
    }
  }, [showError]);

  const enqueueSwipe = useCallback(
    (item: SwipeQueueItem) => {
      swipeQueueRef.current = [...swipeQueueRef.current, item];
      void processSwipeQueue();
    },
    [processSwipeQueue]
  );

  const handleSwipe = (jobId: string, action: SwipeAction) => {
    if (!user?.id) {
      showError("You need to be signed in to swipe.");
      return;
    }

    if (swipeLimit && !swipeLimit.canSwipe) {
      showError(
        "You've reached your swipe limit for now. Please check back later."
      );
      return;
    }

    const swipedJob = jobs.find((job) => job.id === jobId);
    if (!swipedJob) {
      return;
    }

    if (swipeLimit) {
      setSwipeLimit((prev) => {
        if (!prev) return prev;
        const isUnlimited = prev.remainingSwipes >= 999999;
        if (isUnlimited) {
          return prev;
        }

        const nextRemaining = Math.max(prev.remainingSwipes - 1, 0);
        return {
          ...prev,
          remainingSwipes: nextRemaining,
          canSwipe: nextRemaining > 0,
        };
      });
    }

    setJobs((prevJobs) => {
      const updatedJobs = prevJobs.filter((job) => job.id !== jobId);
      if (updatedJobs.length <= 3) {
        void loadMoreJobs();
      }
      setCurrentIndex((prevIndex) =>
        Math.min(prevIndex, Math.max(updatedJobs.length - 1, 0))
      );
      return updatedJobs;
    });

    enqueueSwipe({
      jobId,
      action,
      job: swipedJob,
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <JobSearchingAnimation />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <FiBriefcase
            className="mx-auto h-12 w-12 text-gray-400"
            aria-hidden="true"
          />
          <h3 className="text-xl font-semibold text-gray-900">
            No matches for your preferences (for now)
          </h3>
          <p className="text-gray-500 text-sm">
            We&apos;ve run out of roles that fit your current job preferences.
            Check back soon or update your preferences to explore more
            opportunities.
          </p>
        </div>
      </div>
    );
  }

  // Show up to 3 cards stacked
  const visibleJobs = jobs.slice(currentIndex, currentIndex + 3);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-md h-[600px]">
        {visibleJobs.map((job, index) => (
          <SwipeableJobCard
            key={job.id}
            job={job}
            onSwipe={handleSwipe}
            index={index}
            totalCards={visibleJobs.length}
            isTopCardDragging={index === 1 ? isTopCardDragging : false}
            onDragStart={
              index === 0 ? () => setIsTopCardDragging(true) : undefined
            }
            onDragEnd={
              index === 0 ? () => setIsTopCardDragging(false) : undefined
            }
            hasSwipedJobs={hasSwipedJobs}
            onRewind={handleRewind}
          />
        ))}
      </div>

      {/* Swipe limit indicator */}
      {swipeLimit && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm z-20 pointer-events-none">
          {swipeLimit.remainingSwipes < 999999 && (
            <span className="font-semibold text-gray-900">
              {swipeLimit.remainingSwipes} swipes left
            </span>
          )}
        </div>
      )}
    </div>
  );
}
