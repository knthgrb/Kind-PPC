"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindTaoOnboardingStore } from "@/stores/useKindTaoOnboardingStore";
import StepperFooter from "@/components/common/StepperFooter";
import { JobPreferences } from "@/components/modals/JobPreferencesModal";
import { JOB_CATEGORIES } from "@/constants/jobCategories";

type JobPreferencesClientProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function JobPreferencesClient({
  onNext,
  onBack,
}: JobPreferencesClientProps) {
  const router = useRouter();
  const { setJobPreferences, jobPreferences } = useKindTaoOnboardingStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
  const [otherLanguage, setOtherLanguage] = useState("");

  // Load existing data when component mounts
  useEffect(() => {
    console.log(
      "JobPreferencesClient: Loading data from store",
      jobPreferences
    );
    if (jobPreferences) {
      setPreferences(jobPreferences);
    }
  }, [jobPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      console.log(
        "JobPreferencesClient: Saving preferences to store",
        preferences
      );

      // Save to store for persistence (database save happens during finalize)
      setJobPreferences(preferences);

      console.log("Job preferences saved to store");
      setIsSaving(false);
      onNext?.();
    } catch (error) {
      console.error("Error saving job preferences:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save job preferences. Please try again."
      );
      setIsSaving(false);
    }
  };

  const getSelectedCount = () => {
    return (
      preferences.desiredJobs.length +
      preferences.desiredLocations.length +
      preferences.desiredJobTypes.length
    );
  };

  const hasSalaryRange = () => {
    return (
      preferences.salaryRange &&
      preferences.salaryRange.min > 0 &&
      preferences.salaryRange.max > 0
    );
  };

  // Other constants

  const PHILIPPINE_REGIONS = [
    "National Capital Region (NCR)",
    "Cordillera Administrative Region (CAR)",
    "Ilocos Region (Region I)",
    "Cagayan Valley (Region II)",
    "Central Luzon (Region III)",
    "CALABARZON (Region IV-A)",
    "MIMAROPA (Region IV-B)",
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

  const JOB_TYPES = [
    "one-time",
    "full-time",
    "part-time",
    "contract",
    "temporary",
  ];

  const SALARY_TYPES = [
    { value: "daily", label: "Daily" },
    { value: "monthly", label: "Monthly" },
    { value: "hourly", label: "Hourly" },
    { value: "one-time", label: "One Time" },
  ];

  const LANGUAGES = [
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

  // Helper functions
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

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleLanguage = (language: string) => {
    setPreferences((prev) => {
      if (language === "Other") {
        // If "Other" is being selected, add it to the list
        if (!prev.preferredLanguages.includes("Other")) {
          return {
            ...prev,
            preferredLanguages: [...prev.preferredLanguages, "Other"],
          };
        }
        // If "Other" is being deselected, remove it and any custom language
        return {
          ...prev,
          preferredLanguages: prev.preferredLanguages.filter(
            (l) => l !== "Other" && l !== otherLanguage
          ),
        };
      }

      // For regular languages, toggle normally
      return {
        ...prev,
        preferredLanguages: prev.preferredLanguages.includes(language)
          ? prev.preferredLanguages.filter((l) => l !== language)
          : [...prev.preferredLanguages, language],
      };
    });
  };

  const handleOtherLanguageChange = (value: string) => {
    setOtherLanguage(value);
    setPreferences((prev) => {
      // Remove the previous custom language if it exists
      const filtered = prev.preferredLanguages.filter(
        (l) => l !== "Other" && l !== otherLanguage
      );

      // Add the new custom language if it's not empty
      if (value.trim()) {
        return {
          ...prev,
          preferredLanguages: [...filtered, value.trim()],
        };
      } else {
        // If empty, just remove the custom language
        return {
          ...prev,
          preferredLanguages: filtered,
        };
      }
    });
  };

  return (
    <>
      <div className="max-w-4xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Job Preferences
          </h1>
          <p className="text-gray-600 text-lg">
            Tell us about the types of jobs you're interested in, your preferred
            locations, and salary expectations. This helps us find better
            matches for you.
          </p>
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600 text-sm">
              <strong>Required:</strong> You must complete this step to proceed.
              Your job preferences will be used to find and match you with
              relevant job opportunities.
            </p>
          </div>
        </div>

        {/* Desired Jobs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Desired Jobs <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select the types of jobs you're interested in
          </p>
          <div className="space-y-4">
            {Object.entries(JOB_CATEGORIES).map(([category, jobs]) => (
              <div key={category} className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{category}</span>
                  <span className="text-gray-400">
                    {expandedCategories[category] ? "−" : "+"}
                  </span>
                </button>
                {expandedCategories[category] && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {jobs.map((job) => (
                        <label
                          key={job}
                          className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                            preferences.desiredJobs.includes(job)
                              ? "border-[#CC0000] bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={preferences.desiredJobs.includes(job)}
                            onChange={() => toggleJob(job)}
                            className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                          />
                          <span className="text-sm font-medium text-gray-700">
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
            Desired Locations <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select the regions where you're willing to work
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {PHILIPPINE_REGIONS.map((location) => (
              <label
                key={location}
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                  preferences.desiredLocations.includes(location)
                    ? "border-[#CC0000] bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={preferences.desiredLocations.includes(location)}
                  onChange={() => toggleLocation(location)}
                  className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                />
                <span className="text-sm font-medium text-gray-700">
                  {location}
                </span>
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
                    ? "border-[#CC0000] bg-red-50"
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
            Salary Range (Optional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Set your expected salary range to help us find suitable matches
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum (₱)
              </label>
              <input
                type="number"
                value={preferences.salaryRange.min || ""}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    salaryRange: {
                      ...prev.salaryRange,
                      min: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum (₱)
              </label>
              <input
                type="number"
                value={preferences.salaryRange.max || ""}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    salaryRange: {
                      ...prev.salaryRange,
                      max: parseInt(e.target.value) || 0,
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
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                  preferences.preferredLanguages.includes(language)
                    ? "border-[#CC0000] bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={preferences.preferredLanguages.includes(language)}
                  onChange={() => toggleLanguage(language)}
                  className="rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000] accent-[#CC0000]"
                />
                <span className="text-sm font-medium text-gray-700">
                  {language}
                </span>
              </label>
            ))}
          </div>

          {/* Other Language Input */}
          {preferences.preferredLanguages.includes("Other") && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify the language:
              </label>
              <input
                type="text"
                value={otherLanguage}
                onChange={(e) => handleOtherLanguageChange(e.target.value)}
                placeholder="Enter language name"
                className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>

        {/* Preferred Work Radius */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preferred Work Radius
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Maximum distance you're willing to travel for work (in kilometers)
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

        {/* Error Message */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        )}

        {/* Loading State */}
        {isSaving && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6">
            <p className="text-gray-600 text-sm">
              Saving your job preferences...
            </p>
          </div>
        )}
      </div>

      <StepperFooter
        onBack={onBack ? onBack : () => router.push("/kindtao-onboarding")}
        onNext={isSaving || getSelectedCount() === 0 ? undefined : handleSave}
        nextLabel={isSaving ? "Saving..." : "Next"}
      />
    </>
  );
}
