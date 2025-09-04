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
  isApplying?: boolean;
};

export default function JobCardMobile({
  job,
  isAuthor = false,
  onApply,
  onSkip,
  isApplying = false,
}: JobCardMobileProps) {
  return (
    <div className="flex flex-col max-w-md p-6 rounded-2xl bg-white border border-[#E0E6F7] w-full h-auto shadow-lg">
      {/* Title + Location */}
      <div className="text-center mb-4">
        <h4 className="text-xl font-bold mb-2 truncate">{job.title}</h4>
        {job.location && (
          <div className="flex items-center justify-center gap-1">
            <SlLocationPin className="text-[#A0ABB8] text-sm" />
            <p className="text-sm text-[#A0ABB8] truncate">{job.location}</p>
          </div>
        )}
      </div>

      {/* Big Picture */}
      <div className="w-full flex justify-center mb-4">
        <Image
          src="/people/darrellSteward.png" // TODO: replace with user's profile image
          alt={job.id}
          width={150}
          height={150}
          className="object-contain rounded-md"
        />
      </div>

      {/* Salary + Job Type */}
      <div className="text-center mb-4">
        <h4 className="text-lg font-bold mb-2 capitalize text-gray-800">
          {job.job_type}
        </h4>
        <p className="text-lg">
          <span className="font-bold text-[#CC0000]">
            ₱{salaryFormatter(job.salary_max)}
          </span>
          <span className="text-gray-600 ml-1">
            {salaryRateFormatter(job.salary_rate)}
          </span>
        </p>
      </div>

      {/* Button (still there if tapped instead of swipe) */}
      <button
        type="button"
        onClick={() => onApply?.(job)}
        disabled={isApplying}
        className={`w-full py-3 px-4 rounded-lg text-lg transition-colors ${
          isApplying
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-[#CC0000] text-white hover:bg-red-700"
        }`}
      >
        {isAuthor ? "View Details" : "Apply Now"}
      </button>
    </div>
  );
}
