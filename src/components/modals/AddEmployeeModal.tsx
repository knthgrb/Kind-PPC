"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToastActions } from "@/stores/useToastStore";
import Dropdown from "@/components/dropdown/Dropdown";
import { FaTimes } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { logger } from "@/utils/logger";
import {
  getMatchedUsersForJob,
  MatchedUserOption,
} from "@/actions/employees/get-matched-users-for-job";
import { JobPost } from "@/types/jobPosts";
import { getJobPostsForEmployeeSelection } from "@/actions/employees/get-job-posts";
import { addEmployee } from "@/actions/employees/add-employee";

type AddEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded?: () => void;
};

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onEmployeeAdded,
}: AddEmployeeModalProps) {
  const { showSuccess, showError } = useToastActions();

  // form state
  const [kindtaoUserId, setKindtaoUserId] = useState("");
  const [jobPostId, setJobPostId] = useState("");

  // Job posts state
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loadingJobPosts, setLoadingJobPosts] = useState(false);

  // KindTao users state
  const [kindtaoUsers, setKindtaoUsers] = useState<MatchedUserOption[]>([]);
  const [loadingKindtaoUsers, setLoadingKindtaoUsers] = useState(false);

  // Fetch job posts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadJobPosts();
      setKindtaoUserId("");
      setJobPostId("");
    }
  }, [isOpen]);

  // Fetch KindTao users when job post is selected
  useEffect(() => {
    if (jobPostId) {
      // Find the actual job to get its ID
      const selectedJob = jobPosts.find((job) => {
        const option = `${job.job_title} - ${job.location}`;
        return option === jobPostId;
      });

      if (selectedJob?.id) {
        loadKindTaoUsers(selectedJob.id);
        setKindtaoUserId(""); // Reset selection when job changes
      } else {
        setKindtaoUsers([]);
      }
    } else {
      setKindtaoUsers([]);
    }
  }, [jobPostId, jobPosts]);

  const loadJobPosts = async () => {
    setLoadingJobPosts(true);
    try {
      const result = await getJobPostsForEmployeeSelection();
      if (result.success) {
        setJobPosts(result.jobPosts || []);
      } else {
        logger.error("Error loading job posts:", result.error);
      }
    } catch (error) {
      logger.error("Error loading job posts:", error);
    } finally {
      setLoadingJobPosts(false);
    }
  };

  const loadKindTaoUsers = async (jobId: string) => {
    setLoadingKindtaoUsers(true);
    try {
      const result = await getMatchedUsersForJob(jobId);
      if (result.success) {
        // No matches is a valid state, not an error
        setKindtaoUsers(result.users || []);
      } else {
        // Only log actual errors (not "no matches" scenarios)
        // Check if it's a real error vs just no matches
        if (
          result.error &&
          !result.error.includes("not found") &&
          !result.error.includes("Invalid ID")
        ) {
          logger.warn("Error loading matched users:", result.error);
        }
        setKindtaoUsers([]);
      }
    } catch (error) {
      // Only log unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("Invalid ID length")) {
        logger.error("Error loading matched users:", error);
      }
      setKindtaoUsers([]);
    } finally {
      setLoadingKindtaoUsers(false);
    }
  };

  // Create job options from job posts (for dropdown display)
  // Format: "Job Title - Location"
  const jobOptions = jobPosts.map(
    (job) => `${job.job_title} - ${job.location}`
  );

  // Get selected job post - jobPostId stores the formatted option string
  const selectedJob = jobPosts.find((job) => {
    const option = `${job.job_title} - ${job.location}`;
    return option === jobPostId;
  });

  // Create KindTao user options (for dropdown display)
  const kindtaoUserOptions = kindtaoUsers.map((user) => user.name);

  // Get selected KindTao user ID from selected name
  const selectedKindTaoUser = kindtaoUsers.find(
    (user) => user.name === kindtaoUserId
  );

  const handleAddEmployee = async () => {
    if (
      !kindtaoUserId.trim() ||
      !jobPostId.trim() ||
      !selectedKindTaoUser ||
      !selectedJob
    ) {
      showError(
        "Please complete all required fields before adding the employee."
      );
      return;
    }

    try {
      const result = await addEmployee({
        kindbossing_user_id: "", // Will be set in server action
        kindtao_user_id: selectedKindTaoUser.id,
        job_post_id: selectedJob.id,
        status: "active", // Always set new employees as active
      });

      if (result.success) {
        showSuccess(
          `${selectedKindTaoUser.name} has been added to your team successfully`
        );
        onClose();
        onEmployeeAdded?.();
      } else {
        showError(
          result.error || "Something went wrong while adding the employee."
        );
      }
    } catch (err) {
      logger.error("Failed to add employee:", err);
      showError("Something went wrong while adding the employee.");
    }
  };

  const handleClose = () => {
    // Reset form
    setKindtaoUserId("");
    setJobPostId("");
    setKindtaoUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-9999" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Add Employee</h2>
            <button
              onClick={handleClose}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Job Position */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Job Position
              </label>
              {loadingJobPosts ? (
                <div className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 flex items-center">
                  <span className="text-gray-500 text-sm">
                    Loading job posts...
                  </span>
                </div>
              ) : jobOptions.length === 0 ? (
                <div className="w-full h-12 rounded-xl border border-red-300 bg-red-50 px-4 flex items-center">
                  <span className="text-red-600 text-sm">
                    No active job posts available. Please create a job post
                    first.
                  </span>
                </div>
              ) : (
                <Dropdown
                  value={jobPostId}
                  onChange={(value) => {
                    // Value is the formatted option string
                    setJobPostId(value);
                  }}
                  options={jobOptions}
                  placeholder="Select job position"
                  className="border border-[#DFDFDF] rounded-xl"
                />
              )}
            </div>

            {/* KindTao User Selection */}
            {selectedJob && (
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Employee
                </label>
                {loadingKindtaoUsers ? (
                  <div className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 flex items-center">
                    <span className="text-gray-500 text-sm">
                      Loading employees...
                    </span>
                  </div>
                ) : kindtaoUsers.length === 0 ? (
                  <div className="w-full h-12 rounded-xl border border-yellow-300 bg-yellow-50 px-4 flex items-center">
                    <span className="text-yellow-700 text-sm">
                      No matched users found for this job. Please approve an
                      application to create a match first.
                    </span>
                  </div>
                ) : (
                  <Dropdown
                    value={kindtaoUserId}
                    onChange={setKindtaoUserId}
                    options={kindtaoUserOptions}
                    placeholder="Select employee"
                    className="border border-[#DFDFDF] rounded-xl"
                  />
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end space-x-3">
              <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleAddEmployee}>
                Add Employee
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
