"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { useToastActions } from "@/stores/useToastStore";
import { FaArrowLeft } from "react-icons/fa";
import ApplicationSwipeDeck from "./_components/ApplicationSwipeDeck";
import type { PendingApplication } from "./_components/applicationTypes";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

export default function JobApplicationsPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const { showError } = useToastActions();
  const jobId = params?.jobId;

  const currentUser = useQuery(api.auth.getCurrentUser);
  const job = useQuery(
    api.jobs.getJobById,
    jobId
      ? {
          jobId,
        }
      : "skip"
  );

  const kindbossingUserId = useMemo(
    () => getUserId(currentUser),
    [currentUser]
  );

  const pendingApplications = useQuery(
    api.applications.getPendingApplicationsForKindBossing,
    kindbossingUserId && jobId
      ? {
          kindbossingUserId,
          jobId,
        }
      : "skip"
  );

  const isLoadingUser = currentUser === undefined;
  const isLoadingJob = jobId ? job === undefined : false;
  const isLoadingApplications =
    kindbossingUserId && jobId ? pendingApplications === undefined : false;
  const isLoading = isLoadingUser || isLoadingJob || isLoadingApplications;

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  const normalizedJob = (job as Record<string, any> | null) ?? null;
  const jobOwnerId = normalizedJob?.kindbossing_user_id ?? null;
  const jobTitle = normalizedJob?.job_title || "Job";

  useEffect(() => {
    if (!jobId || isLoadingJob) return;
    if (job === null) {
      showError("Job not found");
      router.replace("/my-job-posts");
    }
  }, [job, jobId, isLoadingJob, router, showError]);

  useEffect(() => {
    if (!normalizedJob || !kindbossingUserId) return;
    if (jobOwnerId && jobOwnerId !== kindbossingUserId) {
      showError("Unauthorized");
      router.replace("/my-job-posts");
    }
  }, [normalizedJob, jobOwnerId, kindbossingUserId, router, showError]);

  if (!jobId) {
    return null;
  }

  if (isLoading) {
    return (
      <main className="relative h-full overflow-hidden bg-gray-50">
        <div className="flex flex-col items-center justify-center h-full px-6">
          <div className="relative w-full max-w-xl h-[520px]">
            <div className="absolute inset-0 flex flex-col gap-4 animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded-lg" />
              <div className="w-full h-[460px] bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <div className="h-32 bg-gray-100" />
                <div className="flex flex-col gap-3 p-6">
                  <div className="h-5 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    <div className="h-6 w-16 bg-gray-100 rounded-full" />
                    <div className="h-6 w-24 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-20 bg-gray-50 rounded-xl" />
                </div>
                <div className="flex justify-center gap-4 py-4 border-t border-gray-100">
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (job === null) {
    return null;
  }

  const applications = (pendingApplications ?? []) as PendingApplication[];
  const applicationCount = applications.length;

  return (
    <main className="relative h-full overflow-hidden">
      {/* Absolute positioned header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 sm:px-4 pt-2 sm:pt-4 pb-1">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/my-job-posts"
              className="rounded-full p-1.5 sm:p-2 transition-colors hover:bg-gray-100"
            >
              <FaArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-semibold text-gray-900 truncate leading-tight">
                Applications for {jobTitle}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
                {applicationCount} pending application
                {applicationCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - full height, no scroll */}
      <div className="h-full pt-16 sm:pt-20 px-4 sm:px-6 overflow-hidden">
        <div className="mx-auto max-w-6xl h-full">
          {applicationCount === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  No applications yet
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Applications for this job will appear here as soon as
                  candidates apply.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <ApplicationSwipeDeck
                applications={applications}
                jobId={jobId}
                jobTitle={jobTitle}
                kindbossingUserId={kindbossingUserId}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
