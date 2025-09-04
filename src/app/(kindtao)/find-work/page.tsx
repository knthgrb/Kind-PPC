import { fetchJobs, fetchJobFilterOptions } from "@/services/jobs/fetchJobs";
import JobsCarousel from "./_components/JobsCarousel";
import JobSwipeWrapper from "./_components/JobSwipeWrapper";

const PAGE_SIZE = 20;

export default async function FindWorkPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const filters = {
    location: searchParams.location || "All",
    jobType: searchParams.jobType || "All",
    payType: searchParams.payType || "All",
    keyword: searchParams.keyword || "",
    tags: searchParams.tags ? searchParams.tags.split(",") : [],
    limit: PAGE_SIZE,
  };

  // Create initialFilters from searchParams for the search component
  const initialFilters = {
    tags: searchParams.tags ? searchParams.tags.split(",") : [],
    location: searchParams.location || "All",
    jobType: searchParams.jobType || "All",
    payType: searchParams.payType || "All",
    keyword: searchParams.keyword || "",
  };

  const [jobs, filterOptions] = await Promise.all([
    fetchJobs(filters),
    fetchJobFilterOptions(),
  ]);

  return (
    <section>
      {/* Mobile swipe */}
      <div className="block sm:hidden">
        <JobSwipeWrapper
          initialJobs={jobs}
          pageSize={PAGE_SIZE}
          locations={filterOptions.locations}
          jobTypes={filterOptions.jobTypes}
          payTypes={filterOptions.payTypes}
          initialFilters={initialFilters}
        />
      </div>

      {/* Desktop carousel */}
      <div className="hidden sm:block">
        <JobsCarousel
          jobs={jobs}
          locations={filterOptions.locations}
          jobTypes={filterOptions.jobTypes}
          payTypes={filterOptions.payTypes}
          initialFilters={initialFilters}
        />
      </div>
    </section>
  );
}
