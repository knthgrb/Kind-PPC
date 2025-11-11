"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApplicationService } from "@/services/client/ApplicationService";
import { JobPost } from "@/types/jobPosts";

// Enhanced job type based on job_posts table schema
type EnhancedJobPost = JobPost & {
  required_skills?: string[];
  work_schedule?: any;
  required_years_of_experience?: number;
  preferred_languages?: string[];
  is_boosted?: boolean;
  boost_expires_at?: string;
};
import { JobService } from "@/services/client/JobService";
import { SwipeService } from "@/services/client/SwipeService";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  FaPaperPlane,
  FaTimes,
  FaClock,
  FaUser,
  FaEye,
  FaUndo,
} from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import Image from "next/image";
import { salaryFormatter, salaryRateFormatter } from "@/utils/salaryFormatter";
import { getWorkScheduleSummary } from "@/utils/workScheduleFormatter";
import dynamic from "next/dynamic";
import TimeAgo from "react-timeago";
import RadarAnimation from "@/components/common/RadarAnimation";

const SwipeLimitModal = dynamic(
  () => import("@/components/modals/SwipeLimitModal"),
  {
    ssr: false,
  }
);
const JobDetailsModal = dynamic(() => import("./JobDetailsModal"), {
  ssr: false,
});

type MatchingScore = {
  jobId: string;
  score: number;
  reasons: string[];
  breakdown: {
    jobTypeMatch: number;
    locationMatch: number;
    salaryMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    ratingBonus: number;
    recencyBonus: number;
  };
};

type DesktopJobSwipeProps = {
  initialJobs: JobPost[];
  initialMatchingScores?: MatchingScore[];
  pageSize: number;
  initialSwipeLimit?: {
    remainingSwipes: number;
    dailyLimit: number;
    canSwipe: boolean;
  };
  onOpenFilters?: () => void;
  onOpenJobPreferences?: () => void;
};

