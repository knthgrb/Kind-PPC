"use client";

import { useState } from "react";
import { JobPost } from "@/types/jobPosts";
import { FaTimes, FaUser, FaClock, FaMapMarkerAlt, FaEdit } from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import { getWorkScheduleSummary } from "@/utils/workScheduleFormatter";
import PostJobModal from "@/components/modals/PostJobModal";

const formatJobType = (jobType?: string | null) => {
  if (!jobType) return "";
  const cleaned = jobType.replace(/_/g, " ").toLowerCase();
  return cleaned
    .split(" ")
    .map((word) =>
      word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
};

type JobDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  job: JobPost | null;
  familyId: string;
  onJobEdited: () => void;
};

export default function JobDetailsModal({
  isOpen,
  onClose,
  job,
  familyId,
  onJobEdited,
}: JobDetailsModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  if (!isOpen || !job) return null;

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleEditClose = () => {
    setIsEditMode(false);
  };

  const handleEditComplete = () => {
    setIsEditMode(false);
    onJobEdited();
    onClose();
  };

  if (isEditMode) {
    return (
      <PostJobModal
        isOpen={true}
        onClose={handleEditClose}
        familyId={familyId}
        onJobPosted={handleEditComplete}
        editingJob={job}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-2 md:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">
            {job.job_title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors flex items-center gap-2 text-sm text-gray-700 font-medium"
            >
              <FaEdit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors"
            >
              <FaTimes className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto rounded-b-2xl">
          <div className="p-4 md:p-6">
            {/* Job Header */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center text-gray-600 mb-2">
                  <SlLocationPin className="text-[#A0ABB8] text-lg mr-2" />
                  <span className="text-lg font-medium">{job.location}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FaUser className="mr-1" />
                    {formatJobType(job.job_type)}
                  </span>
                  <span className="flex items-center">
                    <FaClock className="mr-1" />
                    Posted{" "}
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#CC0000] mb-1">
                  ₱{job.salary}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {job.salary_type || formatJobType(job.job_type)}
                </div>
              </div>
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Job Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {job.job_description || "No description provided."}
                </p>
              </div>

              {/* Job Requirements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Requirements
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {job.required_skills && job.required_skills.length > 0 ? (
                    job.required_skills.map((skill, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 shrink-0"></span>
                        <span className="capitalize">
                          {skill.replace(/_/g, " ")}
                        </span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 shrink-0"></span>
                        Experience in {formatJobType(job.job_type)} preferred
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 shrink-0"></span>
                        Reliable and punctual
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 shrink-0"></span>
                        Good communication skills
                      </li>
                    </>
                  )}
                  {job.required_years_of_experience !== undefined &&
                    job.required_years_of_experience > 0 && (
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-[#CC0000] rounded-full mt-2 mr-3 shrink-0"></span>
                        {job.required_years_of_experience} years of experience
                        required
                      </li>
                    )}
                </ul>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Job Type</h4>
                <p className="text-gray-700 capitalize">
                  {formatJobType(job.job_type)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                <p className="text-gray-700 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-gray-400" />
                  {job.location}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Salary</h4>
                <p className="text-gray-700">
                  ₱{job.salary} {job.salary_type ? `(${job.salary_type})` : ""}
                </p>
              </div>
              {job.work_schedule && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Work Schedule
                  </h4>
                  <p className="text-gray-700">
                    {getWorkScheduleSummary(job.work_schedule)}
                  </p>
                </div>
              )}
              {job.preferred_languages &&
                job.preferred_languages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Preferred Languages
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {job.preferred_languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

