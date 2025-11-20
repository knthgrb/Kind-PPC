"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobPost } from "@/types/jobPosts";
import { useToastActions } from "@/stores/useToastStore";
import {
  pauseJob,
  activateJob,
  closeJob,
  deleteJob,
  boostJob,
} from "@/actions/jobs";
import { JobService } from "@/services/JobService";
import { convex, api } from "@/utils/convex/client";
import { logger } from "@/utils/logger";
import { useQuery } from "convex/react";
import { FaPlus, FaEye, FaUsers, FaRocket } from "react-icons/fa";
import { format } from "date-fns";
import dynamic from "next/dynamic";
const PostJobModal = dynamic(() => import("@/components/modals/PostJobModal"), {
  ssr: false,
});
const JobDetailsModal = dynamic(
  () => import("@/components/modals/JobDetailsModal"),
  {
    ssr: false,
  }
);
const JobActionModal = dynamic(
  () => import("@/components/modals/JobActionModal"),
  {
    ssr: false,
  }
);
const JobActionMenu = dynamic(
  () => import("@/components/common/JobActionMenu"),
  {
    ssr: false,
  }
);

type MyJobPostsClientProps = {
  initialJobs: JobPost[];
  userId: string;
};

export default function MyJobPostsClient({
  initialJobs,
  userId,
}: MyJobPostsClientProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToastActions();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [viewingJob, setViewingJob] = useState<JobPost | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: "pause" | "activate" | "close" | "reopen" | "delete";
    job: JobPost | null;
  }>({
    isOpen: false,
    action: "pause",
    job: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const pendingApplications = useQuery(
    api.applications.getPendingApplicationsForKindBossing,
    userId
      ? {
          kindbossingUserId: userId,
        }
      : "skip"
  );

  const pendingCountsByJob = useMemo(() => {
    if (!pendingApplications || !Array.isArray(pendingApplications)) {
      return {};
    }

    return pendingApplications.reduce<Record<string, number>>((acc, app) => {
      const jobId = app.job_post_id;
      if (!jobId) {
        return acc;
      }
      acc[jobId] = (acc[jobId] || 0) + 1;
      return acc;
    }, {});
  }, [pendingApplications]);

  const hasPendingForJob = (jobId: string) =>
    (pendingCountsByJob[jobId] ?? 0) > 0;

  const refreshJobs = async () => {
    try {
      const fetchedJobs = await JobService.fetchMyJobs(convex, userId);
      setJobs(fetchedJobs);
    } catch (error) {
      logger.error("Failed to refresh jobs:", error);
    }
  };

  const handleJobAction = async (job: JobPost, action: string) => {
    if (action === "view") {
      setViewingJob(job);
      return;
    }

    if (action === "edit") {
      setEditingJob(job);
      setIsPostModalOpen(true);
      return;
    }

    if (action === "view-applications") {
      router.push(`/my-job-posts/${job.id}/applications`);
      return;
    }

    if (action === "boost") {
      setIsLoading(true);
      try {
        const result = await boostJob(job.id);
        if (result.success) {
          showSuccess("Job boosted successfully!");
          await refreshJobs();
        } else {
          showError(result.error || "Failed to boost job");
        }
      } catch (error) {
        logger.error("Failed to boost job:", error);
        showError("Failed to boost job");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For pause, activate, close, reopen, delete - show confirmation modal
    if (
      action === "pause" ||
      action === "activate" ||
      action === "close" ||
      action === "reopen" ||
      action === "delete"
    ) {
      setActionModal({
        isOpen: true,
        action: action === "reopen" ? "activate" : action,
        job,
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!actionModal.job) return;

    setIsLoading(true);
    try {
      let result;
      switch (actionModal.action) {
        case "pause":
          result = await pauseJob(actionModal.job.id);
          break;
        case "activate":
          result = await activateJob(actionModal.job.id);
          break;
        case "close":
          result = await closeJob(actionModal.job.id);
          break;
        case "delete":
          result = await deleteJob(actionModal.job.id);
          break;
        default:
          return;
      }

      if (result.success) {
        showSuccess(
          `Job ${actionModal.action === "delete" ? "deleted" : actionModal.action === "pause" ? "paused" : actionModal.action === "activate" ? "activated" : "closed"} successfully`
        );
        setActionModal({ isOpen: false, action: "pause", job: null });
        await refreshJobs();
      } else {
        showError(result.error || `Failed to ${actionModal.action} job`);
      }
    } catch (error) {
      logger.error(`Failed to ${actionModal.action} job:`, error);
      showError(`Failed to ${actionModal.action} job`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobPosted = async () => {
    await refreshJobs();
    setEditingJob(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: "Active",
        className: "bg-green-100 text-green-800",
      },
      paused: {
        label: "Paused",
        className: "bg-yellow-100 text-yellow-800",
      },
      closed: {
        label: "Closed",
        className: "bg-gray-100 text-gray-800",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Job Management
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">Job Posts</h1>
            <p className="mt-2 text-sm text-gray-600">
              Keep track of every role you have published for the KindTao
              community.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditingJob(null);
                setIsPostModalOpen(true);
              }}
              className="hidden sm:inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CB0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a10000] transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Post a Job
            </button>
          </div>
        </header>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-xl font-semibold text-gray-900">
              You haven&apos;t posted a job yet
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Once you publish a job, it will appear here with status, salary,
              and location details so you can manage it easily.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.job_title}
                          </h3>
                          {getStatusBadge(job.status || "active")}
                          {job.is_boosted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FaRocket className="w-3 h-3" />
                              Boosted
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>{job.location}</span>
                          <span>•</span>
                          <span>{job.salary}</span>
                          {job.job_type && (
                            <>
                              <span>•</span>
                              <span className="capitalize">
                                {job.job_type.replace("-", " ")}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Posted {formatDate(job.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {job.job_description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {job.job_description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleJobAction(job, "view")}
                        className="inline-flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FaEye className="w-3 h-3" />
                        View Details
                      </button>
                      <button
                        onClick={() =>
                          handleJobAction(job, "view-applications")
                        }
                        className="relative inline-flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-200"
                      >
                        <FaUsers className="w-3 h-3" />
                        <span>View Applications</span>
                        {hasPendingForJob(job.id) && (
                          <span className="absolute -top-2 -right-2 inline-flex min-w-5 justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {pendingCountsByJob[job.id] ?? 0}
                          </span>
                        )}
                      </button>
                      {!job.is_boosted && (
                        <button
                          onClick={() => handleJobAction(job, "boost")}
                          disabled={isLoading}
                          className="inline-flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          <FaRocket className="w-3 h-3" />
                          Boost Job
                        </button>
                      )}
                      <JobActionMenu
                        job={job}
                        onAction={handleJobAction}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditingJob(null);
        }}
        familyId={userId}
        onJobPosted={handleJobPosted}
        editingJob={editingJob}
      />

      {/* Job Details Modal */}
      <JobDetailsModal
        isOpen={!!viewingJob}
        onClose={() => setViewingJob(null)}
        job={viewingJob}
      />

      {/* Action Confirmation Modal */}
      <JobActionModal
        isOpen={actionModal.isOpen}
        onClose={() =>
          setActionModal({ isOpen: false, action: "pause", job: null })
        }
        onConfirm={handleConfirmAction}
        action={actionModal.action}
        jobTitle={actionModal.job?.job_title || ""}
        isLoading={isLoading}
      />

      {/* Mobile FAB */}
      <button
        onClick={() => {
          setEditingJob(null);
          setIsPostModalOpen(true);
        }}
        className="fixed cursor-pointer bottom-20 right-6 z-90 flex h-14 w-14 items-center justify-center rounded-full bg-[#CB0000] text-white shadow-lg transition hover:bg-[#a10000] sm:hidden"
        aria-label="Post a job"
      >
        <FaPlus className="h-5 w-5" />
      </button>
    </div>
  );
}
