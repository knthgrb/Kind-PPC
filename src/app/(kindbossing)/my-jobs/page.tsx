"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { JobService } from "@/services/client/JobService";
import { JobPost } from "@/types/jobPosts";
import { FaUsers, FaCalendar, FaPlus, FaRocket } from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import { salaryFormatter, salaryRateFormatter } from "@/utils/salaryFormatter";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import PostJobModal from "@/components/modals/PostJobModal";
import JobActionModal from "@/components/modals/JobActionModal";
import JobActionMenu from "@/components/common/JobActionMenu";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SubscriptionModal from "@/components/modals/SubscriptionModal";
import CreditPurchaseModal from "@/components/modals/CreditPurchaseModal";
import { updateJobStatus, deleteJobPost } from "@/actions/jobs/manage-job";
import { boostJob } from "@/actions/jobs/boost-job";
import { getUserSubscription } from "@/actions/subscription/xendit";
import { useToastActions } from "@/stores/useToastStore";

export default function MyJobsPage() {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToastActions();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState<
    Record<string, number>
  >({});
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "closed">(
    "all"
  );
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: string;
    job: JobPost | null;
  }>({
    isOpen: false,
    action: "",
    job: null,
  });
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCreditPurchaseModalOpen, setIsCreditPurchaseModalOpen] =
    useState(false);
  const [boostCredits, setBoostCredits] = useState<number>(0);
  const [boostingJobId, setBoostingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMyJobs();
      loadBoostCredits();
    }
  }, [user]);

  const loadBoostCredits = async () => {
    if (!user?.id) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("boost_credits")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setBoostCredits(data.boost_credits || 0);
      }
    } catch (error) {
      console.error("Error loading boost credits:", error);
    }
  };

  const loadMyJobs = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const myJobs = await JobService.fetchMyJobs(user.id);
        setJobs(myJobs);

        // Fetch application counts for each job
        await loadApplicationCounts(myJobs);
      }
    } catch (error) {
      console.error("Error loading my jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationCounts = async (jobs: JobPost[]) => {
    if (!user?.id || jobs.length === 0) return;

    try {
      const supabase = createClient();
      const jobIds = jobs.map((job) => job.id);

      const { data, error } = await supabase
        .from("job_applications")
        .select("job_post_id")
        .in("job_post_id", jobIds)
        .eq("status", "pending");

      console.log("Application counts query result:", { data, error, jobIds });

      if (error) {
        console.error("Error loading application counts:", error);
        return;
      }

      // Count applications per job
      const counts: Record<string, number> = {};
      data?.forEach((app) => {
        counts[app.job_post_id] = (counts[app.job_post_id] || 0) + 1;
      });

      setApplicationCounts(counts);
    } catch (error) {
      console.error("Error loading application counts:", error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "closed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "active":
        return "🟢";
      case "paused":
        return "⏸️";
      case "closed":
        return "🔒";
      default:
        return "🟢";
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    return (job.status || "active") === filter;
  });

  const handleJobPosted = () => {
    // Reload jobs when a new job is posted
    loadMyJobs();
  };

  const handleJobEdited = () => {
    // Reload jobs when a job is edited
    loadMyJobs();
    setIsEditJobModalOpen(false);
    setEditingJob(null);
  };

  const handleBoostJob = async (job: JobPost) => {
    if (!user?.id) return;

    // Check if job is already boosted and not expired
    if (job.is_boosted && job.boost_expires_at) {
      const expiryDate = new Date(job.boost_expires_at);
      if (expiryDate > new Date()) {
        showError("This job is already boosted");
        return;
      }
    }

    // Check if job is active
    if (job.status !== "active") {
      showError("Only active jobs can be boosted");
      return;
    }

    // Check boost credits
    if (boostCredits < 1) {
      // Check if user has subscription
      try {
        const subscriptionResult = await getUserSubscription();
        const hasSubscription =
          subscriptionResult.success &&
          subscriptionResult.subscription &&
          subscriptionResult.subscription.status === "active";

        if (!hasSubscription) {
          // Show subscription modal
          setIsSubscriptionModalOpen(true);
        } else {
          // Show credit purchase modal
          setIsCreditPurchaseModalOpen(true);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscriptionModalOpen(true);
      }
      return;
    }

    // Boost the job
    setBoostingJobId(job.id);
    try {
      const result = await boostJob(job.id);
      if (result.success) {
        showSuccess("Job boosted successfully!");
        loadMyJobs();
        loadBoostCredits(); // Reload boost credits
      } else {
        showError(result.error || "Failed to boost job");
      }
    } catch (error) {
      console.error("Error boosting job:", error);
      showError("An unexpected error occurred");
    } finally {
      setBoostingJobId(null);
    }
  };

  const handleJobAction = (job: JobPost, action: string) => {
    console.log("handleJobAction called with:", { job: job.job_title, action });

    // Handle edit action directly - don't go through confirmation modal
    if (action === "edit") {
      console.log("Opening edit modal for job:", job.job_title);
      setEditingJob(job);
      setIsEditJobModalOpen(true);
      return;
    }

    // For other actions, show confirmation modal
    setActionModal({
      isOpen: true,
      action,
      job,
    });
  };

  const confirmJobAction = async () => {
    if (!actionModal.job) return;

    setActionLoading(actionModal.job.id);

    try {
      let result;

      switch (actionModal.action) {
        case "pause":
          result = await updateJobStatus(actionModal.job.id, "paused");
          if (result.success) {
            showSuccess("Job paused successfully");
            loadMyJobs();
          } else {
            showError(result.error || "Failed to pause job");
          }
          break;

        case "activate":
          result = await updateJobStatus(actionModal.job.id, "active");
          if (result.success) {
            showSuccess("Job activated successfully");
            loadMyJobs();
          } else {
            showError(result.error || "Failed to activate job");
          }
          break;

        case "close":
          result = await updateJobStatus(actionModal.job.id, "closed");
          if (result.success) {
            showSuccess("Job closed successfully");
            loadMyJobs();
          } else {
            showError(result.error || "Failed to close job");
          }
          break;

        case "reopen":
          result = await updateJobStatus(actionModal.job.id, "reopen");
          if (result.success) {
            showSuccess("Job reopened successfully");
            loadMyJobs();
          } else {
            showError(result.error || "Failed to reopen job");
          }
          break;

        case "delete":
          result = await deleteJobPost(actionModal.job.id);
          if (result.success) {
            showSuccess("Job deleted successfully");
            loadMyJobs();
          } else {
            showError(result.error || "Failed to delete job");
          }
          break;
      }
    } catch (error) {
      console.error("Error performing job action:", error);
      showError("An unexpected error occurred");
    } finally {
      setActionLoading(null);
      setActionModal({ isOpen: false, action: "", job: null });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto p-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded-xl w-20 animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Jobs Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              {/* Job Header Skeleton */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>

              {/* Job Details Skeleton */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>

                {/* Application Count Skeleton */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex space-x-2">
                  <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Job Postings
            </h1>
            <p className="text-gray-600">
              Manage your job postings and track applications
            </p>
          </div>
          <PrimaryButton
            onClick={() => setIsPostJobModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FaPlus className="w-3 h-3" strokeWidth={3} />
            <p className="text-sm font-medium">Post New Job</p>
          </PrimaryButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All Jobs", count: jobs.length },
            {
              key: "active",
              label: "Active",
              count: jobs.filter((j) => (j.status || "active") === "active")
                .length,
            },
            {
              key: "paused",
              label: "Paused",
              count: jobs.filter((j) => j.status === "paused").length,
            },
            {
              key: "closed",
              label: "Closed",
              count: jobs.filter((j) => j.status === "closed").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 cursor-pointer rounded-xl text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white text-[#CC0000] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" ? "No job postings yet" : `No ${filter} jobs`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all"
              ? "Start by posting your first job to find the perfect candidates."
              : `You don't have any ${filter} job postings at the moment.`}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setIsPostJobModalOpen(true)}
              className="bg-[#CC0000] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>+</span>
              <span>Post Your First Job</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 group flex flex-col"
            >
              {/* Job Header */}
              <div className="p-6 border-b border-gray-100 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#CC0000] transition-colors">
                      {job.job_title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3 flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          job.status
                        )}`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(job.status)}
                        </span>
                        {job.status === "active"
                          ? "Active"
                          : job.status === "paused"
                          ? "Paused"
                          : job.status === "closed"
                          ? "Closed"
                          : "Active"}
                      </span>
                      {job.is_boosted &&
                        job.boost_expires_at &&
                        new Date(job.boost_expires_at) > new Date() && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                            <FaRocket className="w-3 h-3 mr-1" />
                            Boosted
                          </span>
                        )}
                    </div>
                  </div>
                  <JobActionMenu
                    job={job}
                    onAction={handleJobAction}
                    isLoading={actionLoading === job.id}
                  />
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
                  {job.job_description}
                </p>

                <div className="flex items-center text-gray-500 text-sm">
                  <SlLocationPin className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>

              {/* Job Details */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                      Salary
                    </p>
                    <p className="font-bold text-gray-900 text-lg">
                      ₱{job.salary}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {job.job_type}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                      Applications
                    </p>
                    <div className="flex items-center">
                      <FaUsers className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="font-bold text-gray-900 text-lg">
                        {applicationCounts[job.id] || 0}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {job.status === "active" && (
                    <button
                      onClick={() => handleBoostJob(job)}
                      disabled={
                        boostingJobId === job.id ||
                        !!(
                          job.is_boosted &&
                          job.boost_expires_at &&
                          new Date(job.boost_expires_at) > new Date()
                        )
                      }
                      className={`w-full px-4 py-3 rounded-lg transition-colors text-center text-sm font-medium flex items-center justify-center space-x-2 ${
                        job.is_boosted &&
                        job.boost_expires_at &&
                        new Date(job.boost_expires_at) > new Date()
                          ? "bg-red-100 text-red-700 border border-red-300 cursor-not-allowed"
                          : "bg-[#CC0000] text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {boostingJobId === job.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Boosting...</span>
                        </>
                      ) : job.is_boosted &&
                        job.boost_expires_at &&
                        new Date(job.boost_expires_at) > new Date() ? (
                        <>
                          <FaRocket className="w-4 h-4" />
                          <span>Already Boosted</span>
                        </>
                      ) : (
                        <>
                          <FaRocket className="w-4 h-4" />
                          <span>Boost Job</span>
                        </>
                      )}
                    </button>
                  )}
                  <Link
                    href={`/my-jobs/applications?jobId=${job.id}`}
                    className="w-full bg-[#CC0000] text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors text-center text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <FaUsers className="w-4 h-4" />
                    <span>View Applications</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
        familyId={user?.id || ""}
        onJobPosted={handleJobPosted}
      />

      {/* Edit Job Modal */}
      <PostJobModal
        isOpen={isEditJobModalOpen}
        onClose={() => {
          setIsEditJobModalOpen(false);
          setEditingJob(null);
        }}
        familyId={user?.id || ""}
        onJobPosted={handleJobEdited}
        editingJob={editingJob}
      />

      {/* Job Action Modal */}
      <JobActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: "", job: null })}
        onConfirm={confirmJobAction}
        action={actionModal.action as any}
        jobTitle={actionModal.job?.job_title || ""}
        isLoading={actionLoading === actionModal.job?.id}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          loadBoostCredits(); // Reload credits after modal closes
        }}
        userRole="kindbossing"
      />

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={isCreditPurchaseModalOpen}
        onClose={() => {
          setIsCreditPurchaseModalOpen(false);
          loadBoostCredits(); // Reload credits after modal closes
        }}
        creditType="boost_credits"
        currentCredits={boostCredits}
      />
    </div>
  );
}
