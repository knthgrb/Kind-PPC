"use client";

import { useEffect, useMemo, useState } from "react";
import {
  JOB_TYPES,
  LANGUAGES,
  PHILIPPINE_REGIONS,
  SALARY_TYPES,
  JobPreferences,
} from "@/components/modals/JobPreferencesModal";
import { JOB_CATEGORIES } from "@/constants/jobCategories";
import { JobPreferencesService } from "@/services/client/JobPreferencesService";
import { useToastStore } from "@/stores/useToastStore";

interface JobPreferencesInlineEditorProps {
  initialPreferences?: JobPreferences | null;
  onCancel: () => void;
  onSaved: (preferences: JobPreferences) => void;
}

const DEFAULT_PREFERENCES: JobPreferences = {
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
};

const JOB_CATEGORY_MAP = JOB_CATEGORIES as Record<string, string[]>;

export default function JobPreferencesInlineEditor({
  initialPreferences,
  onCancel,
  onSaved,
}: JobPreferencesInlineEditorProps) {
  const [preferences, setPreferences] = useState<JobPreferences>(
    initialPreferences ?? DEFAULT_PREFERENCES
  );
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(!initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showError, showSuccess } = useToastStore();

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
      setIsLoading(false);
    } else {
      void fetchJobPreferences();
    }
  }, [initialPreferences]);

  useEffect(() => {
    if (!initialPreferences) return;

    const categoriesToExpand = Object.keys(JOB_CATEGORY_MAP).reduce(
      (acc, category) => {
        const jobs = JOB_CATEGORY_MAP[category];
        const hasSelection = initialPreferences.desiredJobs.some((job) =>
          jobs.includes(job)
        );
        if (hasSelection) {
          acc[category] = true;
        }
        return acc;
      },
      {} as Record<string, boolean>
    );

    setExpandedCategories((prev) => ({
      ...prev,
      ...categoriesToExpand,
    }));
  }, [initialPreferences]);

  const fetchJobPreferences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await JobPreferencesService.getJobPreferences();
      if (error) {
        showError("Error", "Failed to load job preferences. Please try again.");
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error("Error fetching job preferences:", error);
      showError("Error", "Failed to load job preferences. Please try again.");
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

  const handleSave = async () => {
    setValidationError(null);

    if (preferences.desiredJobTypes.length === 0) {
      setValidationError("Please select at least one job type.");
      return;
    }

    setIsSaving(true);
    try {
      const { success, error } =
        await JobPreferencesService.updateJobPreferences(preferences);

      if (!success) {
        showError("Error", error || "Failed to save preferences. Try again.");
        return;
      }

      showSuccess("Success", "Job preferences updated successfully.");
      onSaved(preferences);
    } catch (error) {
      console.error("Error saving job preferences:", error);
      showError("Error", "Failed to save job preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const preferencesSummary = useMemo(
    () => ({
      selectedJobCount: preferences.desiredJobs.length,
      selectedLocationCount: preferences.desiredLocations.length,
      selectedLanguageCount: preferences.preferredLanguages.length,
    }),
    [preferences]
  );

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-6 w-56 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-28 bg-gray-200 rounded" />
            <div className="h-28 bg-gray-200 rounded" />
            <div className="h-28 bg-gray-200 rounded" />
            <div className="h-28 bg-gray-200 rounded" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Selected Jobs</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {preferencesSummary.selectedJobCount}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Preferred Locations</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {preferencesSummary.selectedLocationCount}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Languages</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {preferencesSummary.selectedLanguageCount}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Desired Jobs */}
            <section>
              <header className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Desired Jobs
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose at least one role category you want to work in.
                  </p>
                </div>
              </header>

              <div className="space-y-4">
                {Object.entries(JOB_CATEGORY_MAP).map(([category, jobs]) => (
                  <div
                    key={category}
                    className="border border-gray-200 rounded-lg overflow-hidden"
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
                                checked={preferences.desiredJobs.includes(job)}
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
            </section>

            {/* Desired Locations */}
            <section>
              <header className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Desired Locations
                </h3>
                <p className="text-sm text-gray-600">
                  Select all regions where you'd like to find work
                  opportunities.
                </p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {PHILIPPINE_REGIONS.map((location) => (
                  <label
                    key={location}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={preferences.desiredLocations.includes(location)}
                      onChange={() => toggleLocation(location)}
                      className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                    />
                    <span className="text-sm text-gray-700">{location}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Desired Job Types */}
            <section>
              <header className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Desired Job Types <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600">
                  Select the work arrangements you're comfortable with.
                </p>
              </header>
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
            </section>

            {/* Salary Range */}
            <section>
              <header className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Desired Salary Range
                </h3>
                <p className="text-sm text-gray-600">
                  Provide your target salary range so we can match better jobs.
                </p>
              </header>
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
                          salaryType: e.target
                            .value as JobPreferences["salaryRange"]["salaryType"],
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
            </section>

            {/* Preferred Languages */}
            <section>
              <header className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Preferred Languages
                </h3>
                <p className="text-sm text-gray-600">
                  Select the languages you are comfortable working in.
                </p>
              </header>
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
            </section>

            {/* Preferred Work Radius */}
            <section>
              <header className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Preferred Work Radius
                </h3>
                <p className="text-sm text-gray-600">
                  Maximum distance you're willing to travel for work (km).
                </p>
              </header>
              <div className="max-w-xs">
                <input
                  type="number"
                  min={1}
                  max={1000}
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
                  Enter a value between 1 and 1000 km.
                </p>
              </div>
            </section>
          </div>
        </>
      )}

      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {validationError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 cursor-pointer rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className={`px-6 py-2 cursor-pointer rounded-lg transition-colors ${
            isSaving || isLoading
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
