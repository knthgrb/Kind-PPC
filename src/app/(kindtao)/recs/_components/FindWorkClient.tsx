"use client";

import { JobPost } from "@/types/jobPosts";
import DesktopLayout from "./DesktopLayout";

interface FindWorkClientProps {
  initialJobs: JobPost[];
  initialMatchingScores: any[];
  provinces: string[];
  jobTypes: string[];
  initialFilters: any;
  initialSwipeLimit: any;
  currentPlan: string;
}

export default function FindWorkClient({
  initialJobs,
  initialMatchingScores,
  provinces,
  jobTypes,
  initialFilters,
  initialSwipeLimit,
  currentPlan,
}: FindWorkClientProps) {
  return (
    <div className="bg-gray-50 overflow-hidden h-[calc(100vh-8vh)]">
      <DesktopLayout
        initialJobs={initialJobs}
        initialMatchingScores={initialMatchingScores}
        provinces={provinces}
        jobTypes={jobTypes}
        pageSize={20}
        initialFilters={initialFilters}
        initialSwipeLimit={initialSwipeLimit}
        currentPlan={currentPlan}
      />
    </div>
  );
}
