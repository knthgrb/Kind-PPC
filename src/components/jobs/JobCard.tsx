import Image from "next/image";
import { SlLocationPin } from "react-icons/sl";
import { JobPost } from "@/types/jobPosts";
import { salaryFormatter, salaryRateFormatter } from "@/utils/salaryFormatter";

type JobCardProps = {
  job: JobPost;
  isAuthor?: boolean;
  onAction?: () => void;
};

export default function JobCard({
  job,
  isAuthor = false,
  onAction,
}: JobCardProps) {
  return (
    <div className="flex flex-col p-4 rounded-2xl bg-white border border-[#E0E6F7] transition-all w-full h-auto">
      <div className="flex mb-3">
        <div className="mr-4 flex-shrink-0">
          <Image
            src="/people/darrellSteward.png" //TODO: replace with user's profile image
            alt={job.id}
            width={50}
            height={50}
            className="object-contain rounded-md"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="jobh3 font-bold mb-1 truncate max-w-[200px]">
            {job.title}
          </h4>

          {job.location && (
            <div className="flex items-center gap-1">
              <SlLocationPin className="text-[#A0ABB8] text-sm" />
              <p className="text-sm !text-[#A0ABB8] pr-10 truncate max-w-[150px]">
                {job.location}
              </p>
            </div>
          )}
        </div>
      </div>

      <h4 className="jobh4 font-bold mb-1 truncate max-w-full capitalize">
        {job.job_type}
      </h4>

      <div className="flex items-center justify-between mt-auto">
        <p>
          <span className="jobPrice text-[#CC0000]">
            ₱{salaryFormatter(job.salary_max)}
          </span>
          <span className="jobPriceP">
            {salaryRateFormatter(job.salary_rate)}
          </span>
        </p>
        <button
          type="button"
          onClick={onAction}
          className="flex items-center justify-center py-2 px-4 bg-[#CC0000] text-white rounded-lg text-lg hover:bg-red-700"
        >
          {isAuthor ? (
            <span className="text-[10px]">View Details</span>
          ) : (
            <span className="text-[10px]">Apply Now</span>
          )}
        </button>
      </div>
    </div>
  );
}
