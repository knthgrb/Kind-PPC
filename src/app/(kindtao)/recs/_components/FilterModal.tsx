"use client";

import { useState, useEffect, useRef } from "react";
import { CiSearch, CiLocationOn } from "react-icons/ci";
import { LuBriefcaseBusiness } from "react-icons/lu";
import { IoArrowForwardCircleOutline } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import { JobService } from "@/services/client/JobService";
import FilterDropdown from "@/components/dropdown/FilterDropdown";

export type Filters = {
  search: string;
  province: string;
  radius: number;
  jobType: string;
};

type FilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  provinces: string[];
  jobTypes: string[];
  initialFilters?: Filters;
};

const defaultFilters: Filters = {
  search: "",
  province: "All",
  radius: 50,
  jobType: "All",
};

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  provinces,
  jobTypes,
  initialFilters,
}: FilterModalProps) {
  const [inputs, setInputs] = useState<Filters>(
    initialFilters ? { ...initialFilters } : { ...defaultFilters }
  );
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update inputs when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setInputs({ ...initialFilters });
    }
  }, [initialFilters]);

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen && initialFilters) {
      setInputs({ ...initialFilters });
    }
  }, [isOpen, initialFilters]);

  const updateInput = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply(inputs);
    onClose();
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    updateInput("search", searchTerm);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const jobs = await JobService.fetchJobsClient({
          search: searchTerm,
          limit: 10,
        });

        // Extract unique job titles for suggestions
        const suggestions = Array.from(
          new Set(jobs.map((job) => job.job_title))
        ).slice(0, 5);

        setSearchResults(suggestions);
      } catch (error) {
        console.error("Error searching jobs:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchResultClick = (result: string) => {
    updateInput("search", result);
    setShowSearchResults(false);
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow clicks on results
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Filter Jobs</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Search Input Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Search Jobs
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-3">
                  <CiSearch className="text-xl text-gray-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={inputs.search}
                    onChange={handleSearchChange}
                    onBlur={handleSearchBlur}
                    onFocus={() =>
                      inputs.search.length >= 2 && setShowSearchResults(true)
                    }
                    className="flex-1 border-none focus:outline-none text-sm placeholder-gray-400"
                    placeholder="Search by job title, description, or skills..."
                  />
                  {isSearching && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <CiSearch className="text-gray-400 text-sm" />
                            <span className="truncate">{result}</span>
                          </div>
                        </button>
                      ))
                    ) : inputs.search.length >= 2 && !isSearching ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No matching jobs found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Province
                </label>
                <FilterDropdown
                  icon={CiLocationOn}
                  value={inputs.province}
                  options={provinces}
                  onChange={(val) => updateInput("province", val)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Search Radius (km)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={inputs.radius}
                    onChange={(e) =>
                      updateInput("radius", parseInt(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                    {inputs.radius} km
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Job Type
                </label>
                <FilterDropdown
                  icon={LuBriefcaseBusiness}
                  value={inputs.jobType}
                  options={[
                    "All",
                    "Hourly",
                    "Daily",
                    "Contractual",
                    "Full-time",
                    "Part-time",
                    "Freelance",
                    "Temporary",
                    "Permanent",
                  ]}
                  onChange={(val) => updateInput("jobType", val)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 bg-[#CC0000] hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Apply Filters
              <IoArrowForwardCircleOutline className="text-white text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
