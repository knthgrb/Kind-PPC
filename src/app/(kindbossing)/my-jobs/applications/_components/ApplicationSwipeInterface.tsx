"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Application } from "@/types/application";
import { UserProfile } from "@/types/userProfile";
import { JobPost } from "@/types/jobPosts";
import ApplicantDetailsModal from "./ApplicantDetailsModal";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaUndo,
} from "react-icons/fa";
import SwipeActionModal from "./SwipeActionModal";
import KindTaoProfileCard from "./KindTaoProfileCard";

interface ApplicationSwipeInterfaceProps {
  application: Application;
  kindtaoProfile: UserProfile;
  jobDetails: JobPost | null;
  currentIndex: number;
  totalApplications: number;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onStartMessaging?: () => void;
  onSaveForLater?: () => void;
  forceShowModal?: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextApplication?: Application | null;
  nextKindtaoProfile?: UserProfile | null;
  applicantName?: string;
  nextApplicantName?: string;
}

export default function ApplicationSwipeInterface({
  application,
  kindtaoProfile,
  jobDetails,
  currentIndex,
  totalApplications,
  isProcessing,
  onApprove,
  onReject,
  onNext,
  onPrevious,
  onStartMessaging,
  onSaveForLater,
  forceShowModal,
  canGoNext,
  canGoPrevious,
  nextApplication,
  nextKindtaoProfile,
  applicantName,
  nextApplicantName,
}: ApplicationSwipeInterfaceProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSwipeModal, setShowSwipeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rewindHistory, setRewindHistory] = useState<number[]>([]);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Show modal when forceShowModal prop changes to true
  useEffect(() => {
    if (forceShowModal === true) {
      setShowSwipeModal(true);
    }
  }, [forceShowModal]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating) {
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
    if (!isDragging || isAnimating) {
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

  const handlePointerUp = useCallback(async () => {
    if (!isDragging || isAnimating) {
      return;
    }

    setIsDragging(false);
    setIsAnimating(true);

    // Swipe thresholds
    const SWIPE_THRESHOLD = 80;
    const VELOCITY_THRESHOLD = 0.2;
    const RETURN_THRESHOLD = 70;

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
      // Swipe right = approve the application first, then show modal
      // The modal will show via forceShowModal prop after approval
      animateCardExit("right", () => {
        // Approve the application (this removes it from feed)
        onApprove();
        setOffset({ x: 0, y: 0 });
        setIsAnimating(false);
      });
      return;
    } else if (
      offset.x < -SWIPE_THRESHOLD ||
      (offset.x < -50 && velocity > VELOCITY_THRESHOLD)
    ) {
      // Swipe left = reject
      animateCardExit("left", () => {
        onReject();
      });
      return;
    }

    // If not enough for action but more than return threshold, still allow return to middle
    animateCardReset();
  }, [offset.x, isDragging, isAnimating, onReject]);

  // Rewind function to go back to previous application
  const handleRewind = useCallback(() => {
    if (rewindHistory.length > 0) {
      const previousIndex = rewindHistory[rewindHistory.length - 1];
      setRewindHistory((prev) => prev.slice(0, -1)); // Remove the last item from history
      onPrevious();
    }
  }, [rewindHistory, onPrevious]);

  // Modal handlers - these are called after the application is already approved
  const handleMessage = () => {
    setShowSwipeModal(false);
    // Call parent handler if provided
    if (onStartMessaging) {
      onStartMessaging();
    }
  };

  const handleSaveForLater = () => {
    // Close the modal
    setShowSwipeModal(false);
    // Call parent handler if provided
    if (onSaveForLater) {
      onSaveForLater();
    }
  };

  // Close modal when clicking outside (overlay)
  const handleModalClose = () => {
    setShowSwipeModal(false);
    if (onSaveForLater) {
      onSaveForLater();
    }
  };

  // Reset forceShowModal when modal is closed
  useEffect(() => {
    if (!showSwipeModal && forceShowModal) {
      // Modal was forcefully shown and then closed, reset
    }
  }, [showSwipeModal, forceShowModal]);

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

  // Calculate rotation and overlay effects
  const rotation = offset.x * 0.15;
  const overlayText = offset.x > 80 ? "Like" : offset.x < -80 ? "Pass" : null;
  const overlayOpacity = Math.min(Math.abs(offset.x) / 120, 0.9);

  // Show overlay with gradual color based on swipe direction
  const showOverlay = Math.abs(offset.x) > 20;
  const overlayColor = offset.x > 0 ? "bg-green-500" : "bg-red-500";

  return (
    <>
      {/* Swipe Action Modal */}
      <SwipeActionModal
        isOpen={showSwipeModal || forceShowModal === true}
        onClose={handleModalClose}
        application={application}
        kindtaoProfile={kindtaoProfile}
        jobDetails={jobDetails}
        onMessage={handleMessage}
        onSaveForLater={handleSaveForLater}
        applicantName={applicantName}
      />

      <ApplicantDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        application={application}
        kindtaoProfile={kindtaoProfile}
        jobDetails={jobDetails}
      />

      <div className="w-full max-w-sm md:max-w-md mx-auto h-full overflow-visible flex flex-col items-center justify-center pb-16">
        {/* Swipe Container */}
        <div
          className="relative w-full mx-auto overflow-visible"
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          {/* Preview Card (Blurred) */}
          {nextApplication && nextKindtaoProfile && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 1 }}
            >
              <div
                className="w-full"
                style={{
                  filter: "blur(8px)",
                  transform: "translateX(8px) scale(0.98)",
                  transformOrigin: "center center",
                }}
              >
                <KindTaoProfileCard
                  application={nextApplication}
                  kindtaoProfile={nextKindtaoProfile}
                  jobDetails={jobDetails}
                  isProcessing={false}
                  onSeeFullProfile={() => {}}
                  applicantName={nextApplicantName}
                />
              </div>
            </div>
          )}

          {/* Card */}
          <div
            ref={cardRef}
            className="w-full flex items-center justify-center"
            style={{ zIndex: 2, overflow: "visible" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="w-full transition-transform duration-150"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                transition: isDragging
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease-out",
                transformOrigin: "center center",
              }}
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

              <KindTaoProfileCard
                application={application}
                kindtaoProfile={kindtaoProfile}
                jobDetails={jobDetails}
                isProcessing={isProcessing}
                onSeeFullProfile={() => setShowDetailsModal(true)}
                applicantName={applicantName}
              />
            </div>
          </div>

          {/* Fixed (not transforming) Attached Action Buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 md:-bottom-8 z-20">
            <div className="flex items-center gap-6 md:gap-8">
              {/* Skip */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) onReject();
                }}
                disabled={isDragging}
                className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-colors shadow-xl ${
                  offset.x > 20 ? "invisible" : ""
                } ${
                  offset.x < -20
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
                } disabled:opacity-50`}
                title="Skip this candidate"
              >
                <FaTimes className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              {/* Rewind */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) handleRewind();
                }}
                disabled={isDragging || rewindHistory.length === 0}
                className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-colors shadow-xl ${
                  offset.x > 20 || offset.x < -20 ? "invisible" : ""
                } ${
                  rewindHistory.length > 0
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } disabled:opacity-50`}
                title={
                  rewindHistory.length > 0
                    ? "Rewind to previous candidate"
                    : "No previous candidate to rewind to"
                }
              >
                <FaUndo className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Approve */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) onApprove();
                }}
                className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-colors shadow-xl ${
                  offset.x < -20 ? "invisible" : ""
                } ${
                  offset.x > 20
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-[#CC0000] text-white hover:bg-red-700"
                } disabled:opacity-50`}
                title="Approve and start messaging"
              >
                <FaCheck className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
