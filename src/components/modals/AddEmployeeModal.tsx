"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ContinueModal from "@/components/modals/ContinueModal";
import Dropdown from "@/components/dropdown/Dropdown";
import { FaTimes } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { getJobPostsForEmployeeSelection } from "@/actions/employees/get-job-posts";
import { getKindTaoUsersForJob, KindTaoUserOption } from "@/actions/employees/get-kindtao-users-for-job";
import { JobPost } from "@/types/jobPosts";

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
  // form state
  const [kindtaoUserId, setKindtaoUserId] = useState("");
  const [jobPostTitle, setJobPostTitle] = useState(""); // For dropdown display
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title?: string;
    description?: string;
    buttonLabel?: string;
    icon?: string | null;
    onAction?: () => void;
  }>({});

  // Job posts state
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loadingJobPosts, setLoadingJobPosts] = useState(false);
  
  // KindTao users state
  const [kindtaoUsers, setKindtaoUsers] = useState<KindTaoUserOption[]>([]);
  const [loadingKindtaoUsers, setLoadingKindtaoUsers] = useState(false);

  const statusOptions = ["active", "inactive"];

  // Fetch job posts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadJobPosts();
      setKindtaoUserId("");
      setJobPostTitle("");
    }
  }, [isOpen]);

  // Fetch KindTao users when job post is selected
  useEffect(() => {
    if (jobPostTitle) {
      const selectedJob = jobPosts.find((job) => job.job_title === jobPostTitle);
      if (selectedJob) {
        loadKindTaoUsers(selectedJob.id);
        setKindtaoUserId(""); // Reset selection when job changes
      }
    } else {
      setKindtaoUsers([]);
    }
  }, [jobPostTitle, jobPosts]);

  const loadJobPosts = async () => {
    setLoadingJobPosts(true);
    try {
      const result = await getJobPostsForEmployeeSelection();
      if (result.success) {
        setJobPosts(result.jobPosts);
      } else {
        console.error("Error loading job posts:", result.error);
      }
    } catch (error) {
      console.error("Error loading job posts:", error);
    } finally {
      setLoadingJobPosts(false);
    }
  };

  const loadKindTaoUsers = async (jobId: string) => {
    setLoadingKindtaoUsers(true);
    try {
      const result = await getKindTaoUsersForJob(jobId);
      if (result.success) {
        setKindtaoUsers(result.users);
      } else {
        console.error("Error loading KindTao users:", result.error);
        setKindtaoUsers([]);
      }
    } catch (error) {
      console.error("Error loading KindTao users:", error);
      setKindtaoUsers([]);
    } finally {
      setLoadingKindtaoUsers(false);
    }
  };

  // Create job options from job posts (for dropdown display)
  const jobOptions = jobPosts.map((job) => job.job_title);
  
  // Create KindTao user options (for dropdown display)
  const kindtaoUserOptions = kindtaoUsers.map((user) => user.name);
  
  // Get selected KindTao user ID from selected name
  const selectedKindTaoUser = kindtaoUsers.find((user) => user.name === kindtaoUserId);

  const handleAddEmployee = async () => {
    const selectedJob = jobPosts.find((job) => job.job_title === jobPostTitle);
    
    if (!kindtaoUserId.trim() || !jobPostTitle.trim() || !selectedJob || !selectedKindTaoUser) {
      setModalProps({
        title: "Missing Information",
        description:
          "Please complete all required fields before adding the employee.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    try {
      const { addEmployee } = await import("@/actions/employees/add-employee");
      
      const result = await addEmployee({
        kindbossing_user_id: "", // Will be set in server action
        kindtao_user_id: selectedKindTaoUser.id,
        job_post_id: selectedJob.id,
        status: status,
      });

      if (result.success) {
      setModalProps({
        title: "Employee Added",
          description: `${selectedKindTaoUser.name} has been added to your team successfully`,
        buttonLabel: "Continue",
        icon: "/icons/checkCircleOTP.png",
        onAction: () => {
          setModalOpen(false);
          onClose();
          onEmployeeAdded?.();
        },
      });
      setModalOpen(true);
      } else {
        setModalProps({
          title: "Error",
          description: result.error || "Something went wrong while adding the employee.",
          buttonLabel: "OK",
          icon: null,
          onAction: () => setModalOpen(false),
        });
        setModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to add employee:", err);
      setModalProps({
        title: "Error",
        description: "Something went wrong while adding the employee.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
    }
  };

  const handleClose = () => {
    // Reset form
    setKindtaoUserId("");
    setJobPostTitle("");
    setStatus("active");
    setKindtaoUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  <span className="text-gray-500 text-sm">Loading job posts...</span>
                </div>
              ) : jobOptions.length === 0 ? (
                <div className="w-full h-12 rounded-xl border border-red-300 bg-red-50 px-4 flex items-center">
                  <span className="text-red-600 text-sm">
                    No active job posts available. Please create a job post first.
                  </span>
                </div>
              ) : (
              <Dropdown
                  value={jobPostTitle}
                  onChange={setJobPostTitle}
                options={jobOptions}
                placeholder="Select job position"
                className="border border-[#DFDFDF] rounded-xl"
              />
              )}
            </div>

            {/* KindTao User Selection */}
            {jobPostTitle && (
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                  Employee
              </label>
                {loadingKindtaoUsers ? (
                  <div className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 flex items-center">
                    <span className="text-gray-500 text-sm">Loading employees...</span>
                  </div>
                ) : kindtaoUsers.length === 0 ? (
                  <div className="w-full h-12 rounded-xl border border-yellow-300 bg-yellow-50 px-4 flex items-center">
                    <span className="text-yellow-700 text-sm">
                      No matched users found for this job. Please approve an application to create a match first.
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

            {/* Status */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Status
              </label>
              <Dropdown
                value={status}
                onChange={(val) => setStatus(val as "active" | "inactive")}
                options={statusOptions}
                placeholder="Select status"
                className="border border-[#DFDFDF] rounded-xl"
              />
            </div>

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

      {/* Success/Error Modal */}
      <ContinueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={modalProps.onAction ?? (() => setModalOpen(false))}
        title={modalProps.title ?? ""}
        description={modalProps.description ?? ""}
        buttonLabel={modalProps.buttonLabel ?? "OK"}
        icon={modalProps.icon ?? undefined}
      />
    </>,
    document.body
  );
}
