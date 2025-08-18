import Image from "next/image";

type Job = {
  name: string;
  image: string;
  location: string;
  occupation: string;
  price: number;
};

type Props = {
  jobs: Job[];
};

export default function LatestJobsCardGrid({ jobs }: Props) {
  return (
    <div className="max-w-7xl bg-white mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-[20px]">
      {jobs.length > 0 ? (
        jobs.map((job, index) => (
          <div
            key={index}
            className="flex flex-col p-4 rounded-2xl bg-white border border-[#E6E7E9] hover:border-gray-400 transition-all w-full h-auto"
          >
            <div className="flex items-center mb-3">
              <div className="mr-4">
                <Image
                  src={job.image}
                  alt={job.name}
                  width={50}
                  height={50}
                  className="object-contain rounded-md"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="jobh3 font-bold mb-1">{job.name}</h4>
                <p className="jobp pr-10 flex items-center">{job.location}</p>
              </div>
            </div>
            <h4 className="jobh3 font-bold mb-1">{job.occupation}</h4>
            <div className="flex items-center justify-between mt-auto">
              <p>
                <span className="jobPrice text-[#CC0000]">
                  ₱{job.price.toLocaleString()}
                </span>
                <span className="jobPriceP ml-1">/day</span>
              </p>
              <button className="py-1 px-4 mr-[3px] bg-[#CC0000] text-white rounded-lg text-lg hover:bg-red-700">
                <span className="text-xs">Apply Now</span>
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 col-span-full">No jobs found.</p>
      )}
    </div>
  );
}
