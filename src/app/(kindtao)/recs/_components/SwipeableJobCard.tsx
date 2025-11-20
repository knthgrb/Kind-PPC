"use client";

import { useState, useRef, useEffect } from "react";
import { MatchedJob } from "@/services/JobMatchingService";
import { FiX, FiHeart, FiRotateCw } from "react-icons/fi";
import type { SwipeAction } from "./JobsCarousel";
import { getJobCardStyle } from "@/utils/jobCardStyles";
import { formatJobType } from "@/utils/jobTypeFormatter";
import dynamic from "next/dynamic";
const JobDetailsModal = dynamic(() => import("./JobDetailsModal"), {
  ssr: false,
});
type SwipeDirection = "left" | "right" | null;

interface SwipeableJobCardProps {
  job: MatchedJob;
  onSwipe: (jobId: string, action: SwipeAction) => void;
  index: number;
  totalCards: number;
  isTopCardDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  hasSwipedJobs?: boolean;
  onRewind?: () => void;
}

export default function SwipeableJobCard({
  job,
  onSwipe,
  index,
  totalCards,
  isTopCardDragging = false,
  onDragStart,
  onDragEnd,
  hasSwipedJobs = false,
  onRewind,
}: SwipeableJobCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [showActions, setShowActions] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100; // Minimum distance to trigger swipe
  const ROTATION_FACTOR = 0.1; // Rotation per pixel

  useEffect(() => {
    // Reset state when job changes
    setSwipeDirection(null);
    setSwipeOffset(0);
    setIsDragging(false);
    setShowActions(true);
  }, [job.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showActions) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    onDragStart?.();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !showActions) return;
    const newX = e.touches[0].clientX;
    setCurrentX(newX);
    const offset = newX - startX;
    setSwipeOffset(offset);

    if (offset > 0) {
      setSwipeDirection("right");
    } else if (offset < 0) {
      setSwipeDirection("left");
    } else {
      setSwipeDirection(null);
    }
  };

  const finalizeSwipe = () => {
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      handleSwipe(swipeOffset > 0 ? "like" : "skip");
    } else {
      setSwipeOffset(0);
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !showActions) return;
    setIsDragging(false);
    onDragEnd?.();
    finalizeSwipe();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showActions) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    onDragStart?.();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !showActions) return;
    const newX = e.clientX;
    setCurrentX(newX);
    const offset = newX - startX;
    setSwipeOffset(offset);

    if (offset > 0) {
      setSwipeDirection("right");
    } else if (offset < 0) {
      setSwipeDirection("left");
    } else {
      setSwipeDirection(null);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !showActions) return;
    setIsDragging(false);
    onDragEnd?.();

    finalizeSwipe();
  };

  const handleSwipe = (action: SwipeAction) => {
    setShowActions(false);
    // Animate card out
    const finalOffset = action === "like" ? 1000 : -1000;
    setSwipeOffset(finalOffset);
    setSwipeDirection(action === "like" ? "right" : "left");

    // Call onSwipe after animation
    setTimeout(() => {
      onSwipe(job.id, action);
    }, 300);
  };

  const handleButtonClick = (action: SwipeAction) => {
    handleSwipe(action);
  };

  // Track swipe direction helpers
  const isSwipeLeft = swipeDirection === "left";
  const isSwipeRight = swipeDirection === "right";

  // Calculate rotation based on swipe offset
  const rotation = swipeOffset * ROTATION_FACTOR;
  const opacity = 1 - Math.abs(swipeOffset) / 500;

  // Determine which action buttons to show
  const showLikeButtons = isSwipeRight || swipeDirection === null;
  const showSkipButtons = isSwipeLeft || swipeDirection === null;

  // Card is visible if it's the top card (index 0) or next card (index 1) for blur effect
  const isVisible = index === 0;
  const isNextCard = index === 1;

  // Calculate scale and blur for next card when dragging
  const nextCardScale =
    isNextCard && isTopCardDragging ? 0.95 : isNextCard ? 0.9 : 1;
  const nextCardBlur =
    isNextCard && isTopCardDragging
      ? "blur-sm"
      : isNextCard
        ? "blur-[2px]"
        : "";

  // Get job-specific style (color gradient and icon)
  const jobStyle = getJobCardStyle(job.job_title);

  if (!isVisible && !isNextCard) {
    return null;
  }

  return (
    <>
      <div
        ref={cardRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          zIndex: totalCards - index,
          opacity: isVisible ? opacity : isNextCard ? 1 : 0,
          pointerEvents: isVisible ? "auto" : "none",
        }}
        onTouchStart={isVisible ? handleTouchStart : undefined}
        onTouchMove={isVisible ? handleTouchMove : undefined}
        onTouchEnd={isVisible ? handleTouchEnd : undefined}
        onMouseDown={isVisible ? handleMouseDown : undefined}
        onMouseMove={isVisible ? handleMouseMove : undefined}
        onMouseUp={isVisible ? handleMouseUp : undefined}
        onMouseLeave={isVisible ? handleMouseUp : undefined}
      >
        <div
          className={`w-full max-w-md h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden relative transition-all duration-200 select-none ${
            isVisible ? "cursor-grab active:cursor-grabbing" : ""
          } ${nextCardBlur}`}
          style={{
            transform: isVisible
              ? `translateX(${swipeOffset}px) rotate(${rotation}deg)`
              : `scale(${nextCardScale}) translateY(${(index - 1) * 10}px)`,
            transition:
              isDragging && isVisible ? "none" : "transform 0.3s ease-out",
          }}
        >
          {/* Job Image/Header - Reduced size with job-specific styling */}
          <div
            className={`relative h-1/3 bg-linear-to-br ${jobStyle.gradientFrom} ${jobStyle.gradientTo}`}
          >
            {/* Job-specific icon - behind everything */}
            <div className="absolute inset-0 flex items-center justify-center text-white text-6xl z-0 opacity-30">
              {jobStyle.icon}
            </div>

            {/* Swipe indicators - just text, no container */}
            {swipeDirection === "right" && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-6xl text-green-600 font-bold transform rotate-12 drop-shadow-lg">
                  APPLY
                </div>
              </div>
            )}
            {swipeDirection === "left" && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-6xl text-red-600 font-bold transform -rotate-12 drop-shadow-lg">
                  SKIP
                </div>
              </div>
            )}

            {/* Job Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-6 text-white z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm bg-green-500 px-2 py-1 rounded-full">
                  • Recently Active
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-1">{job.job_title}</h2>
              <p className="text-lg opacity-90">{job.location}</p>
              {job.matchScore && (
                <p className="text-sm opacity-75 mt-1">
                  {Math.round(job.matchScore)}% Match
                </p>
              )}
            </div>
          </div>

          {/* Job Details - Prioritized important info, no scrolling needed */}
          <div className="p-6 h-2/3 flex flex-col">
            <div className="space-y-4 flex-1">
              {/* Salary and Type - Most important, shown first */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-800 font-semibold">Salary:</span>{" "}
                  <span className="text-[#CC0000] text-lg font-medium">
                    {job.salary || "Not specified"}
                  </span>
                </div>
                {job.job_type && (
                  <div>
                    <span className="text-gray-500">Type:</span>{" "}
                    <span className="font-semibold text-gray-900">
                      {formatJobType(job.job_type)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description - Truncated */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Description
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {job.job_description || "No description available"}
                </p>
              </div>

              {/* Skills - Limited to 3 visible */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Skills Required
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        +{job.required_skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Show More Details Button */}
              <button
                onClick={() => setIsDetailsModalOpen(true)}
                className="w-full cursor-pointer mt-auto py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Show More Details
              </button>
            </div>
          </div>

          {/* Action Buttons - Only show when not swiped or show appropriate buttons */}
          {showActions && (
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-6">
              {/* Skip/Nope Button - Only show when swiped left or not swiped */}
              {showSkipButtons && (
                <button
                  onClick={() => handleButtonClick("skip")}
                  className={`p-4 rounded-full shadow-lg transition-all ${
                    isSwipeLeft
                      ? "bg-red-500 text-white scale-110"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  disabled={isSwipeRight}
                >
                  <FiX className="w-6 h-6" />
                </button>
              )}

              {/* Rewind Button - Only show when not swiped and user has swiped jobs */}
              {swipeDirection === null && (
                <button
                  onClick={onRewind}
                  disabled={!hasSwipedJobs}
                  className={`p-4 rounded-full shadow-lg transition-all ${
                    hasSwipedJobs
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-gray-300 text-gray-400 cursor-not-allowed"
                  }`}
                  title={
                    hasSwipedJobs ? "Rewind last swipe" : "No swipes to rewind"
                  }
                >
                  <FiRotateCw className="w-6 h-6" />
                </button>
              )}

              {/* Like Button - Only show when swiped right or not swiped */}
              {showLikeButtons && (
                <button
                  onClick={() => handleButtonClick("like")}
                  className={`p-4 rounded-full shadow-lg transition-all ${
                    isSwipeRight
                      ? "bg-green-500 text-white scale-110"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  disabled={isSwipeLeft}
                >
                  <FiHeart className="w-6 h-6" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={job}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
}
