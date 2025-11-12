"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { JobPost } from "@/types/jobPosts";
import { Application } from "@/types/application";
import { UserProfile } from "@/types/userProfile";
import { useToastActions } from "@/stores/useToastStore";
import { ChatService } from "@/services/client/ChatService";
import { ApplicationService } from "@/services/client/ApplicationService";
import { ProfileService } from "@/services/client/ProfileService";
import { approveApplication } from "@/actions/applications/approve-application";
import { rejectApplication } from "@/actions/applications/reject-application";
import ApplicationSwipeInterface from "./_components/ApplicationSwipeInterface";
import { FaUser, FaArrowLeft, FaRocket } from "react-icons/fa";
import Link from "next/link";

export default function ApplicationsPage() {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToastActions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentApplication, setCurrentApplication] =
    useState<Application | null>(null);
  const [kindtaoProfile, setKindtaoProfile] = useState<UserProfile | null>(
    null
  );
  const [nextKindtaoProfile, setNextKindtaoProfile] =
    useState<UserProfile | null>(null);
  const [applicantBoostStatus, setApplicantBoostStatus] = useState<
    Record<string, { isBoosted: boolean; boostExpiresAt: string | null }>
  >({});
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>(
    {}
  );
  const [jobDetails, setJobDetails] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSwipeModalForApplication, setShowSwipeModalForApplication] =
    useState<Application | null>(null);
  const [approvedApplicationData, setApprovedApplicationData] = useState<{
    matchId?: string;
    applicantId: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      const jobId = searchParams.get("jobId");
      setSelectedJobId(jobId);
      loadApplications(jobId);
    }
  }, [user, searchParams]);

  const loadApplications = async (jobId?: string | null) => {
    try {
      setLoading(true);

      if (!user?.id) return;

      // Use ApplicationService to fetch applications with boost priority
      const result = await ApplicationService.getApplicationsForKindBossing(
        user.id,
        jobId
      );

      setApplications(result.applications);
      setApplicantBoostStatus(result.boostStatus);
      if (result.jobDetails) {
        setJobDetails(result.jobDetails);
      }

      // Create initial name map from applications
      const initialNames: Record<string, string> = {};
      result.applications.forEach((app) => {
        if (app.applicant_name && app.applicant_name !== "Applicant") {
          initialNames[app.applicant_id] = app.applicant_name;
        }
      });
      setApplicantNames(initialNames);

      // Load first application's profile if available
      if (result.applications.length > 0) {
        await loadKindTaoProfile(result.applications[0].applicant_id);
        setCurrentApplication(result.applications[0]);

        // Preload next applicant profile for blur preview
        if (result.applications.length > 1) {
          const nextProfile = await loadKindTaoProfileAsync(
            result.applications[1].applicant_id
          );
          setNextKindtaoProfile(nextProfile);
        }
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      showError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadKindTaoProfileAsync = async (
    applicantId: string
  ): Promise<UserProfile | null> => {
    const profile = await ProfileService.getKindTaoProfileByUserId(applicantId);
    if (profile) {
      // Update applicant name map
      const fullName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ");
      if (fullName) {
        setApplicantNames((prev) => ({
          ...prev,
          [applicantId]: fullName,
        }));
      }
    }
    return profile;
  };

  const loadKindTaoProfile = async (applicantId: string) => {
    try {
      const profile = await ProfileService.getKindTaoProfileByUserId(
        applicantId
      );
      if (profile) {
        setKindtaoProfile(profile);

        // Update applicant name map
        const fullName = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");
        if (fullName) {
          setApplicantNames((prev) => ({
            ...prev,
            [applicantId]: fullName,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading KindTao profile:", error);
    }
  };

  const handleApplicationApproved = async (application: Application) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Use server action to approve application
      const result = await approveApplication(
        application.id,
        application.job_id,
        application.applicant_id
      );

      if (!result.success) {
        showError(result.error || "Failed to approve application");
        return;
      }

      // Store the approved application data for the modal
      setApprovedApplicationData({
        matchId: result.matchId,
        applicantId: application.applicant_id,
      });

      // Show the modal by storing the application BEFORE removing from list
      setShowSwipeModalForApplication(application);

      showSuccess("✅ Candidate approved!");
    } catch (error) {
      console.error("Error processing application:", error);
      showError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartMessaging = async () => {
    // Remove the approved application from list before closing modal
    if (showSwipeModalForApplication) {
      setApplications((prev) =>
        prev.filter((app) => app.id !== showSwipeModalForApplication.id)
      );
    }

    // Close modal
    setShowSwipeModalForApplication(null);

    if (!approvedApplicationData) {
      router.push("/matches");
      return;
    }

    // Get the match ID for the approved application
    const matchId = approvedApplicationData.matchId;

    if (matchId) {
      try {
        const supabase = createClient();

        // Check if conversation already exists for this match
        const { data: existingConversation, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .eq("match_id", matchId)
          .single();

        let conversationId = existingConversation?.id;

        // If no conversation exists, create one using ChatService
        if (!conversationId) {
          try {
            const newConversation = await ChatService.createConversation(
              matchId
            );
            conversationId = newConversation?.id;

            // Send an initial welcome message
            if (conversationId && user?.id) {
              await ChatService.sendMessage(
                conversationId,
                user.id,
                "Hello! I'd like to discuss this opportunity with you.",
                "text"
              );

              // Small delay to ensure message is saved
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          } catch (createError) {
            console.error("Error creating conversation:", createError);
            showError("Failed to create conversation");
          }
        }

        // Navigate to chat with conversation ID
        if (conversationId) {
          // Add jobId as query parameter to maintain context
          const jobId = showSwipeModalForApplication?.job_id;
          const url = jobId
            ? `/matches/${conversationId}?job=${jobId}`
            : `/matches/${conversationId}`;
          router.push(url);
        } else {
          router.push("/matches");
        }
      } catch (error) {
        console.error("Error starting conversation:", error);
        showError("Failed to start conversation");
        router.push("/matches");
      }
    } else {
      router.push("/matches");
    }

    setApprovedApplicationData(null);
  };

  const handleSaveForLaterAction = () => {
    // Remove the approved application from list before closing modal
    if (showSwipeModalForApplication) {
      setApplications((prev) =>
        prev.filter((app) => app.id !== showSwipeModalForApplication.id)
      );
    }

    // Close modal
    setShowSwipeModalForApplication(null);
    setApprovedApplicationData(null);

    // Reload applications to show next pending application
    loadApplications(selectedJobId);
  };

  const handleApplicationRejected = async (application: Application) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Use server action to reject application
      const result = await rejectApplication(application.id);

      if (!result.success) {
        showError(result.error || "Failed to reject application");
        return;
      }

      showSuccess("Candidate rejected");

      // Reload applications to get the updated list (rejected app won't show)
      await loadApplications(selectedJobId);
    } catch (error) {
      console.error("Error processing application:", error);
      showError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextApplication = async () => {
    if (currentIndex < applications.length - 1) {
      const nextIndex = currentIndex + 1;

      // Move to next application
      setCurrentIndex(nextIndex);
      setCurrentApplication(applications[nextIndex]);

      // Load the current applicant's profile
      await loadKindTaoProfile(applications[nextIndex].applicant_id);

      // Preload the next next applicant profile if available
      if (nextIndex + 1 < applications.length) {
        const nextNextProfile = await loadKindTaoProfileAsync(
          applications[nextIndex + 1].applicant_id
        );
        setNextKindtaoProfile(nextNextProfile);
      } else {
        setNextKindtaoProfile(null);
      }
    }
  };

  const handlePreviousApplication = async () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevApplication = applications[prevIndex];
      setCurrentApplication(prevApplication);
      await loadKindTaoProfile(prevApplication.applicant_id);
    }
  };

  const getApplicantDisplayName = (application?: Application | null) => {
    if (!application) return "Applicant";
    const fromMap = applicantNames[application.applicant_id];
    if (fromMap && fromMap !== "Applicant") {
      return fromMap;
    }
    if (
      application.applicant_name &&
      application.applicant_name !== "Applicant"
    ) {
      return application.applicant_name;
    }
    return "Applicant";
  };

  const currentApplicantName = getApplicantDisplayName(currentApplication);
  const upcomingApplication =
    currentIndex + 1 < applications.length
      ? applications[currentIndex + 1]
      : null;
  const nextApplicantName = getApplicantDisplayName(upcomingApplication);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8vh)] bg-gray-50">
        {/* Header skeleton */}
        <div className="px-6 pt-6 pb-2">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Card skeleton */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm md:max-w-md">
            <div className="h-[500px] md:h-[540px] bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="flex items-center justify-center gap-6 mt-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-200 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-8vh)] bg-gray-50">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <Link
            href="/my-jobs"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#CC0000] transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to My Jobs</span>
          </Link>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {jobDetails?.job_title ? (
              <>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {jobDetails.job_title}
                </h1>
                <span className="text-sm text-gray-500">Applications</span>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">
                Job Applications
              </h1>
            )}
          </div>
        </div>

        {/* Centered Empty State */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedJobId
                ? "No Applications for This Job"
                : "No Applications Yet"}
            </h3>
            <p className="text-gray-600">
              {selectedJobId
                ? "No candidates have applied to this specific job yet. Check back later for new applications."
                : "When candidates apply to your jobs, they'll appear here for you to review and approve."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100vh-8vh)] bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <Link
          href="/my-jobs"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#CC0000] transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span>Back to My Jobs</span>
        </Link>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {jobDetails?.job_title ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900">
                {jobDetails.job_title}
              </h1>
              <span className="text-sm text-gray-500">Applications</span>
              {jobDetails?.job_type && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                  {jobDetails.job_type}
                </span>
              )}
            </>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">
              Job Applications
            </h1>
          )}
        </div>
      </div>

      {/* Centered Swipe UI */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-sm md:max-w-md">
          {currentApplication && kindtaoProfile ? (
            <ApplicationSwipeInterface
              application={currentApplication}
              kindtaoProfile={kindtaoProfile}
              jobDetails={jobDetails}
              currentIndex={currentIndex}
              totalApplications={applications.length}
              isProcessing={isProcessing}
              onApprove={() => handleApplicationApproved(currentApplication)}
              onReject={() => handleApplicationRejected(currentApplication)}
              onNext={handleNextApplication}
              onPrevious={handlePreviousApplication}
              onStartMessaging={handleStartMessaging}
              onSaveForLater={handleSaveForLaterAction}
              forceShowModal={
                showSwipeModalForApplication?.id === currentApplication?.id
              }
              canGoNext={currentIndex < applications.length - 1}
              canGoPrevious={currentIndex > 0}
              nextApplication={applications[currentIndex + 1] || null}
              nextKindtaoProfile={nextKindtaoProfile}
              applicantName={currentApplicantName}
              nextApplicantName={nextApplicantName}
            />
          ) : (
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Profile...
              </h3>
              <p className="text-gray-600">
                Please wait while we load the candidate's profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
