import { useMemo } from "react";
import { Job } from "@/components/jobsearch/JobCard";
import { Filters } from "@/components/jobsearch/JobSearch";
export function useJobs(latestJobs: Job[], filters: Filters) {
  // Local filtering for now
  const jobs = useMemo(() => {
    return latestJobs.filter((job) => {
      const text =
        `${job.name} ${job.occupation} ${job.location} ${job.price}`.toLowerCase();

      return (
        filters.tags.every((tag) => text.includes(tag.toLowerCase())) &&
        (filters.location === "All" || job.location === filters.location) &&
        (filters.jobType === "All" || job.occupation === filters.jobType) &&
        (filters.payType === "All" || filters.payType === "Fixed") // placeholder
      );
    });
  }, [latestJobs, filters]);

  return jobs;
}
