"use client";
import { useState } from "react";
import JobCard from "../../../../components/jobs/JobCard";
import { JobPost } from "@/types/jobPosts";
import Pagination from "@/components/Pagination";

type Props = {
  jobs: JobPost[];
};

export default function JobsGrid({ jobs }: Props) {
  const [page, setPage] = useState(1);
  const jobsPerPage = 8;

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const start = (page - 1) * jobsPerPage;
  const end = start + jobsPerPage;
  const currentJobs = jobs.slice(start, end);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Jobs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {currentJobs.length > 0 ? (
          currentJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <p className="text-gray-500 col-span-full">No jobs found.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
