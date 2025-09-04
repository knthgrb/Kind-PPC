"use client";

import JobCard from "@/components/jobs/JobCard";
import Pagination from "@/components/Pagination";
import { JobPost } from "@/types/jobPosts";
import { useRouter } from "next/navigation";

type PostedJobsGridProps = {
  jobs: JobPost[];
  familyId: string;
  page: number;
  totalPages: number;
};

export default function PostedJobsGrid({
  jobs,
  familyId,
  page,
  totalPages,
}: PostedJobsGridProps) {
  const router = useRouter();

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isAuthor={true}
              onAction={() => router.push(`/jobs/kindbossing/${job.id}`)}
            />
          ))
        ) : (
          <p className="text-gray-500 col-span-full">No jobs found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(newPage) => router.push(`?page=${newPage}`)}
          />
        </div>
      )}
    </div>
  );
}
