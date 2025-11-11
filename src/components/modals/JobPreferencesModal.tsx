"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { JobPreferencesService } from "@/services/client/JobPreferencesService";
import { useToastStore } from "@/stores/useToastStore";
import { JOB_CATEGORIES } from "@/constants/jobCategories";

interface JobPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: JobPreferences) => void;
  initialPreferences?: JobPreferences;
}

export interface JobPreferences {
  desiredJobs: string[];
  desiredLocations: string[];
  desiredJobTypes: string[];
  salaryRange: {
    min: number;
    max: number;
    salaryType: "daily" | "monthly" | "hourly" | "one-time";
  };
  preferredLanguages: string[];
  preferredWorkRadiusKm: number;
}

export const PHILIPPINE_REGIONS = [
  "All Philippines",
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "Calabarzon (Region IV-A)",
  "Mimaropa (Region IV-B)",
  "Bicol Region (Region V)",
  "Western Visayas (Region VI)",
  "Central Visayas (Region VII)",
  "Eastern Visayas (Region VIII)",
  "Zamboanga Peninsula (Region IX)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "Soccsksargen (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
];

export const JOB_TYPES = [
  "one-time",
  "full-time",
  "part-time",
  "contract",
  "temporary",
];

export const SALARY_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "hourly", label: "Hourly" },
  { value: "one-time", label: "One Time" },
];

export const LANGUAGES = [
  "English",
  "Filipino/Tagalog",
  "Cebuano",
  "Ilocano",
  "Hiligaynon",
  "Bicolano",
  "Waray",
  "Kapampangan",
  "Pangasinan",
  "Tausug",
  "Maguindanao",
  "Maranao",
  "Chinese (Mandarin)",
  "Chinese (Cantonese)",
  "Japanese",
  "Korean",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Other",
];

export default function JobPreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: JobPreferencesModalProps) {
  const [preferences, setPreferences] = useState<JobPreferences>({
    desiredJobs: [],
    desiredLocations: [],
    desiredJobTypes: [],
    salaryRange: {
      min: 0,
      max: 0,
      salaryType: "daily",
    },
    preferredLanguages: [],
    preferredWorkRadiusKm: 10,
  });

  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToastStore();

  // Fetch job preferences when modal opens
  useEffect(() => {
    if (isOpen && !initialPreferences) {
      fetchJobPreferences();
    } else if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [isOpen, initialPreferences]);

  const fetchJobPreferences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await JobPreferencesService.getJobPreferences();
      if (error) {
        showError("Error", "Failed to load job preferences. Please try again.");
        console.error("Error fetching job preferences:", error);
      } else if (data) {
        setPreferences(data);
      }
    } catch (error) {
      showError("Error", "Failed to load job preferences. Please try again.");
      console.error("Error fetching job preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJob = (job: string) => {
    setPreferences((prev) => ({
      ...prev,
      desiredJobs: prev.desiredJobs.includes(job)
        ? prev.desiredJobs.filter((j) => j !== job)
        : [...prev.desiredJobs, job],
    }));
  };

  const toggleLocation = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      desiredLocations: prev.desiredLocations.includes(location)
        ? prev.desiredLocations.filter((l) => l !== location)
        : [...prev.desiredLocations, location],
    }));
  };

  const toggleJobType = (jobType: string) => {
    setPreferences((prev) => ({
      ...prev,
      desiredJobTypes: prev.desiredJobTypes.includes(jobType)
        ? prev.desiredJobTypes.filter((jt) => jt !== jobType)
        : [...prev.desiredJobTypes, jobType],
    }));
  };

  const toggleLanguage = (language: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredLanguages: prev.preferredLanguages.includes(language)
        ? prev.preferredLanguages.filter((l) => l !== language)
        : [...prev.preferredLanguages, language],
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);

    // Validate that at least one job type is selected
    if (preferences.desiredJobTypes.length === 0) {
      setValidationError("Please select at least one job type.");
      return;
    }

    setIsSaving(true);
    try {
      const { success, error } =
        await JobPreferencesService.updateJobPreferences(preferences);
      if (success) {
        showSuccess("Success", "Job preferences saved successfully!");
        onSave(preferences);
        onClose();
      } else {
        showError(
          "Error",
          error || "Failed to save job preferences. Please try again."
        );
      }
    } catch (error) {
      showError("Error", "Failed to save job preferences. Please try again.");
      console.error("Error saving job preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Job Preferences</h2>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading && (
            <div className="space-y-6">
              {/* Skeleton for Desired Jobs */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg">
                      <div className="p-4 flex items-center justify-between">
                        <div className="h-5 bg-gray-200 rounded w-40"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton for Desired Locations */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton for Job Types */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-36 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border-2 border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton for Salary Range */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton for Preferred Languages */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton for Work Radius */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-80 mb-4"></div>
                <div className="max-w-xs">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Desired Jobs */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Desired Jobs
                </h3>
                <div className="space-y-4">
                  {Object.entries(JOB_CATEGORIES).map(([category, jobs]) => (
                    <div
                      key={category}
                      className="border border-gray-200 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">
                          {category}
                        </span>
                        <span
                          className={`transform transition-transform ${
                            expandedCategories[category] ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                      </button>

                      {expandedCategories[category] && (
                        <div className="p-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {jobs.map((job) => (
                              <label
                                key={job}
                                className="flex items-center space-x-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={preferences.desiredJobs.includes(
                                    job
                                  )}
                                  onChange={() => toggleJob(job)}
                                  className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                                />
                                <span className="text-sm text-gray-700">
                                  {job}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Desired Locations */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Desired Locations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PHILIPPINE_REGIONS.map((location) => (
                    <label
                      key={location}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.desiredLocations.includes(
                          location
                        )}
                        onChange={() => toggleLocation(location)}
                        className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                      />
                      <span className="text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Desired Job Types */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Desired Job Types <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select the types of work arrangements you're interested in
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {JOB_TYPES.map((jobType) => (
                    <label
                      key={jobType}
                      className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                        preferences.desiredJobTypes.includes(jobType)
                          ? "border-[#CC0000] bg-red-50 accent-[#CC0000]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={preferences.desiredJobTypes.includes(jobType)}
                        onChange={() => toggleJobType(jobType)}
                        className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {jobType.replace("-", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Desired Salary Range
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum
                    </label>
                    <input
                      type="number"
                      value={preferences.salaryRange.min}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          salaryRange: {
                            ...prev.salaryRange,
                            min: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum
                    </label>
                    <input
                      type="number"
                      value={preferences.salaryRange.max}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          salaryRange: {
                            ...prev.salaryRange,
                            max: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={preferences.salaryRange.salaryType}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          salaryRange: {
                            ...prev.salaryRange,
                            salaryType: e.target.value as
                              | "daily"
                              | "monthly"
                              | "hourly"
                              | "one-time",
                          },
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {SALARY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferred Languages */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preferred Languages
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select the languages you're comfortable working in
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {LANGUAGES.map((language) => (
                    <label
                      key={language}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.preferredLanguages.includes(
                          language
                        )}
                        onChange={() => toggleLanguage(language)}
                        className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Work Radius */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preferred Work Radius
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Maximum distance you're willing to travel for work (in
                  kilometers)
                </p>
                <div className="max-w-xs">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={preferences.preferredWorkRadiusKm}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferredWorkRadiusKm: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a value between 1 and 1000 km
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-red-600 text-sm">{validationError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 cursor-pointer text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 cursor-pointer rounded-lg transition-colors ${
              isSaving
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
