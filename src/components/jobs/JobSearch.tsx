"use client";

import { useState } from "react";
import { CiSearch, CiLocationOn } from "react-icons/ci";
import { LuBriefcaseBusiness, LuBadgeDollarSign } from "react-icons/lu";
import { IoArrowForwardCircleOutline } from "react-icons/io5";
import FilterDropdown from "../dropdown/FilterDropdown";
import Tag from "../dropdown/Tag";

export type Filters = {
  tags: string[];
  location: string;
  jobType: string;
  payType: string;
  keyword: string;
};

type Props = {
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
  onSearch: (filters: Filters) => void;
  initialFilters?: Filters;
};

type FilterDropdownProps = {
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (val: string) => void;
};

const defaultFilters: Filters = {
  tags: [],
  location: "All",
  jobType: "All",
  payType: "All",
  keyword: "",
};

export default function JobSearch({
  locations,
  jobTypes,
  payTypes,
  onSearch,
  initialFilters,
}: Props) {
  const [inputs, setInputs] = useState<Filters>(
    initialFilters ? { ...initialFilters } : { ...defaultFilters }
  );

  const updateInput = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const handleSearch = () => onSearch(inputs);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputs.keyword.trim()) {
      e.preventDefault();
      const newTag = inputs.keyword.trim();
      if (!inputs.tags.includes(newTag)) {
        updateInput("tags", [...inputs.tags, newTag]);
      }
      updateInput("keyword", "");
    } else if (e.key === "Backspace" && !inputs.keyword) {
      updateInput("tags", inputs.tags.slice(0, -1));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-4">
          {/* Search Input Section */}
          <div className="flex items-center gap-2">
            <CiSearch className="text-xl text-gray-500 flex-shrink-0" />
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {inputs.tags.map((tag, i) => (
                <Tag
                  key={i}
                  tag={tag}
                  onRemove={() =>
                    updateInput(
                      "tags",
                      inputs.tags.filter((_, index) => index !== i)
                    )
                  }
                />
              ))}
              <input
                type="text"
                value={inputs.keyword}
                onChange={(e) => updateInput("keyword", e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-32 border-none focus:outline-none text-sm placeholder-gray-400"
                placeholder={inputs.tags.length === 0 ? "Add keywords" : ""}
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex gap-2">
            <FilterDropdown
              icon={CiLocationOn}
              value={inputs.location}
              options={locations}
              onChange={(val) => updateInput("location", val)}
            />
            <FilterDropdown
              icon={LuBriefcaseBusiness}
              value={inputs.jobType}
              options={jobTypes}
              onChange={(val) => updateInput("jobType", val)}
            />
            <FilterDropdown
              icon={LuBadgeDollarSign}
              value={inputs.payType}
              options={payTypes}
              onChange={(val) => updateInput("payType", val)}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="w-full bg-[#CC0000] hover:bg-red-700 text-white text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            Search
            <IoArrowForwardCircleOutline className="text-white text-lg" />
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center gap-2 min-w-0">
          {/* Search icon */}
          <CiSearch className="text-xl text-gray-500 flex-shrink-0" />

          {/* Tags + Input */}
          <div className="flex flex-wrap gap-2 flex-1 min-w-0">
            {inputs.tags.map((tag, i) => (
              <Tag
                key={i}
                tag={tag}
                onRemove={() =>
                  updateInput(
                    "tags",
                    inputs.tags.filter((_, index) => index !== i)
                  )
                }
              />
            ))}

            <input
              type="text"
              value={inputs.keyword}
              onChange={(e) => updateInput("keyword", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-80 border-none focus:outline-none text-sm placeholder-gray-400"
              placeholder={inputs.tags.length === 0 ? "Add keywords" : ""}
            />
          </div>

          {/* Filters */}
          <FilterDropdown
            icon={CiLocationOn}
            value={inputs.location}
            options={locations}
            onChange={(val) => updateInput("location", val)}
          />
          <FilterDropdown
            icon={LuBriefcaseBusiness}
            value={inputs.jobType}
            options={jobTypes}
            onChange={(val) => updateInput("jobType", val)}
          />
          <FilterDropdown
            icon={LuBadgeDollarSign}
            value={inputs.payType}
            options={payTypes}
            onChange={(val) => updateInput("payType", val)}
          />

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="bg-[#CC0000] hover:bg-red-700 text-white text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 flex-shrink-0"
          >
            Search
            <IoArrowForwardCircleOutline className="text-white text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