export default function DesktopJobSwipe({
  initialJobs,
  initialMatchingScores = [],
  pageSize,
  initialSwipeLimit,
  onOpenFilters,
  onOpenJobPreferences,
}: DesktopJobSwipeProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const [matchingScores, setMatchingScores] = useState<MatchingScore[]>(
    initialMatchingScores
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(
    initialJobs.length === 0
  );
  const [hasMore, setHasMore] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const matchingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [swipeLimit, setSwipeLimit] = useState(
    initialSwipeLimit || {
      remainingSwipes: 0,
      dailyLimit: 10,
      canSwipe: false,
    }
  );
  const [showSwipeLimitModal, setShowSwipeLimitModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [rewindHistory, setRewindHistory] = useState<number[]>([]);
  const loadingRef = useRef(false);
  const lastLoadedIndex = useRef(0);

  // Swipe gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [touchUsed, setTouchUsed] = useState(false);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // No intro radar if jobs already present; we only show radar on actual fetches

  // Calculate tilt and rotation based on drag distance
  const getTiltTransform = () => {
    const dragDistance = offset.x;
    const maxTilt = 15; // Maximum tilt angle in degrees
    const maxRotation = 8; // Maximum rotation angle in degrees
    const maxScale = 1.05; // Maximum scale factor

    // Calculate tilt based on drag distance (more drag = more tilt)
    const tiltAngle = Math.min(Math.abs(dragDistance) / 10, maxTilt);
    const rotationAngle = (dragDistance / 200) * maxRotation;
    const scale = 1 + (Math.abs(dragDistance) / 1000) * (maxScale - 1);

    return {
      rotate: `${rotationAngle}deg`,
      scale: scale,
      tilt: `${tiltAngle}deg`,
    };
  };

  // Calculate shadow intensity based on drag distance
  const getShadowStyle = () => {
    const dragDistance = Math.abs(offset.x);
    const maxShadow = 20;
    const shadowIntensity = Math.min(dragDistance / 5, maxShadow);

    return {
      boxShadow: `0 ${shadowIntensity}px ${
        shadowIntensity * 2
      }px rgba(0, 0, 0, ${Math.min(dragDistance / 200, 0.3)})`,
    };
  };

  // Load more jobs function
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !user || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    // Record start time for minimum display duration
    const startTime = Date.now();
    const minDisplayTime = 2000; // 2 seconds minimum

    try {
      console.log(
        "Loading more jobs for user:",
        user.id,
        "offset:",
        jobs.length
      );
      const more = await JobService.fetchMatchedJobsClient(
        user.id,
        pageSize,
        jobs.length
      );
      console.log("Loaded more jobs count:", more.length);

      // Ensure minimum display time has passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (more.length > 0) {
        // Convert matched jobs to regular job format
        const regularJobs = more.map((job: any) => ({
          id: job.id,
          kindbossing_user_id: job.kindbossing_user_id,
          job_title: job.job_title,
          job_description: job.job_description,
          job_type: job.job_type,
          location: job.location,
          salary: job.salary,
          required_skills: job.required_skills,
          work_schedule: job.work_schedule,
          required_years_of_experience: job.required_years_of_experience,
          preferred_languages: job.preferred_languages,
          is_boosted: job.is_boosted,
          boost_expires_at: job.boost_expires_at,
          status: job.status,
          created_at: job.created_at,
          updated_at: job.updated_at,
        }));

        // Convert matching scores to plain objects
        const newMatchingScores = more.map((job: any) => ({
          jobId: job.matchingScore.jobId,
          score: job.matchingScore.score,
          reasons: job.matchingScore.reasons,
          breakdown: {
            jobTypeMatch: job.matchingScore.breakdown.jobTypeMatch,
            locationMatch: job.matchingScore.breakdown.locationMatch,
            salaryMatch: job.matchingScore.breakdown.salaryMatch,
            skillsMatch: job.matchingScore.breakdown.skillsMatch,
            experienceMatch: job.matchingScore.breakdown.experienceMatch,
            availabilityMatch: job.matchingScore.breakdown.availabilityMatch,
            ratingBonus: job.matchingScore.breakdown.ratingBonus,
            recencyBonus: job.matchingScore.breakdown.recencyBonus,
          },
        }));

        setJobs((prev) => [...prev, ...regularJobs]);
        setMatchingScores((prev) => [...prev, ...newMatchingScores]);

        // Reset the last loaded index to allow future loads
        lastLoadedIndex.current = jobs.length + more.length - 1;

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
      loadingRef.current = false;
    }
  }, [loading, hasMore, user, jobs.length, pageSize]);

  // Load more jobs when we're running low
  useEffect(() => {
    // Only load more if we're near the end, have more jobs available, not currently loading, and not on the very last job
    const shouldLoadMore =
      currentIndex >= jobs.length - 3 &&
      hasMore &&
      !loading &&
      !loadingRef.current &&
      currentIndex < jobs.length - 1 &&
      jobs.length > 0 &&
      currentIndex > lastLoadedIndex.current;

    if (shouldLoadMore) {
      lastLoadedIndex.current = currentIndex;
      loadMore();
    }
  }, [currentIndex, jobs.length, hasMore, loading, loadMore]);

  // Prevent infinite loops by ensuring hasMore is set to false when no more jobs
  useEffect(() => {
    if (jobs.length === 0 && !loading && !loadingRef.current) {
      setHasMore(false);
    }
  }, [jobs.length, loading]);

  // Handle initial loading state and timeout
  useEffect(() => {
    if (initialJobs.length > 0) {
      setInitialLoading(false);
      setShowTimeoutMessage(false);
      if (matchingTimeoutRef.current) {
        clearTimeout(matchingTimeoutRef.current);
        matchingTimeoutRef.current = null;
      }
    } else if (initialLoading) {
      // Set timeout to show "no matches" message after 5 seconds
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 5000);
      matchingTimeoutRef.current = timeout;
    }
  }, [initialJobs.length, initialLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (matchingTimeoutRef.current) {
        clearTimeout(matchingTimeoutRef.current);
      }
    };
  }, []);

  // Navigation functions - simple navigation without swipe credits
  const goToNext = useCallback(() => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If we're at the last job, try to load more jobs
      if (hasMore && !loading && !loadingRef.current) {
        loadMore();
      } else {
        // If no more jobs to load, set hasMore to false to trigger "no more jobs" state
        setHasMore(false);
      }
    }
  }, [currentIndex, jobs.length, hasMore, loading, loadMore]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Rewind function to go back to previous job
  const handleRewind = useCallback(() => {
    if (rewindHistory.length > 0) {
      const previousIndex = rewindHistory[rewindHistory.length - 1];
      setRewindHistory((prev) => prev.slice(0, -1)); // Remove the last item from history
      setCurrentIndex(previousIndex);
    }
  }, [rewindHistory]);

  // Action functions
  const handleApply = useCallback(
    async (job: JobPost) => {
      if (isApplying || isSkipping) return;

      // Add current index to rewind history before applying
      setRewindHistory((prev) => [...prev, currentIndex]);

      // Use swipe credit and check if allowed
      const swipeResult = await SwipeService.consumeSwipeCredit(user?.id || "");
      if (!swipeResult.canSwipe) {
        setShowSwipeLimitModal(true);
        return;
      }

      // Update swipe limit display
      setSwipeLimit({
        remainingSwipes: swipeResult.remainingSwipes,
        dailyLimit: swipeResult.dailyLimit,
        canSwipe: swipeResult.canSwipe,
      });

      setIsApplying(true);
      try {
        // Record the swipe action
        await SwipeService.recordSwipeClient(user?.id || "", job.id, "apply");

        // Create job application record
        if (user?.id) {
          await ApplicationService.applyForJob(job.id, user.id);
        }

        // Remove the swiped job from the current jobs array
        setJobs((prev) => {
          const newJobs = prev.filter((j) => j.id !== job.id);
          const removedJobIndex = prev.findIndex((j) => j.id === job.id);

          // Adjust currentIndex based on which job was removed
          if (removedJobIndex < currentIndex) {
            // Removed a job before current - decrement index
            setCurrentIndex(currentIndex - 1);
          } else if (removedJobIndex === currentIndex) {
            // Removed the current job - stay at same index (which now points to next job)
            // No need to change currentIndex
            if (newJobs.length === 0) {
              // If no jobs left, set hasMore to false
              setHasMore(false);
            }
          }

          return newJobs;
        });

        // Only move to next job if we didn't remove the current job
        setTimeout(() => {
          const removedJobIndex = jobs.findIndex((j) => j.id === job.id);
          if (removedJobIndex !== currentIndex) {
            goToNext();
          }
          setIsApplying(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to apply:", error);
        setIsApplying(false);
      }
    },
    [isApplying, isSkipping, goToNext, user, currentIndex]
  );

  const handleSkip = useCallback(
    async (job: JobPost) => {
      if (isApplying || isSkipping) return;

      // Add current index to rewind history before skipping
      setRewindHistory((prev) => [...prev, currentIndex]);

      // Use swipe credit and check if allowed
      const swipeResult = await SwipeService.consumeSwipeCredit(user?.id || "");
      if (!swipeResult.canSwipe) {
        setShowSwipeLimitModal(true);
        return;
      }

      // Update swipe limit display
      setSwipeLimit({
        remainingSwipes: swipeResult.remainingSwipes,
        dailyLimit: swipeResult.dailyLimit,
        canSwipe: swipeResult.canSwipe,
      });

      setIsSkipping(true);
      try {
        // Record the swipe action
        await SwipeService.recordSwipeClient(user?.id || "", job.id, "skip");

        // Remove the swiped job from the current jobs array
        setJobs((prev) => {
          const newJobs = prev.filter((j) => j.id !== job.id);
          const removedJobIndex = prev.findIndex((j) => j.id === job.id);

          // Adjust currentIndex based on which job was removed
          if (removedJobIndex < currentIndex) {
            // Removed a job before current - decrement index
            setCurrentIndex(currentIndex - 1);
          } else if (removedJobIndex === currentIndex) {
            // Removed the current job - stay at same index (which now points to next job)
            // No need to change currentIndex
            if (newJobs.length === 0) {
              // If no jobs left, set hasMore to false
              setHasMore(false);
            }
          }

          return newJobs;
        });

        // Only move to next job if we didn't remove the current job
        setTimeout(() => {
          const removedJobIndex = jobs.findIndex((j) => j.id === job.id);
          if (removedJobIndex !== currentIndex) {
            goToNext();
          }
          setIsSkipping(false);
        }, 500);
      } catch (error) {
        console.error("Failed to skip:", error);
        setIsSkipping(false);
      }
    },
    [isApplying, isSkipping, goToNext, user, currentIndex]
  );

  // Swipe gesture handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isApplying || isSkipping) return;
    e.preventDefault();
    setTouchUsed(false); // Reset flag for mouse interaction
    setIsMouseDown(true);
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - startX;
    setCurrentX(e.clientX);
    setOffset({ x: deltaX, y: 0 });
  };

  const handleMouseUp = useCallback(async () => {
    if (!isDragging || !isMouseDown || isApplying || isSkipping || touchUsed)
      return;

    // Check if this mouse event is too close to a touch event (simulated mouse event)
    const timeSinceLastTouch = Date.now() - lastTouchTime;
    if (timeSinceLastTouch < 500) {
      // This is likely a simulated mouse event from touch, ignore it
      setIsDragging(false);
      setIsMouseDown(false);
      setOffset({ x: 0, y: 0 });
      return;
    }

    setIsDragging(false);
    setIsMouseDown(false);
    const deltaX = currentX - startX;
    const SWIPE_THRESHOLD = 100;

    // Only trigger actions if the drag distance exceeds threshold
    if (deltaX > SWIPE_THRESHOLD) {
      // Swipe right = apply
      if (jobs[currentIndex]) {
        await handleApply(jobs[currentIndex]);
      }
    } else if (deltaX < -SWIPE_THRESHOLD) {
      // Swipe left = skip
      if (jobs[currentIndex]) {
        await handleSkip(jobs[currentIndex]);
      }
    }

    setOffset({ x: 0, y: 0 });
  }, [
    isDragging,
    isMouseDown,
    currentX,
    startX,
    isApplying,
    isSkipping,
    touchUsed,
    lastTouchTime,
    jobs,
    currentIndex,
    handleApply,
    handleSkip,
  ]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isApplying || isSkipping) return;
    e.preventDefault();
    setTouchUsed(true); // Set flag for touch interaction
    setLastTouchTime(Date.now()); // Record touch time
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setOffset({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.touches[0].clientX - startX;
    setCurrentX(e.touches[0].clientX);
    setOffset({ x: deltaX, y: 0 });
  };

  // Global mouse up handler to catch mouse releases outside the card
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown && isDragging) {
        handleMouseUp();
      }
    };

    if (isMouseDown) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isMouseDown, isDragging, handleMouseUp]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (jobs[currentIndex]) {
          handleApply(jobs[currentIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (jobs[currentIndex]) {
          handleSkip(jobs[currentIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPrevious, goToNext, handleApply, handleSkip, jobs, currentIndex]);

  // Show initial loading state
  if (initialLoading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          {showTimeoutMessage ? (
            <div className="max-w-md mx-auto px-4">
              <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-16 h-16 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No jobs match your preferences
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We couldn't find any job matches based on your current
                preferences. Try adjusting your job preferences or check back
                later for new postings.
              </p>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={async () => {
                      // Reset state and reload jobs
                      setCurrentIndex(0);
                      setJobs([]);
                      setMatchingScores([]);
                      setHasMore(true);
                      setLoading(true);
                      setRewindHistory([]);
                      setInitialLoading(true);
                      setShowTimeoutMessage(false);
                      try {
                        const newJobs = await JobService.fetchMatchedJobsClient(
                          user?.id || "",
                          pageSize,
                          0
                        );
                        console.log("Refreshed jobs count:", newJobs.length);
                        setJobs(newJobs);
                        if (newJobs.length < pageSize) {
                          setHasMore(false);
                        }
                      } catch (error) {
                        console.error("Error refreshing jobs:", error);
                      } finally {
                        setLoading(false);
                        setInitialLoading(false);
                      }
                    }}
                    className="cursor-pointer px-6 py-3 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      // Open job preferences modal
                      onOpenJobPreferences?.();
                    }}
                    className="px-6 cursor-pointer py-3 bg-white text-[#CC0000] border border-[#CC0000] rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Job Preferences
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <RadarAnimation
                isVisible={true}
                userProfileImage={
                  user?.user_metadata?.profile_image_url || undefined
                }
                className="mb-4"
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // Show loading state when no jobs and loading
  if (jobs.length === 0 && loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <RadarAnimation
            isVisible={true}
            userProfileImage={
              user?.user_metadata?.profile_image_url || undefined
            }
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  // Show no more jobs state - consolidated empty state
  if (jobs.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-16 h-16 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            No jobs match your preferences
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We couldn't find any job matches based on your current preferences.
            Try adjusting your job preferences or check back later for new
            postings.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={async () => {
                // Reset state and reload jobs
                setCurrentIndex(0);
                setJobs([]);
                setMatchingScores([]);
                setHasMore(true);
                setLoading(true);
                setRewindHistory([]);
                setInitialLoading(true);
                setShowTimeoutMessage(false);
                try {
                  const newJobs = await JobService.fetchMatchedJobsClient(
                    user?.id || "",
                    pageSize,
                    0
                  );
                  console.log("Refreshed jobs count:", newJobs.length);
                  setJobs(newJobs);
                  if (newJobs.length < pageSize) {
                    setHasMore(false);
                  }
                } catch (error) {
                  console.error("Error refreshing jobs:", error);
                } finally {
                  setLoading(false);
                  setInitialLoading(false);
                }
              }}
              className="flex-1 cursor-pointer px-6 py-3 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Refresh
            </button>

            <button
              onClick={() => {
                // Open job preferences modal
                onOpenJobPreferences?.();
              }}
              className="flex-1 cursor-pointer px-6 py-3 bg-white text-[#CC0000] border border-[#CC0000] rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Job Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check to ensure we have a valid job
  if (jobs.length === 0 || currentIndex >= jobs.length) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No more jobs available
          </h3>
          <p className="text-gray-600 mb-4">
            You've seen all available jobs! Check back later for new
            opportunities.
          </p>
          <button
            onClick={async () => {
              // Reset state and reload jobs
              setCurrentIndex(0);
              setJobs([]);
              setMatchingScores([]);
              setHasMore(true);
              setLoading(true);
              setRewindHistory([]);
              try {
                const newJobs = await JobService.fetchMatchedJobsClient(
                  user?.id || "",
                  pageSize,
                  0
                );
                console.log("Refreshed jobs count:", newJobs.length); // Debug log
                setJobs(newJobs);
                if (newJobs.length < pageSize) {
                  setHasMore(false);
                }
              } catch (error) {
                console.error("Error refreshing jobs:", error);
              } finally {
                setLoading(false);
              }
            }}
            className="px-6 py-2 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Jobs
          </button>
        </div>
      </div>
    );
  }

  const currentJob = jobs[currentIndex];
  const currentMatchingScore = matchingScores.find(
    (score) => score.jobId === currentJob?.id
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Swipe Container */}
      <div className="relative w-full h-full flex flex-col">
        {/* Job Card */}
        <div className="relative flex-1 flex items-center justify-center p-1 md:p-2 pb-20 md:pb-2">
          {/* Next Job Preview Card - Only visible when swiping */}
          {isDragging && currentIndex < jobs.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center p-2 z-0">
              <div className="bg-white rounded-xl border border-[#E0E6F7] shadow-md overflow-hidden select-none relative w-full max-w-lg h-full max-h-[600px] flex flex-col mx-auto blur-sm">
                {/* Next Job Header */}
                <div className="p-6 border-b border-gray-100 shrink-0">
                  <div className="flex items-start gap-4">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Job Title and Salary Row */}
                      <div className="flex items-start justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">
                          {jobs[currentIndex + 1]?.job_title || "Next Job"}
                        </h2>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-[#CC0000] leading-none">
                            ₱{jobs[currentIndex + 1]?.salary || "0"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {jobs[currentIndex + 1]?.salary_type}
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-gray-600 mb-3">
                        <SlLocationPin className="text-[#A0ABB8] text-sm mr-2 shrink-0" />
                        <span className="text-sm font-medium">
                          {jobs[currentIndex + 1]?.location || "Location"}
                        </span>
                      </div>

                      {/* Job Type and Posted Date */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaUser className="w-3 h-3" />
                          <span className="capitalize">
                            {jobs[currentIndex + 1]?.job_type?.replace(
                              "_",
                              " "
                            ) || "Job Type"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          <span>Posted 2 days ago</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Job Details */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  {/* Job Description Preview */}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Job Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed line-clamp-2 text-sm">
                      {jobs[currentIndex + 1]?.job_description ||
                        "No description provided."}
                    </p>
                  </div>

                  {/* Key Requirements Preview */}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Key Requirements
                    </h3>
                    <ul className="space-y-1.5 text-gray-700">
                      <li className="flex items-start text-sm">
                        <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-2 mr-3 shrink-0"></span>
                        <span>
                          Experience in{" "}
                          {jobs[currentIndex + 1]?.job_type?.replace(
                            "_",
                            " "
                          ) || "job type"}{" "}
                          preferred
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Work Schedule Preview */}
                  {(jobs[currentIndex + 1] as EnhancedJobPost)
                    ?.work_schedule && (
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        Work Schedule
                      </h3>
                      <p className="text-gray-700 text-sm">
                        {getWorkScheduleSummary(
                          (jobs[currentIndex + 1] as EnhancedJobPost)
                            .work_schedule
                        )}
                      </p>
                    </div>
                  )}

                  {/* See More Button */}
                  <div className="mt-6">
                    <button className="w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-gray-200">
                      <FaEye className="w-4 h-4" />
                      See Full Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Removed swipe indicators and loading overlay for a simpler swipe experience */}

          {/* Compact Job Card */}
          <div
            ref={cardRef}
            className="bg-white rounded-xl border border-[#E0E6F7] shadow-lg overflow-hidden cursor-grab active:cursor-grabbing select-none relative w-full max-w-sm md:max-w-lg h-full max-h-[500px] md:max-h-[600px] flex flex-col mx-auto z-10"
            style={{
              transform: `translateX(${offset.x}px) rotate(${
                getTiltTransform().rotate
              }) scale(${getTiltTransform().scale})`,
              transition: isDragging
                ? "none"
                : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease-out",
              transformOrigin: "center center",
              ...getShadowStyle(),
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/* Swipe Direction Border Indicators */}
            {isDragging && Math.abs(offset.x) > 20 && (
              <>
                {/* LIKE border indicator (swipe right) */}
                {offset.x > 0 && (
                  <div
                    className="absolute inset-0 border-4 border-green-500 rounded-xl pointer-events-none"
                    style={{
                      opacity: Math.min(Math.abs(offset.x) / 100, 1),
                    }}
                  />
                )}

                {/* PASS border indicator (swipe left) */}
                {offset.x < 0 && (
                  <div
                    className="absolute inset-0 border-4 border-red-500 rounded-xl pointer-events-none"
                    style={{
                      opacity: Math.min(Math.abs(offset.x) / 100, 1),
                    }}
                  />
                )}
              </>
            )}

            {/* Header with Profile */}
            <div className="p-4 md:p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-start gap-3 md:gap-4">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Job Title and Salary Row */}
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                      {currentJob?.job_title}
                    </h2>
                    <div className="text-right ml-3 md:ml-4">
                      <div className="text-xl md:text-2xl font-bold text-[#CC0000] leading-none">
                        ₱{currentJob?.salary}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentJob?.salary_type}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <SlLocationPin className="text-[#A0ABB8] text-sm mr-2 shrink-0" />
                    <span className="text-sm font-medium">
                      {currentJob?.location}
                    </span>
                  </div>

                  {/* Job Type and Posted Date */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaUser className="w-3 h-3" />
                      <span className="capitalize">
                        {currentJob?.job_type?.replace("_", " ") || "N/A"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                    </span>
                    <TimeAgo date={currentJob?.created_at} live={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0">
              {/* Job Description Preview */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Job Description
                </h3>
                <p className="text-gray-700 leading-relaxed text-xs md:text-sm">
                  {currentJob?.job_description
                    ? currentJob?.job_description.length > 100
                      ? `${currentJob?.job_description.substring(0, 100)}...`
                      : currentJob?.job_description
                    : "No description provided."}
                </p>
              </div>

              {/* Key Requirements Preview */}
              <div className="mb-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                  Key Requirements
                </h3>
                <ul className="space-y-1 text-gray-700">
                  {(currentJob as EnhancedJobPost)?.required_skills &&
                  (currentJob as EnhancedJobPost)?.required_skills!.length >
                    0 ? (
                    (currentJob as EnhancedJobPost)
                      ?.required_skills!.slice(0, 3)
                      .map((skill, index) => (
                        <li
                          key={index}
                          className="flex items-start text-xs md:text-sm"
                        >
                          <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 md:mt-2 mr-2 md:mr-3 shrink-0"></span>
                          <span className="capitalize">
                            {skill.replace("_", " ")}
                          </span>
                        </li>
                      ))
                  ) : (
                    <>
                      <li className="flex items-start text-xs md:text-sm">
                        <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 md:mt-2 mr-2 md:mr-3 shrink-0"></span>
                        <span>
                          Experience in{" "}
                          {currentJob.job_type?.replace("_", " ") ||
                            "this field"}{" "}
                          preferred
                        </span>
                      </li>
                    </>
                  )}
                  {(currentJob as EnhancedJobPost)
                    .required_years_of_experience !== 0 && (
                    <li className="flex items-start text-xs md:text-sm">
                      <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 md:mt-2 mr-2 md:mr-3 shrink-0"></span>
                      <span>
                        {
                          (currentJob as EnhancedJobPost)
                            .required_years_of_experience
                        }{" "}
                        years of experience required
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Work Schedule */}
              {(currentJob as EnhancedJobPost).work_schedule && (
                <div className="mb-4">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                    Work Schedule
                  </h3>
                  <p className="text-gray-700 text-xs md:text-sm">
                    {getWorkScheduleSummary(
                      (currentJob as EnhancedJobPost).work_schedule
                    )}
                  </p>
                </div>
              )}

              {/* Spacer to push button to bottom */}
              <div className="flex-1 min-h-0"></div>

              {/* See Full Details Button - Always visible at bottom */}
              <div className="mt-4 md:mt-6 shrink-0">
                <button
                  onClick={() => setShowJobDetailsModal(true)}
                  className="w-full cursor-pointer py-2 md:py-3 px-3 md:px-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-xs md:text-sm font-medium border border-gray-200"
                >
                  <FaEye className="w-3 h-3 md:w-4 md:h-4" />
                  See Full Details
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed position, don't move with card */}
          <div className="absolute bottom-20 md:bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-4 md:gap-8 w-64 md:w-80 justify-between">
              {/* Skip Button - Always visible, changes color when swiping left */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) {
                    handleSkip(currentJob);
                  }
                }}
                disabled={isApplying || isSkipping || isDragging}
                className={`flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full transition-colors shadow-xl ${
                  offset.x > 20 ? "invisible" : ""
                } ${
                  offset.x < -20
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
                } disabled:opacity-50`}
                title="Skip this job"
              >
                <FaTimes className="w-5 h-5 md:w-7 md:h-7" />
              </button>

              {/* Rewind Button - Always visible, disabled when no history */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) {
                    handleRewind();
                  }
                }}
                disabled={
                  isApplying ||
                  isSkipping ||
                  rewindHistory.length === 0 ||
                  isDragging
                }
                className={`flex cursor-pointer items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full transition-colors shadow-xl ${
                  offset.x > 20 || offset.x < -20 ? "invisible" : ""
                } ${
                  rewindHistory.length > 0
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } disabled:opacity-50`}
                title={
                  rewindHistory.length > 0
                    ? "Rewind to previous job"
                    : "No previous job to rewind to"
                }
              >
                <FaUndo className="w-4 h-4 md:w-6 md:h-6" />
              </button>

              {/* Apply Button - Always visible, changes color when swiping right */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) {
                    handleApply(currentJob);
                  }
                }}
                className={`flex items-center cursor-pointer justify-center w-12 h-12 md:w-16 md:h-16 rounded-full transition-colors shadow-xl ${
                  offset.x < -20 ? "invisible" : ""
                } ${
                  offset.x > 20
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-[#CC0000] text-white hover:bg-red-700"
                } disabled:opacity-50`}
                title="Apply for this job"
              >
                <FaPaperPlane className="w-5 h-5 md:w-7 md:h-7" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000]"></div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        isOpen={showJobDetailsModal}
        onClose={() => setShowJobDetailsModal(false)}
        job={currentJob}
        matchingScore={currentMatchingScore}
        onApply={handleApply}
        onSkip={handleSkip}
        isApplying={isApplying}
      />

      {/* Swipe Limit Modal */}
      <SwipeLimitModal
        isOpen={showSwipeLimitModal}
        onClose={() => setShowSwipeLimitModal(false)}
        remainingSwipes={swipeLimit.remainingSwipes}
        dailyLimit={swipeLimit.dailyLimit}
        userRole="kindtao"
        onUpgrade={() => {
          // TODO: Implement upgrade functionality
          console.log("Upgrade clicked");
        }}
      />
    </div>
  );
}
