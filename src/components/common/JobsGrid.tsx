"use client";

import JobSearch, { Filters } from "@/app/jobs/_components/JobSearch";
import { FaArrowRight } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { JobPost } from "@/types/jobPosts";
import JobCard from "@/app/jobs/_components/JobCard";

type Props = {
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
  latestJobs: JobPost[];
};

export default function JobsGrid({
  locations,
  jobTypes,
  payTypes,
  latestJobs,
}: Props) {
  const router = useRouter();

  const handleSearch = (searchFilters: Filters) => {
    // Build search params
    const params = new URLSearchParams();

    if (searchFilters.keyword) {
      params.set("keyword", searchFilters.keyword);
    }
    if (searchFilters.location && searchFilters.location !== "All") {
      params.set("location", searchFilters.location);
    }
    if (searchFilters.jobType && searchFilters.jobType !== "All") {
      params.set("jobType", searchFilters.jobType);
    }
    if (searchFilters.payType && searchFilters.payType !== "All") {
      params.set("payType", searchFilters.payType);
    }
    if (searchFilters.tags.length > 0) {
      params.set("tags", searchFilters.tags.join(","));
    }

    // Route to /recs with search params
    const queryString = params.toString();
    router.push(`/recs${queryString ? `?${queryString}` : ""}`);
  };

  const handleViewAll = () => {
    // Route to /recs with no filters
    router.push("/recs");
  };

  return (
    <section className="px-4">
      <div>
        <JobSearch
          locations={locations}
          jobTypes={jobTypes}
          payTypes={payTypes}
          onSearch={handleSearch}
        />

        {/* Latest Jobs Grid */}
        {latestJobs.length > 0 && (
          <div className="max-w-7xl mx-auto mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onAction={() => {
                    // Apply in background (no navigation)
                    // NOTE: JobsGrid may not have user context here; consider wiring if needed
                    // For now, no navigation
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center w-full my-8">
          <button
            onClick={handleViewAll}
            className="py-3 px-8 cursor-pointer bg-white text-[#CC0000] border border-[#CC0000] rounded-lg hover:bg-[#CC0000] hover:text-white w-full sm:w-auto"
          >
            <span className="flex items-center gap-2 text-sm !font-bold justify-center">
              View All
              <FaArrowRight />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
