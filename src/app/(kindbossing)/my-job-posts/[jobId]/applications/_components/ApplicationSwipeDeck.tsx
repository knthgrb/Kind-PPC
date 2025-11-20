"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiX, FiRotateCw } from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa";
import ApplicationDetailsModal from "./ApplicationDetailsModal";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import {
  KindTaoExperience,
  PendingApplication,
  getApplicantDisplayName,
} from "./applicationTypes";

type ApplicationSwipeDeckProps = {
  applications: PendingApplication[];
  jobId: string;
  jobTitle?: string;
  kindbossingUserId?: string | null;
  onApplicationApproved?: (applicationId: string) => void;
};

const SWIPE_THRESHOLD = 120;
const ROTATION_FACTOR = 0.08;

type ApplicationQueueItem =
  | {
      kind: "skip";
      applicationId: string;
      application: PendingApplication;
    }
  | {
      kind: "approve";
      applicationId: string;
      application: PendingApplication;
      applicantId: string;
      jobId: string;
      kindbossingUserId: string;
      navigateToMessaging: boolean;
      jobTitle?: string;
      onApproved?: () => void;
    };

const getLocationLabel = (application?: PendingApplication) => {
  return (
    application?.location ||
    application?.kindtao?.current_location ||
    application?.user?.location ||
    "Location not provided"
  );
};

const formatAppliedDate = (appliedAt?: number) => {
  if (!appliedAt) return "Recently";
  try {
    return new Date(appliedAt).toLocaleDateString();
  } catch {
    return "Recently";
  }
};

