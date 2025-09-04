"use client";

import { JobPost } from "@/types/jobPosts";
import { Filters } from "@/components/jobs/JobSearch";
import JobSwipe from "./JobSwipe";

type JobSwipeWrapperProps = {
  initialJobs: JobPost[];
  pageSize: number;
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
  initialFilters?: Filters;
};

export default function JobSwipeWrapper({
  initialJobs,
  pageSize,
  locations,
  jobTypes,
  payTypes,
  initialFilters,
}: JobSwipeWrapperProps) {
  const handleApply = (job: JobPost) => {
    console.log("Apply:", job);
    // TODO: Implement actual apply logic
    // This could be:
    // - Save to user's applied jobs
    // - Send notification to job poster
    // - Navigate to application form
  };

  const handleSkip = (job: JobPost) => {
    console.log("Skip:", job);
    // TODO: Implement actual skip logic
    // This could be:
    // - Save to user's skipped jobs
    // - Update recommendation algorithm
    // - Track user preferences
  };

  return (
    <JobSwipe
      initialJobs={initialJobs}
      pageSize={pageSize}
      locations={locations}
      jobTypes={jobTypes}
      payTypes={payTypes}
      initialFilters={initialFilters}
      onApply={handleApply}
      onSkip={handleSkip}
    />
  );
}
