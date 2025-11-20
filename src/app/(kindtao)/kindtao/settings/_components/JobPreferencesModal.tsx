"use client";

import { useEffect, useState } from "react";
import { IoClose, IoAdd, IoRemove } from "react-icons/io5";
import type { JobPreferences } from "@/services/JobPreferencesService";

interface JobPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: JobPreferences) => void;
  initialPreferences?: JobPreferences | null;
  isSaving?: boolean;
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

const JOB_TYPE_OPTIONS = [
  "full-time",
  "part-time",
  "contract",
  "temporary",
  "one-time",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Filipino / Tagalog",
  "Cebuano",
  "Ilocano",
  "Hiligaynon",
  "Bicolano",
  "Waray",
  "Kapampangan",
  "Pangasinan",
  "Tausug",
  "Other",
];

const LOCATION_SUGGESTIONS = [
  "National Capital Region (NCR)",
  "Central Visayas",
  "CALABARZON",
  "Central Luzon",
  "Davao Region",
  "Any Philippines",
];

const JOB_SUGGESTIONS = [
  "Housekeeping",
  "Laundry",
  "Cook",
  "Driver",
  "Caregiver",
  "Gardener",
];

export default function JobPreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
  isSaving = false,
}: JobPreferencesModalProps) {
  const [preferences, setPreferences] = useState<JobPreferences>(
    initialPreferences ?? DEFAULT_PREFERENCES
  );
  const [chipInputs, setChipInputs] = useState({
    desiredJobs: "",
    desiredLocations: "",
    preferredLanguages: "",
  });

  useEffect(() => {
    if (isOpen) {
      setPreferences(initialPreferences ?? DEFAULT_PREFERENCES);
      setChipInputs({
        desiredJobs: "",
        desiredLocations: "",
        preferredLanguages: "",
      });
    }
  }, [isOpen, initialPreferences]);

  if (!isOpen) return null;

  const handleChipInputChange = (field: keyof typeof chipInputs, value: string) => {
    setChipInputs((prev) => ({ ...prev, [field]: value }));
  };

  const addChipValue = (
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages"
  ) => {
    const value = chipInputs[field].trim();
    if (!value) return;
    addChipValueDirect(field, value);
    setChipInputs((prev) => ({ ...prev, [field]: "" }));
  };

  const addChipValueDirect = (
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages",
    value: string
  ) => {
    if (!value) return;
    setPreferences((prev) => {
      const currentValues = prev[field];
      if (currentValues.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        [field]: [...currentValues, value],
      };
    });
  };

  const removeChipValue = (
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages",
    value: string
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }));
  };

  const toggleJobType = (jobType: string) => {
    setPreferences((prev) => ({
      ...prev,
      desiredJobTypes: prev.desiredJobTypes.includes(jobType)
        ? prev.desiredJobTypes.filter((type) => type !== jobType)
        : [...prev.desiredJobTypes, jobType],
    }));
  };

  const toggleLanguageShortcut = (language: string) => {
    if (language === "Other") {
      handleChipInputChange("preferredLanguages", "");
      return;
    }
    setPreferences((prev) => ({
      ...prev,
      preferredLanguages: prev.preferredLanguages.includes(language)
        ? prev.preferredLanguages.filter((lang) => lang !== language)
        : [...prev.preferredLanguages, language],
    }));
  };

  const handleSave = () => {
    onSave(preferences);
  };

  const renderChipList = (
    items: string[],
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages"
  ) => {
    if (items.length === 0) {
      return <p className="text-sm text-gray-500">No items added yet.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-800"
          >
            {item}
            <button
              type="button"
              onClick={() => removeChipValue(field, item)}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoRemove className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    );
  };

  const renderSuggestions = (
    suggestions: string[],
    field: "desiredJobs" | "desiredLocations"
  ) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => addChipValueDirect(field, suggestion)}
          className="px-3 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job Preferences</h2>
            <p className="text-sm text-gray-500">
              Update your desired roles, locations, and other matching details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Desired Jobs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Desired Jobs
                </h3>
                <p className="text-sm text-gray-500">
                  Add roles you are actively looking for.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={chipInputs.desiredJobs}
                onChange={(e) => handleChipInputChange("desiredJobs", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChipValue("desiredJobs");
                  }
                }}
                placeholder="e.g., Housekeeping"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
              />
              <button
                type="button"
                onClick={() => addChipValue("desiredJobs")}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000]"
              >
                <IoAdd className="w-4 h-4" />
                Add
              </button>
            </div>
            {renderChipList(preferences.desiredJobs, "desiredJobs")}
            {renderSuggestions(JOB_SUGGESTIONS, "desiredJobs")}
          </section>

          {/* Desired Locations */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Desired Locations
                </h3>
                <p className="text-sm text-gray-500">
                  Add regions, cities, or provinces where you prefer to work.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={chipInputs.desiredLocations}
                onChange={(e) =>
                  handleChipInputChange("desiredLocations", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChipValue("desiredLocations");
                  }
                }}
                placeholder="e.g., Cebu City"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
              />
              <button
                type="button"
                onClick={() => addChipValue("desiredLocations")}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000]"
              >
                <IoAdd className="w-4 h-4" />
                Add
              </button>
            </div>
            {renderChipList(preferences.desiredLocations, "desiredLocations")}
            {renderSuggestions(LOCATION_SUGGESTIONS, "desiredLocations")}
          </section>

          {/* Job Types */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Preferred Job Types
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {JOB_TYPE_OPTIONS.map((jobType) => (
                <label
                  key={jobType}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                    preferences.desiredJobTypes.includes(jobType)
                      ? "border-[#CB0000] bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#CB0000] focus:ring-[#CB0000]"
                    checked={preferences.desiredJobTypes.includes(jobType)}
                    onChange={() => toggleJobType(jobType)}
                  />
                  <span className="text-sm font-medium capitalize">
                    {jobType.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Salary Range */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Expected Salary Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum (₱)
                </label>
                <input
                  type="number"
                  min={0}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum (₱)
                </label>
                <input
                  type="number"
                  min={preferences.salaryRange.min}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Type
                </label>
                <select
                  value={preferences.salaryRange.salaryType}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      salaryRange: {
                        ...prev.salaryRange,
                        salaryType: e.target.value as JobPreferences["salaryRange"]["salaryType"],
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>
          </section>

          {/* Preferred Languages */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Preferred Languages
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {LANGUAGE_OPTIONS.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguageShortcut(language)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    preferences.preferredLanguages.includes(language)
                      ? "border-[#CB0000] bg-red-50 text-[#CB0000]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={chipInputs.preferredLanguages}
                onChange={(e) =>
                  handleChipInputChange("preferredLanguages", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChipValue("preferredLanguages");
                  }
                }}
                placeholder="Add another language"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
              />
              <button
                type="button"
                onClick={() => addChipValue("preferredLanguages")}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000]"
              >
                <IoAdd className="w-4 h-4" />
                Add
              </button>
            </div>
            {renderChipList(preferences.preferredLanguages, "preferredLanguages")}
          </section>

          {/* Work Radius */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Preferred Work Radius
                </h3>
                <p className="text-sm text-gray-500">
                  How far are you willing to travel for work? (in kilometers)
                </p>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {preferences.preferredWorkRadiusKm} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={preferences.preferredWorkRadiusKm}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  preferredWorkRadiusKm: Number(e.target.value),
                }))
              }
              className="w-full mt-4 accent-[#CB0000]"
            />
          </section>
        </div>

        <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center gap-2 px-6 py-2 rounded-lg bg-[#CB0000] text-white text-sm font-semibold hover:bg-[#a10000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}