const normalizeSkillName = (skill: string): string => {
  return skill
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function ApplicationSwipeDeck({
  applications,
  jobId,
  jobTitle,
  kindbossingUserId,
  onApplicationApproved,
}: ApplicationSwipeDeckProps) {
  const router = useRouter();
  const { showError } = useToastActions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<PendingApplication | null>(null);
  const applicationQueueRef = useRef<ApplicationQueueItem[]>([]);
  const isProcessingQueueRef = useRef(false);
  const [caughtUpTimestamp, setCaughtUpTimestamp] = useState<number | null>(
    null
  );

  const processApplicationQueue = useCallback(async () => {
    if (
      isProcessingQueueRef.current ||
      applicationQueueRef.current.length === 0
    ) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      let skipApplicationActionFn:
        | (typeof import("@/actions/applications/skip-application"))["skipApplicationAction"]
        | null = null;
      let approveApplicationActionFn:
        | (typeof import("@/actions/applications/approve-application"))["approveApplicationAction"]
        | null = null;

      while (applicationQueueRef.current.length > 0) {
        const [currentItem] = applicationQueueRef.current;

        try {
          if (currentItem.kind === "skip") {
            if (!skipApplicationActionFn) {
              ({ skipApplicationAction: skipApplicationActionFn } =
                await import("@/actions/applications/skip-application"));
            }

            const result = await skipApplicationActionFn({
              applicationId: currentItem.applicationId,
            });

            if (!result?.success) {
              throw new Error(result?.error || "Failed to skip application");
            }
          } else {
            if (!approveApplicationActionFn) {
              ({ approveApplicationAction: approveApplicationActionFn } =
                await import("@/actions/applications/approve-application"));
            }

            const result = await approveApplicationActionFn({
              applicationId: currentItem.applicationId,
              jobId: currentItem.jobId,
              applicantId: currentItem.applicantId,
              kindbossingUserId: currentItem.kindbossingUserId,
            });

            if (!result?.success) {
              throw new Error(result?.error || "Failed to approve application");
            }

            currentItem.onApproved?.();

            if (currentItem.navigateToMessaging) {
              const params = new URLSearchParams({
                kindtaoUserId: currentItem.applicantId,
                jobId: currentItem.jobId,
                jobTitle: currentItem.jobTitle || "",
                applicationId: currentItem.applicationId,
                applicantName: getApplicantDisplayName(currentItem.application),
              });

              if (result.matchId) {
                params.set("matchId", result.matchId);
              }

              const email = currentItem.application.user?.email;
              if (email) {
                params.set("applicantEmail", email);
              }

              const phone = currentItem.application.user?.phone;
              if (phone) {
                params.set("applicantPhone", phone);
              }

              router.push(`/kindbossing/messages?${params.toString()}`);
            }
          }
        } catch (error) {
          logger.error("Application queue item failed:", error);
          showError(
            currentItem.kind === "skip"
              ? "We couldn't skip that application. Please try again."
              : "We couldn't approve that application. Please try again."
          );
          router.refresh();
        } finally {
          applicationQueueRef.current = applicationQueueRef.current.slice(1);
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
      if (applicationQueueRef.current.length > 0) {
        void processApplicationQueue();
      }
    }
  }, [router, showError]);

  const enqueueApplicationAction = useCallback(
    (item: ApplicationQueueItem) => {
      applicationQueueRef.current = [...applicationQueueRef.current, item];
      void processApplicationQueue();
    },
    [processApplicationQueue]
  );

  const getApplicantUserId = (application: PendingApplication | null) => {
    if (!application) return null;
    return (
      application.kindtao_user_id ||
      (application.kindtao as { user_id?: string })?.user_id ||
      application.kindtao?.user?.id ||
      application.user?.id ||
      null
    );
  };

  useEffect(() => {
    setActiveIndex(0);
    setHistory([]);
    setSwipeOffset(0);
    setSwipeDirection(null);
    setCaughtUpTimestamp(null);
  }, [applications]);

  useEffect(() => {
    if (!caughtUpTimestamp) return;
    const timeout = setTimeout(() => {
      setCaughtUpTimestamp(null);
    }, 12000);
    return () => clearTimeout(timeout);
  }, [caughtUpTimestamp]);

  const currentApplication = applications?.[activeIndex];
  const nextApplication = applications?.[activeIndex + 1];
  const isComplete = !currentApplication;
  const canRewind = history.length > 0;

  const isBoostedCandidate = useMemo(() => {
    if (!currentApplication?.kindtao) return false;
    const { is_boosted, boost_expires_at } = currentApplication.kindtao;
    return Boolean(
      is_boosted &&
        boost_expires_at &&
        typeof boost_expires_at === "number" &&
        boost_expires_at > Date.now()
    );
  }, [currentApplication]);

  const resetSwipeState = () => {
    setSwipeOffset(0);
    setSwipeDirection(null);
    setIsDragging(false);
  };

  const advanceToNextApplication = () => {
    setHistory((prev) => [...prev, activeIndex]);
    setActiveIndex((prev) => prev + 1);
    resetSwipeState();
    if (activeIndex + 1 >= applications.length) {
      setCaughtUpTimestamp(Date.now());
    }
  };

  const animateSkipAdvance = () => {
    setSwipeOffset(-900);
    setSwipeDirection("left");
    setTimeout(() => {
      advanceToNextApplication();
    }, 240);
  };

  const animateApprovalAdvance = () => {
    setSwipeOffset(900);
    setSwipeDirection("right");
    setTimeout(() => {
      advanceToNextApplication();
    }, 240);
  };

  const handleSkip = () => {
    if (!currentApplication) return;

    const applicationId = String(
      currentApplication._id || currentApplication.id || ""
    );
    if (!applicationId) {
      showError("Application reference missing.");
      return;
    }

    animateSkipAdvance();

    enqueueApplicationAction({
      kind: "skip",
      applicationId,
      application: currentApplication,
    });
  };

  const handleApproval = () => {
    const approvalTarget = currentApplication;
    if (!approvalTarget) return;
    if (!kindbossingUserId) {
      showError("Missing employer information. Please re-login.");
      return;
    }

    const applicantId = getApplicantUserId(approvalTarget);
    if (!applicantId) {
      showError("Unable to determine applicant account.");
      return;
    }

    const applicationId = String(approvalTarget._id || approvalTarget.id || "");
    if (!applicationId) {
      showError("Application reference missing.");
      return;
    }

    animateApprovalAdvance();

    enqueueApplicationAction({
      kind: "approve",
      application: approvalTarget,
      applicationId,
      applicantId,
      jobId,
      kindbossingUserId,
      navigateToMessaging: false,
      jobTitle,
      onApproved: onApplicationApproved
        ? () => onApplicationApproved(applicationId)
        : undefined,
    });
  };

  const finalizeSwipe = () => {
    if (Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
      resetSwipeState();
      return;
    }
    if (swipeOffset > 0) {
      handleApproval();
    } else {
      handleSkip();
    }
  };

  const handleOpenDetails = (application: PendingApplication) => {
    setSelectedApplication(application);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedApplication(null);
    setIsDetailsOpen(false);
  };

  const handlePointerDown = (clientX: number) => {
    if (!currentApplication) return;
    setIsDragging(true);
    setStartX(clientX);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging || !currentApplication) return;
    const offset = clientX - startX;
    setSwipeOffset(offset);

    if (offset > 0) {
      setSwipeDirection("right");
    } else if (offset < 0) {
      setSwipeDirection("left");
    } else {
      setSwipeDirection(null);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    finalizeSwipe();
  };

  const handleRewind = () => {
    if (!canRewind) return;
    if (!currentApplication && !caughtUpTimestamp) {
      return;
    }
    setHistory((prev) => {
      const nextHistory = [...prev];
      const previousIndex = nextHistory.pop();
      if (previousIndex === undefined) {
        return prev;
      }
      setActiveIndex(previousIndex);
      resetSwipeState();
      return nextHistory;
    });
  };

  const rotation = swipeOffset * ROTATION_FACTOR;
  const opacity = 1 - Math.min(Math.abs(swipeOffset) / 600, 0.4);

  if (!applications || applications.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 sm:gap-6 h-full py-4 sm:py-6">
      <div className="relative w-full max-w-xl h-full max-h-[calc(100vh-200px)] sm:max-h-[580px]">
        {isComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-xl font-semibold text-gray-900">
              You&apos;re all caught up!
            </p>
            <p className="mt-4 text-sm text-gray-600 max-w-sm">
              New applications will show up here automatically. Feel free to
              rewind to review previous candidates.
            </p>
            <button
              onClick={handleRewind}
              disabled={
                !canRewind || (!currentApplication && !caughtUpTimestamp)
              }
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRotateCw className="h-4 w-4" />
              {canRewind
                ? "Rewind last candidate"
                : "Awaiting new applications"}
            </button>
          </div>
        )}

        {currentApplication && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
            onTouchEnd={handlePointerUp}
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onMouseMove={(e) => isDragging && handlePointerMove(e.clientX)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            <div
              className="relative w-full max-w-sm h-full max-h-[calc(100vh-240px)] sm:max-h-[600px] rounded-2xl bg-white shadow-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col"
              style={{
                transform: `translateX(${swipeOffset}px) rotate(${rotation}deg)`,
                opacity,
                transition:
                  isDragging || swipeDirection
                    ? "none"
                    : "transform 0.2s ease-out, opacity 0.2s ease-out",
              }}
            >
              {swipeDirection === "right" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="text-6xl font-bold text-green-600 transform rotate-12 drop-shadow-2xl">
                    APPROVE
                  </div>
                </div>
              )}
              {swipeDirection === "left" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="text-6xl font-bold text-red-600 transform -rotate-12 drop-shadow-2xl">
                    NOPE
                  </div>
                </div>
              )}
              <div
                className={`relative shrink-0 h-[140px] sm:h-[160px] bg-linear-to-br ${isBoostedCandidate ? "from-blue-600 to-indigo-500" : "from-gray-800 to-gray-700"} text-white`}
              >
                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/60 to-transparent p-4 sm:p-6">
                  <h2 className="text-xl sm:text-3xl font-bold">
                    {getApplicantDisplayName(currentApplication)}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">
                      {getLocationLabel(currentApplication)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col overflow-hidden sm:overflow-visible">
                <div className="flex-1 min-h-0 overflow-y-auto sm:overflow-visible sm:min-h-auto sm:flex-auto p-4 sm:p-6">
                  <div className="flex flex-col gap-2 sm:gap-4">
                    <p className="text-xs text-gray-500">
                      Applied {formatAppliedDate(currentApplication.applied_at)}
                    </p>

                    {currentApplication.kindtao?.preferred_role && (
                      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          Preferred Role
                        </p>
                        <p className="text-base font-medium text-gray-900">
                          {currentApplication.kindtao.preferred_role}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                          {currentApplication.kindtao.years_of_experience && (
                            <span>
                              {currentApplication.kindtao.years_of_experience}{" "}
                              yrs experience
                            </span>
                          )}
                          {currentApplication.kindtao.salary_expectation && (
                            <span>
                              Expected:{" "}
                              {currentApplication.kindtao.salary_expectation}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {currentApplication.cover_message && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs uppercase text-gray-500 mb-2">
                          Cover Message
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {currentApplication.cover_message}
                        </p>
                      </div>
                    )}

                    {currentApplication.kindtao?.skills &&
                      currentApplication.kindtao.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Key Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentApplication.kindtao.skills
                              .slice(0, 6)
                              .map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {normalizeSkillName(skill)}
                                </span>
                              ))}
                            {currentApplication.kindtao.skills.length > 6 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{currentApplication.kindtao.skills.length - 6}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {currentApplication.kindtao?.languages &&
                      currentApplication.kindtao.languages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Languages
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentApplication.kindtao.languages
                              .slice(0, 4)
                              .map((language) => (
                                <span
                                  key={language}
                                  className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200"
                                >
                                  {language}
                                </span>
                              ))}
                            {currentApplication.kindtao.languages.length >
                              4 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-dashed border-gray-300">
                                +
                                {currentApplication.kindtao.languages.length -
                                  4}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {currentApplication.experiences &&
                      currentApplication.experiences.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Recent Experience
                          </h4>
                          {currentApplication.experiences
                            .slice(0, 1)
                            .map((exp) => (
                              <div
                                key={exp._id}
                                className="rounded-xl border border-gray-200 p-3 mb-2"
                              >
                                <p className="text-sm font-medium text-gray-900">
                                  {exp.job_title || "Role not specified"}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {exp.employer || "Employer not specified"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatAppliedDate(exp.start_date)}
                                  {" – "}
                                  {exp.is_current_job
                                    ? "Present"
                                    : formatAppliedDate(exp.end_date)}
                                </p>
                                {exp.location && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {exp.location}
                                  </p>
                                )}
                              </div>
                            ))}
                          {currentApplication.experiences.length > 1 && (
                            <p className="text-xs text-gray-500">
                              +{currentApplication.experiences.length - 1} more
                              experience
                              {currentApplication.experiences.length - 1 === 1
                                ? ""
                                : "s"}{" "}
                              — tap “See more details” for full history.
                            </p>
                          )}
                        </div>
                      )}

                    <button
                      onClick={() => handleOpenDetails(currentApplication)}
                      className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      See more details
                    </button>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-4 p-4 sm:p-6 pt-2 sm:pt-4 border-t border-gray-100">
                  {/* Show X button only when swiped left or not swiped */}
                  {(swipeDirection === "left" || swipeDirection === null) && (
                    <button
                      onClick={handleSkip}
                      className={`rounded-full p-2.5 sm:p-4 shadow-lg transition-all ${
                        swipeDirection === "left"
                          ? "bg-red-500 text-white scale-110"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  )}
                  {/* Show rewind button only when not swiped */}
                  {swipeDirection === null && (
                    <button
                      onClick={handleRewind}
                      className={`rounded-full p-2.5 sm:p-4 shadow-lg transition-all ${
                        canRewind
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      disabled={!canRewind}
                      title={
                        canRewind
                          ? "Rewind last candidate"
                          : "No previous candidate"
                      }
                    >
                      <FiRotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                  {/* Show check button only when swiped right or not swiped */}
                  {(swipeDirection === "right" || swipeDirection === null) && (
                    <button
                      onClick={handleApproval}
                      className={`rounded-full p-2.5 sm:p-4 shadow-lg transition-all ${
                        swipeDirection === "right"
                          ? "bg-green-500 text-white scale-110"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FiCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {nextApplication && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full max-w-sm h-full max-h-[calc(100vh-240px)] sm:max-h-[520px] rounded-2xl bg-white shadow-xl scale-95 translate-y-6 opacity-70 overflow-hidden blur-sm">
              <div
                className={`absolute inset-0 bg-linear-to-br ${nextApplication.kindtao?.is_boosted ? "from-blue-500/60 to-indigo-400/40" : "from-gray-700/50 to-gray-600/30"}`}
              />
              <div className="relative h-full flex flex-col justify-end p-6 text-white">
                <p className="text-sm uppercase tracking-wide text-white/80">
                  Up next
                </p>
                <h3 className="text-xl font-semibold">
                  {getApplicantDisplayName(nextApplication)}
                </h3>
                <p className="text-sm text-white/80">
                  {nextApplication.kindtao?.preferred_role ||
                    nextApplication.kindtao?.current_location ||
                    "Pending review"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ApplicationDetailsModal
        application={selectedApplication}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
