"use client";

import { useState } from "react";
import { CiSearch, CiLocationOn } from "react-icons/ci";
import { LuBriefcaseBusiness, LuBadgeDollarSign } from "react-icons/lu";
import { IoArrowForwardCircleOutline } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa6";
import LatestJobsCardGrid from "./LatestJobsCardGrid";

type Job = {
  name: string;
  image: string;
  location: string;
  occupation: string;
  price: number;
};

type Props = {
  latestJobs: Job[];
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
};

const defaultFilters = {
  tags: [] as string[],
  location: "All",
  jobType: "All",
  payType: "All",
  keyword: "",
};

export default function LatestJobs({
  latestJobs,
  locations,
  jobTypes,
  payTypes,
}: Props) {
  const [inputs, setInputs] = useState({ ...defaultFilters });
  const [filters, setFilters] = useState({ ...defaultFilters });

  const handleSearch = () => {
    setFilters(inputs);
  };

  const updateInput = (key: keyof typeof inputs, value: any) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const filteredJobs = latestJobs.filter((job) => {
    const text = `${job.name} ${job.occupation} ${job.location} ${job.price}`.toLowerCase();

    return (
      filters.tags.every((tag) => text.includes(tag.toLowerCase())) &&
      (filters.location === "All" || job.location === filters.location) &&
      (filters.jobType === "All" || job.occupation === filters.jobType) &&
      (filters.payType === "All" || filters.payType === "Fixed") // Placeholder logic
    );
  });

  return (
    <section className="bg-white px-4">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-stretch w-full gap-0">
          <div className="bg-white border border-gray-200 rounded-l-lg flex flex-wrap items-center justify-between gap-4 p-6 flex-1">

            {/* Tags Input */}
            <div className="flex items-center flex-wrap gap-2 flex-1 min-w-[200px]">
              <CiSearch className="text-xl" />
              {inputs.tags.map((tag, i) => (
                <div
                  key={i}
                  className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    className="ml-1 text-gray-600 hover:text-red-500"
                    onClick={() =>
                      updateInput(
                        "tags",
                        inputs.tags.filter((_, index) => index !== i)
                      )
                    }
                  >
                    &times;
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={inputs.keyword}
                onChange={(e) => updateInput("keyword", e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && inputs.keyword.trim()) {
                    e.preventDefault();
                    if (!inputs.tags.includes(inputs.keyword.trim())) {
                      updateInput("tags", [...inputs.tags, inputs.keyword.trim()]);
                    }
                    updateInput("keyword", "");
                  } else if (e.key === "Backspace" && !inputs.keyword) {
                    updateInput("tags", inputs.tags.slice(0, -1));
                  }
                }}
                className="flex-1 border-none focus:outline-none text-sm min-w-[100px] placeholder-gray-400"
                placeholder={inputs.tags.length === 0 ? "Add keywords" : ""}
              />
            </div>

            {/* Select Filters */}
            <FilterSelect
              icon={CiLocationOn}
              value={inputs.location}
              options={locations}
              onChange={(e) => updateInput("location", e.target.value)}
            />
            <FilterSelect
              icon={LuBriefcaseBusiness}
              value={inputs.jobType}
              options={jobTypes}
              onChange={(e) => updateInput("jobType", e.target.value)}
            />
            <FilterSelect
              icon={LuBadgeDollarSign}
              value={inputs.payType}
              options={payTypes}
              onChange={(e) => updateInput("payType", e.target.value)}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="bg-[#CC0000] hover:bg-red-700 text-white text-sm px-6 py-3 rounded-r-lg flex items-center gap-2"
          >
            Search
            <IoArrowForwardCircleOutline className="text-white" />
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      <LatestJobsCardGrid jobs={filteredJobs} />

      <div className="flex justify-center w-full my-8">
        <button className="py-3 px-8 bg-white text-[#CC0000] border-1 border-[#CC0000] rounded-lg hover:bg-[#CC0000] hover:text-white w-full sm:w-auto">
          <span className="flex items-center gap-2 text-sm !font-bold">View All<FaArrowRight /></span>
        </button>
      </div>
    </section>
  );
}

type FilterSelectProps = {
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

function FilterSelect({ icon: Icon, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <Icon className="text-gray-500" />
      <select
        value={value}
        onChange={onChange}
        className="bg-transparent flex-1 text-sm focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
