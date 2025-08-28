import Image from "next/image";
import { SlLocationPin } from "react-icons/sl";

export type Job = {
  name: string;
  image: string;
  location: string;
  occupation: string;
  price: number;
};

type Props = {
  job: Job;
};

export default function JobCard({ job }: Props) {
  return (
    <div className="flex flex-col p-4 rounded-2xl bg-white border border-[#E0E6F7] transition-all w-full h-auto">
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
          <h4 className="jobh4 font-bold mb-1">{job.name}</h4>
          <div className="flex items-center gap-1">
            <SlLocationPin className="text-[#A0ABB8] text-sm" />
            <p className="text-sm !text-[#A0ABB8] pr-10 flex items-center">
              {job.location}
            </p>
          </div>
        </div>
      </div>
      <h4 className="jobh4 font-bold mb-1">{job.occupation}</h4>
      <div className="flex items-center justify-between mt-auto">
        <p>
          <span className="jobPrice text-[#CC0000]">
            ₱{job.price.toLocaleString()}
          </span>
          <span className="jobPriceP ml-1">/day</span>
        </p>
        <button className="flex items-center justify-center py-2 px-4 mr-[3px] bg-[#CC0000] text-white rounded-lg text-lg hover:bg-red-700">
          <span className="text-xs">Apply Now</span>
        </button>
      </div>
    </div>
  );
}
