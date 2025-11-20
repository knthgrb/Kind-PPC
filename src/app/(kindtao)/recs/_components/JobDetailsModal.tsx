"use client";

import { IoCloseOutline } from "react-icons/io5";
import { MatchedJob } from "@/services/JobMatchingService";
import { formatWorkSchedule } from "@/utils/workScheduleFormatter";
import { formatJobType } from "@/utils/jobTypeFormatter";

interface JobDetailsModalProps {
  job: MatchedJob;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
}: JobDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900">
            {job.job_title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Location and Match Score */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-500">Location:</span>{" "}
                <span className="text-sm font-medium text-gray-900">
                  {job.location}
                </span>
              </div>
              {job.matchScore && (
                <div>
                  <span className="text-sm text-gray-500">Match:</span>{" "}
                  <span className="text-sm font-medium text-green-600">
                    {Math.round(job.matchScore)}%
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {job.job_description || "No description available"}
              </p>
            </div>

            {/* Salary and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Salary
                </h4>
                <p className="text-sm text-gray-600">
                  {job.salary || "Not specified"}
                </p>
              </div>
              {job.job_type && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Type
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatJobType(job.job_type)}
                  </p>
                </div>
              )}
            </div>

            {/* Skills Required */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Skills Required
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional job details if available */}
            {job.work_schedule &&
              (() => {
                const formattedSchedule = formatWorkSchedule(job.work_schedule);
                return formattedSchedule ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Work Schedule
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formattedSchedule.summary ||
                        formattedSchedule.hours ||
                        JSON.stringify(job.work_schedule)}
                    </p>
                  </div>
                ) : null;
              })()}

            {job.required_years_of_experience > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Experience Required
                </h4>
                <p className="text-sm text-gray-600">
                  {job.required_years_of_experience}{" "}
                  {job.required_years_of_experience === 1 ? "year" : "years"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
