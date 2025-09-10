"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JobPost } from "@/types/jobPosts";
import { JobService } from "@/services/JobService";
import { useAuth } from "@/hooks/useAuth";
import { FaChevronLeft, FaChevronRight, FaHeart, FaTimes, FaMapMarkerAlt, FaClock, FaUser, FaDollarSign } from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import Image from "next/image";
import { salaryFormatter, salaryRateFormatter } from "@/utils/salaryFormatter";

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
  onApply?: (job: JobPost) => void;
  onSkip?: (job: JobPost) => void;
};

export default function DesktopJobSwipe({
  initialJobs,
  initialMatchingScores = [],
  pageSize,
  onApply,
  onSkip,
}: DesktopJobSwipeProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const [matchingScores, setMatchingScores] = useState<MatchingScore[]>(initialMatchingScores);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadedIndex = useRef(0);

  // Load more jobs when we're running low
  useEffect(() => {
    // Only load more if we're near the end, have more jobs available, not currently loading, and not on the very last job
    const shouldLoadMore = currentIndex >= jobs.length - 3 && 
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
  }, [currentIndex, jobs.length, hasMore, loading]);

  // Prevent infinite loops by ensuring hasMore is set to false when no more jobs
  useEffect(() => {
    if (jobs.length === 0 && !loading && !loadingRef.current) {
      setHasMore(false);
    }
  }, [jobs.length, loading]);

  // Load more jobs function
  const loadMore = async () => {
    if (loading || !hasMore || !user || loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    try {
      const more = await JobService.fetchMatchedJobsClient(
        user.id,
        pageSize,
        jobs.length
      );
      if (more.length > 0) {
        // Convert matched jobs to regular job format
        const regularJobs = more.map(job => ({
          id: job.id,
          family_id: job.family_id,
          title: job.title,
          description: job.description,
          job_type: job.job_type,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_rate: job.salary_rate,
          created_at: job.created_at,
          updated_at: job.updated_at,
        }));
        
        // Convert matching scores to plain objects
        const newMatchingScores = more.map(job => ({
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
          }
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
  };

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, jobs.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Action functions
  const handleApply = useCallback(async (job: JobPost) => {
    if (isApplying || isSkipping) return;
    
    setIsApplying(true);
    try {
      onApply?.(job);
      // Navigate to apply page
      router.push(`/apply?jobId=${job.id}`);
      // Move to next job after a short delay
      setTimeout(() => {
        goToNext();
        setIsApplying(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to apply:", error);
      setIsApplying(false);
    }
  }, [isApplying, isSkipping, onApply, router, goToNext]);

  const handleSkip = useCallback(async (job: JobPost) => {
    if (isApplying || isSkipping) return;
    
    setIsSkipping(true);
    try {
      onSkip?.(job);
      // Move to next job after a short delay
      setTimeout(() => {
        goToNext();
        setIsSkipping(false);
      }, 500);
    } catch (error) {
      console.error("Failed to skip:", error);
      setIsSkipping(false);
    }
  }, [isApplying, isSkipping, onSkip, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (jobs[currentIndex]) {
          handleApply(jobs[currentIndex]);
        }
      } else if (e.key === "Escape") {
        if (jobs[currentIndex]) {
          handleSkip(jobs[currentIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPrevious, goToNext, handleApply, handleSkip, jobs, currentIndex]);

  // Show loading state when no jobs and loading
  if (jobs.length === 0 && loading) {
    return (
      <div className="relative w-full max-w-4xl h-[700px] mx-auto flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC0000]"></div>
      </div>
    );
  }

  // Show no more jobs state
  if (jobs.length === 0) {
    return (
      <div className="relative w-full max-w-4xl h-[700px] mx-auto flex items-center justify-center">
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
            No jobs found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or clear all filters.
          </p>
          <button
            onClick={() =>
              setFilters({
                tags: [],
                location: "All",
                jobType: "All",
                payType: "All",
                keyword: "",
              })
            }
            className="px-4 py-2 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  const currentJob = jobs[currentIndex];
  const currentMatchingScore = matchingScores.find(score => score.jobId === currentJob?.id);

  return (
    <div className="w-full">
      {/* Main Swipe Container */}
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Job Counter */}
        <div className="text-center mb-6">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} of {jobs.length} jobs
          </span>
        </div>

        {/* Job Card */}
        <div className="relative">
          {/* Loading Overlay */}
          {(isApplying || isSkipping) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl z-10">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mb-3"></div>
                <p className="text-lg font-semibold text-gray-800">
                  {isApplying ? "Applying..." : "Skipping..."}
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Job Card */}
          <div className="bg-white rounded-2xl border border-[#E0E6F7] shadow-lg overflow-hidden">
            {/* Header with Profile */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Image
                    src="/people/darrellSteward.png"
                    alt={currentJob.id}
                    width={80}
                    height={80}
                    className="object-cover rounded-xl"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentJob.title}
                  </h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <SlLocationPin className="text-[#A0ABB8] text-lg mr-2" />
                    <span className="text-lg">{currentJob.location}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FaUser className="mr-1" />
                      {currentJob.job_type}
                    </span>
                    <span className="flex items-center">
                      <FaClock className="mr-1" />
                      Posted 2 days ago
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#CC0000] mb-1">
                    ₱{salaryFormatter(currentJob.salary_max)}
                  </div>
                  <div className="text-lg text-gray-600">
                    {salaryRateFormatter(currentJob.salary_rate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Matching Score Display */}
            {currentMatchingScore && (
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentMatchingScore.score >= 80 
                        ? 'text-green-600 bg-green-100' 
                        : currentMatchingScore.score >= 60 
                        ? 'text-yellow-600 bg-yellow-100'
                        : currentMatchingScore.score >= 40
                        ? 'text-orange-600 bg-orange-100'
                        : 'text-red-600 bg-red-100'
                    }`}>
                      {currentMatchingScore.score}% Match
                    </div>
                    <span className="text-sm text-gray-600">
                      {currentMatchingScore.score >= 80 
                        ? 'Excellent Match' 
                        : currentMatchingScore.score >= 60 
                        ? 'Good Match'
                        : currentMatchingScore.score >= 40
                        ? 'Fair Match'
                        : 'Poor Match'
                      }
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Job {currentIndex + 1} of {jobs.length}
                  </div>
                </div>
                
                {/* Matching Reasons */}
                {currentMatchingScore.reasons.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Why this job matches you:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentMatchingScore.reasons.slice(0, 3).map((reason, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full border border-gray-200"
                        >
                          {reason}
                        </span>
                      ))}
                      {currentMatchingScore.reasons.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{currentMatchingScore.reasons.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Job Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {currentJob.description || "No description provided."}
                  </p>
                </div>

                {/* Job Requirements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Experience in {currentJob.job_type} preferred
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Reliable and punctual
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Good communication skills
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Valid ID required
                    </li>
                  </ul>
                </div>
              </div>

              {/* Salary Range */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Salary Range</h4>
                    <p className="text-gray-600">
                      ₱{salaryFormatter(currentJob.salary_min)} - ₱{salaryFormatter(currentJob.salary_max)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#CC0000]">
                      ₱{salaryFormatter(currentJob.salary_max)}
                    </span>
                    <p className="text-sm text-gray-600">
                      {salaryRateFormatter(currentJob.salary_rate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleSkip(currentJob)}
                  disabled={isApplying || isSkipping}
                  className="flex items-center justify-center w-16 h-16 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  <FaTimes className="w-6 h-6" />
                </button>

                <div className="flex space-x-4">
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0 || isApplying || isSkipping}
                    className="flex items-center justify-center w-12 h-12 bg-white text-gray-600 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <FaChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goToNext}
                    disabled={currentIndex >= jobs.length - 1 || isApplying || isSkipping}
                    className="flex items-center justify-center w-12 h-12 bg-white text-gray-600 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <FaChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => handleApply(currentJob)}
                  disabled={isApplying || isSkipping}
                  className="flex items-center justify-center w-16 h-16 bg-[#CC0000] text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <FaHeart className="w-6 h-6" />
                </button>
              </div>

              {/* Keyboard Shortcuts Help */}
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>Use arrow keys to navigate • Enter to apply • Escape to skip</p>
              </div>
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
    </div>
  );
}
