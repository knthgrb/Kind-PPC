"use client";

import { useState } from "react";
import { CiSearch, CiLocationOn } from "react-icons/ci";
import { LuBriefcaseBusiness, LuBadgeDollarSign } from "react-icons/lu";
import { IoArrowForwardCircleOutline } from "react-icons/io5";
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

export default function LatestJobs({
  latestJobs,
  locations,
  jobTypes,
  payTypes,
}: Props) {
  // Input state (temporary while editing)
  const [input, setInput] = useState("");
  const [inputTags, setInputTags] = useState<string[]>([]);
  const [inputLocation, setInputLocation] = useState("All");
  const [inputJobType, setInputJobType] = useState("All");
  const [inputPayType, setInputPayType] = useState("All");

  // Filter state (applied only on search)
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterJobType, setFilterJobType] = useState("All");
  const [filterPayType, setFilterPayType] = useState("All");

  const handleSearch = () => {
    setFilterTags(inputTags);
    setFilterLocation(inputLocation);
    setFilterJobType(inputJobType);
    setFilterPayType(inputPayType);
  };

  const filteredJobs = latestJobs.filter((job) => {
    const searchable = `${job.name} ${job.occupation} ${job.location} ${job.price}`.toLowerCase();
    const matchesTags = filterTags.every((tag) =>
      searchable.includes(tag.toLowerCase())
    );
    const matchesLocation =
      filterLocation === "All" || job.location === filterLocation;
    const matchesJobType =
      filterJobType === "All" || job.occupation === filterJobType;
    const matchesPayType = filterPayType === "All" || filterPayType === "Fixed"; // Simulated
    return matchesTags && matchesLocation && matchesJobType && matchesPayType;
  });

  return (
    <section className="bg-white px-4">
      <div className="max-w-[1150px] mx-auto">
        <div className="flex items-stretch w-full gap-0">
          <div className="bg-white border border-gray-200 rounded-l-lg flex flex-wrap items-center justify-between gap-4 px-4 flex-1">
            {/* Tags input */}
            <div className="flex items-center flex-wrap gap-2 flex-1 min-w-[200px]">
              <CiSearch className="text-gray-500 text-xl" />
              {inputTags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    className="ml-1 text-gray-600 hover:text-red-500"
                    onClick={() =>
                      setInputTags((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    &times;
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && input.trim()) {
                    e.preventDefault();
                    if (!inputTags.includes(input.trim())) {
                      setInputTags([...inputTags, input.trim()]);
                    }
                    setInput("");
                  } else if (e.key === "Backspace" && !input) {
                    setInputTags((prev) => prev.slice(0, -1));
                  }
                }}
                className="flex-1 border-none focus:outline-none text-sm min-w-[100px] placeholder-gray-400"
                placeholder={inputTags.length === 0 ? "Add keywords" : ""}
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 flex-1">
              <CiLocationOn className="text-gray-500" />
              <select
                value={inputLocation}
                onChange={(e) => setInputLocation(e.target.value)}
                className="bg-transparent flex-1 text-sm focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Type */}
            <div className="flex items-center gap-2 flex-1">
              <LuBriefcaseBusiness className="text-gray-500" />
              <select
                value={inputJobType}
                onChange={(e) => setInputJobType(e.target.value)}
                className="bg-transparent flex-1 text-sm focus:outline-none"
              >
                {jobTypes.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>
            </div>

            {/* Pay Type */}
            <div className="flex items-center gap-2 flex-1">
              <LuBadgeDollarSign className="text-gray-500" />
              <select
                value={inputPayType}
                onChange={(e) => setInputPayType(e.target.value)}
                className="bg-transparent flex-1 text-sm focus:outline-none"
              >
                {payTypes.map((pay) => (
                  <option key={pay} value={pay}>
                    {pay}
                  </option>
                ))}
              </select>
            </div>
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
    </section>
  );
}