"use client";

import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { JobPost } from "@/types/jobPosts";
import { format } from "date-fns";

type JobDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  job: JobPost | null;
};

export default function JobDetailsModal({
  isOpen,
  onClose,
  job,
}: JobDetailsModalProps) {
  if (!isOpen || !job) return null;

  const capitalizeSkill = (skill: string) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1).replace(/_/g, " ");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-9999" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
            <button
              onClick={onClose}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 pr-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <div className="space-y-6">
              {/* Title and Status */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {job.job_title}
                  </h3>
                  {getStatusBadge(job.status || "active")}
                </div>
                {job.is_boosted && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                    ⚡ Boosted
                  </span>
                )}
              </div>

              {/* Job Type and Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Job Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.job_type
                      ? job.job_type.charAt(0).toUpperCase() +
                        job.job_type.slice(1).replace("-", " ")
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Salary</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.salary || "Not specified"}
                    {job.salary_min && job.salary_max && (
                      <span className="text-gray-500 ml-1">
                        (₱{job.salary_min.toLocaleString()} - ₱
                        {job.salary_max.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {job.location || "Not specified"}
                </p>
                {job.province && (
                  <p className="text-xs text-gray-500 mt-1">
                    {job.province}
                    {job.region && `, ${job.region}`}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {job.job_description || "No description provided"}
                </p>
              </div>

              {/* Required Skills */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {capitalizeSkill(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Schedule */}
              {job.work_schedule && typeof job.work_schedule === "object" && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Work Schedule</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Type:</span>{" "}
                      {job.work_schedule.schedule_type
                        ? job.work_schedule.schedule_type
                            .charAt(0)
                            .toUpperCase() +
                          job.work_schedule.schedule_type.slice(1)
                        : "Not specified"}
                    </p>
                    {job.work_schedule.days &&
                      job.work_schedule.days.length > 0 && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Days:</span>{" "}
                          {job.work_schedule.days.join(", ")}
                        </p>
                      )}
                    {job.work_schedule.start_time &&
                      job.work_schedule.end_time && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Time:</span>{" "}
                          {job.work_schedule.start_time} -{" "}
                          {job.work_schedule.end_time}
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Posted</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(job.created_at)}
                  </p>
                </div>
                {job.expires_at && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Expires</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(job.expires_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
