"use client";

import { useState } from "react";
import JobCard, { Job } from "../../../../components/jobs/JobCardTest";
import JobSearch, { Filters } from "../../../../components/jobs/JobSearch";
import { FaArrowRight } from "react-icons/fa6";
import { useJobs } from "../../../../hooks/useJobs"; // <--- new hook

type Props = {
  latestJobs: Job[];
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
};

export default function JobsGrid({
  latestJobs,
  locations,
  jobTypes,
  payTypes,
}: Props) {
  const [filters, setFilters] = useState<Filters>({
    tags: [],
    location: "All",
    jobType: "All",
    payType: "All",
    keyword: "",
  });

  const filteredJobs = useJobs(latestJobs, filters);

  return (
    <section className="px-4">
      <div className="max-w-[1100px] mx-auto">
        <JobSearch
          locations={locations}
          jobTypes={jobTypes}
          payTypes={payTypes}
          onSearch={setFilters}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 p-5 mt-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => <JobCard key={job.name} job={job} />)
          ) : (
            <p className="text-gray-500 col-span-full">No jobs found.</p>
          )}
        </div>

        <div className="flex justify-center w-full my-8">
          <button className="py-3 px-8 bg-white text-[#CC0000] border border-[#CC0000] rounded-lg hover:bg-[#CC0000] hover:text-white w-full sm:w-auto">
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
