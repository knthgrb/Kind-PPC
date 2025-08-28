import JobCard, { Job } from "../../../../components/jobsearch/JobCard";

type Props = {
  jobs: Job[];
};

export default function JobsGrid({ jobs }: Props) {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 p-5 mt-6">
      {jobs.length > 0 ? (
        jobs.map((job, index) => <JobCard key={index} job={job} />)
      ) : (
        <p className="text-gray-500 col-span-full">No jobs found.</p>
      )}
    </div>
  );
}
