"use client";

import Image from "next/image";
import { SlLocationPin } from "react-icons/sl";
import { JobPost } from "@/types/jobPosts";
import { salaryFormatter, salaryRateFormatter } from "@/utils/salaryFormatter";

type JobCardMobileProps = {
  job: JobPost;
  isAuthor?: boolean;
  onApply?: (job: JobPost) => void;
  onSkip?: (job: JobPost) => void;
  onViewDetails?: (job: JobPost) => void;
  isApplying?: boolean;
};

export default function JobCardMobile({
  job,
  isAuthor = false,
  onApply,
  onSkip,
  onViewDetails,
  isApplying = false,
}: JobCardMobileProps) {
  return (
    <div
      className="flex flex-col w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg"
      style={{ maxHeight: "100%" }}
    >
      {/* Header Section - Desktop style with small profile image */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-start space-x-4">
          <div className="shrink-0">
            <Image
              src="/people/darrellSteward.png" // TODO: replace with user's profile image
              alt={job.id}
              width={60}
              height={60}
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-bold text-gray-900 mb-2 truncate">
              {job.title}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <SlLocationPin className="text-gray-500 text-sm" />
              <p className="text-sm text-gray-500 truncate">{job.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {job.job_type}
              </span>
              <span className="text-sm text-gray-500">Posted 2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Expanded */}
      <div
        className="flex-1 p-4 flex flex-col justify-start overflow-y-auto"
        style={{ minHeight: "calc(100% - 120px)" }}
      >
        {/* Job Description - Enhanced and More Prominent */}
        <div className="mb-4">
          <h5 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
            Job Description
          </h5>
          <p className="text-gray-700 leading-relaxed text-base">
            {job.description || "No description provided."}
          </p>
        </div>

        {/* Key Requirements - Enhanced and More Prominent */}
        <div className="mb-4">
          <h5 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
            Key Requirements
          </h5>
          <ul className="text-base text-gray-700 space-y-2">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 shrink-0"></span>
              Experience in {job.job_type || "preferred"}
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 shrink-0"></span>
              Reliable and punctual
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 shrink-0"></span>
              Good communication skills
            </li>
          </ul>
        </div>

        {/* See Full Details Button */}
        {onViewDetails && (
          <div className="mb-4">
            <button
              onClick={() => onViewDetails(job)}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              See Full Details
            </button>
          </div>
        )}

        {/* Salary and Action Section - Desktop style at bottom */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#CC0000] mb-1">
                ₱{salaryFormatter(job.salary_max)}
              </div>
              <div className="text-sm text-gray-600">
                {salaryRateFormatter(job.salary_rate)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Range: ₱{salaryFormatter(job.salary_min)} - ₱
                {salaryFormatter(job.salary_max)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Hint */}
        <div className="text-center text-xs text-gray-500">
          <p>Swipe left to skip • Swipe right to apply</p>
        </div>
      </div>
    </div>
  );
}
