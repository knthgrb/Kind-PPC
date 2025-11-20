"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MONTHS, WORK_HISTORY_YEARS } from "@/constants/onboarding";
import { WorkEntry } from "@/types/onboarding";
import { formatDateRange } from "@/utils/dateUtils";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/common/StepperFooter";
import { useKindTaoOnboardingStore } from "@/stores/useKindTaoOnboardingStore";
import { logger } from "@/utils/logger";

type WorkHistoryClientProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function WorkHistoryClient({
  onNext,
  onBack,
}: WorkHistoryClientProps) {
  const router = useRouter();
  const { setWorkHistory, workHistory, skillsAvailability } =
    useKindTaoOnboardingStore();

  // saved entries
  const [entries, setEntries] = useState<WorkEntry[]>([]);

  // edit mode (index in entries) or null if adding new
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // form state
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [description, setDescription] = useState("");
  const [isCurrentJob, setIsCurrentJob] = useState(false);
  const [location, setLocation] = useState("");
  const [skillsUsed, setSkillsUsed] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const months = [...MONTHS];
  const years = WORK_HISTORY_YEARS.map(String);

  // Available skills for selection - use skills from skills & availability step
  const AVAILABLE_SKILLS = skillsAvailability?.skills || [];

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // First, try to load from store
        if (workHistory && workHistory.length > 0) {
          const workEntries = workHistory.map((entry) => ({
            jobTitle: entry.jobTitle,
            company: entry.company,
            startMonth: entry.startMonth,
            startYear: entry.startYear,
            endMonth: entry.endMonth,
            endYear: entry.endYear,
            description: entry.description || "",
            isCurrentJob: entry.isCurrentJob || false,
            location: entry.location || "",
            skillsUsed: entry.skillsUsed || [],
            notes: entry.notes || "",
          }));
          setEntries(workEntries);
          return;
        }
      } catch (error) {
        logger.error("Error loading existing data:", error);
      }
    };

    loadExistingData();
  }, [workHistory]);

  const resetForm = () => {
    setJobTitle("");
    setCompany("");
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
    setDescription("");
    setIsCurrentJob(false);
    setLocation("");
    setSkillsUsed([]);
    setNotes("");
  };

  const handleSave = () => {
    const entry: WorkEntry = {
      jobTitle,
      company,
      startMonth,
      startYear,
      endMonth,
      endYear,
      description,
      isCurrentJob,
      location,
      skillsUsed,
      notes,
      expanded: false,
    };

    if (editingIndex !== null) {
      // update existing
      setEntries((prev) =>
        prev.map((e, i) => (i === editingIndex ? { ...entry } : e))
      );
      setEditingIndex(null);
    } else {
      // add new (collapse all previous)
      setEntries((prev) => [
        entry,
        ...prev.map((e) => ({ ...e, expanded: false })),
      ]);
    }

    resetForm();
  };

  const handleEdit = (idx: number) => {
    const e = entries[idx];
    setJobTitle(e.jobTitle);
    setCompany(e.company);
    setStartMonth(e.startMonth);
    setStartYear(e.startYear);
    setEndMonth(e.endMonth);
    setEndYear(e.endYear);
    setDescription(e.description);
    setIsCurrentJob(e.isCurrentJob);
    setLocation(e.location || "");
    setSkillsUsed(e.skillsUsed || []);
    setNotes(e.notes || "");
    setEditingIndex(idx);
    // open the card for context
    setEntries((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, expanded: true } : x))
    );
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    resetForm();
  };

  const handleRemove = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      handleCancelEdit();
    } else if (editingIndex !== null && idx < editingIndex) {
      // shift editing index if a previous item was removed
      setEditingIndex((v) => (v === null ? v : v - 1));
    }
  };

  const handleNext = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Save to onboarding store only; finalize will persist
      setWorkHistory(
        entries.map((e) => ({
          jobTitle: e.jobTitle,
          company: e.company,
          startMonth: e.startMonth,
          startYear: e.startYear,
          endMonth: e.endMonth,
          endYear: e.endYear,
          description: e.description,
          isCurrentJob: e.isCurrentJob,
          location: e.location,
          skillsUsed: e.skillsUsed,
          notes: e.notes,
        }))
      );

      onNext?.();
    } catch (err) {
      console.error("❌ Unexpected error saving work history:", err);
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpand = (idx: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, expanded: !e.expanded } : e))
    );
  };

  const toggleSkill = (skill: string) => {
    setSkillsUsed((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const formatSkillName = (skill: string) => {
    return skill
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="max-w-4xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Work History
          </h1>
          <p className="text-gray-600 text-lg">
            Share your work experience to help employers understand your
            background and skills. This is optional but recommended.
          </p>
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600 text-sm">
              <strong>Optional:</strong> Adding work history helps employers
              better understand your experience and skills.
            </p>
          </div>
        </div>

        {/* Saved (foldable) entries */}
        {entries.length > 0 && (
          <div className="mb-6 space-y-3">
            {entries.map((e, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#DFDFDF] overflow-hidden"
              >
                <div className="w-full px-4 h-12 flex items-center justify-between">
                  {/* Left: title + range (click to expand) */}
                  <button
                    type="button"
                    className="text-left flex-1"
                    onClick={() => toggleExpand(idx)}
                  >
                    <div className="font-medium">
                      {e.jobTitle || "Untitled role"}{" "}
                      {e.company ? `· ${e.company}` : ""}
                    </div>
                    <div className="text-sm opacity-80">
                      {formatDateRange(
                        e.startMonth,
                        e.startYear,
                        e.endMonth,
                        e.endYear
                      )}
                    </div>
                  </button>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(idx)}
                      className="px-2 py-1 cursor-pointer rounded-xl border border-[#DFDFDF]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      aria-label="Remove"
                      className="px-2 py-1 cursor-pointer rounded-xl border border-[#DFDFDF]"
                      title="Remove"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className="px-2 py-1"
                      aria-label={e.expanded ? "Collapse" : "Expand"}
                    >
                      {e.expanded ? "▴" : "▾"}
                    </button>
                  </div>
                </div>

                {e.expanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {e.description && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">
                          Description:
                        </h4>
                        <p className="whitespace-pre-line text-sm">
                          {e.description}
                        </p>
                      </div>
                    )}
                    {e.location && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">
                          Location:
                        </h4>
                        <p className="text-sm">{e.location}</p>
                      </div>
                    )}
                    {e.skillsUsed && e.skillsUsed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">
                          Skills Used:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {e.skillsUsed.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-xs rounded-xl"
                            >
                              {formatSkillName(skill)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {e.notes && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">
                          Notes:
                        </h4>
                        <p className="whitespace-pre-line text-sm">{e.notes}</p>
                      </div>
                    )}
                    {e.isCurrentJob && (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-xl">
                          Current Job
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main entry form */}
        <div id="work-form">
          {/* Job Title */}
          <div className="mb-4">
            <label className="block mb-2 stepsLabel">Job Title</label>
            <input
              type="text"
              placeholder="Job Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none"
            />
          </div>

          {/* Company */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">Employer/Company</label>
            <input
              type="text"
              placeholder="Employer/Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none"
            />
          </div>

          {/* Start Date */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">Start Date</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dropdown
                value={startMonth}
                options={months}
                onChange={setStartMonth}
                placeholder="Month"
                className="rounded-lg border border-[#DFDFDF]"
              />
              <Dropdown
                value={startYear}
                options={years}
                onChange={setStartYear}
                placeholder="Year"
                className="rounded-lg border border-[#DFDFDF]"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">End Date</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dropdown
                value={endMonth}
                options={months}
                onChange={setEndMonth}
                placeholder="Month"
                className="rounded-lg border border-[#DFDFDF]"
                disabled={isCurrentJob}
              />
              <Dropdown
                value={endYear}
                options={years}
                onChange={setEndYear}
                placeholder="Year"
                className="rounded-lg border border-[#DFDFDF]"
                disabled={isCurrentJob}
              />
            </div>
          </div>

          {/* Is Current Job */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrentJob}
                onChange={(e) => {
                  setIsCurrentJob(e.target.checked);
                  if (e.target.checked) {
                    setEndMonth("");
                    setEndYear("");
                  }
                }}
                className="w-4 h-4 text-[#CC0000] border-gray-300 rounded focus:ring-[#CC0000]"
              />
              <span className="stepsLabel">This is my current job</span>
            </label>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">Description</label>
            <textarea
              placeholder="Type Here…."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[140px] rounded-xl border border-[#DFDFDF] px-4 py-3 outline-none resize-y"
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">Location (Optional)</label>
            <input
              type="text"
              placeholder="City, Province"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none"
            />
          </div>

          {/* Skills Used */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">
              Skills Used (Optional)
            </label>
            {AVAILABLE_SKILLS.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AVAILABLE_SKILLS.map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-[#DFDFDF] hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={skillsUsed.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="w-4 h-4 text-[#CC0000] border-gray-300 rounded focus:ring-[#CC0000]"
                    />
                    <span className="text-sm">{formatSkillName(skill)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-800 text-sm">
                  Please complete the Skills & Availability step first to select
                  skills for your work experience.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">Notes (Optional)</label>
            <textarea
              placeholder="Additional notes about this work experience..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[100px] rounded-xl border border-[#DFDFDF] px-4 py-3 outline-none resize-y"
            />
          </div>

          {/* Save button (changes label in edit mode) */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={handleSave}
              className="relative cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#CC0000] px-4 h-[43px] text-[#CC0000] bg-white"
            >
              {/* Plus icon when adding; simple disk-like bar when editing */}
              <span className="relative inline-flex items-center justify-center w-5 h-5 rounded-full border border-[#CC0000]">
                {editingIndex === null ? (
                  <>
                    <span className="block w-3 h-[2px] bg-[#CC0000]" />
                    <span className="absolute block w-[2px] h-3 bg-[#CC0000]" />
                  </>
                ) : (
                  <span className="block w-3 h-[2px] bg-[#CC0000]" />
                )}
              </span>
              <span>
                {editingIndex === null ? "Save & Add More" : "Save Changes"}
              </span>
            </button>

            {editingIndex !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 h-[43px] rounded-xl border border-[#DFDFDF] bg-white"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <br />

        {/* Error Message */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        )}

        {/* Loading State */}
        {isSaving && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <p className="text-blue-600 text-sm">Saving your work history...</p>
          </div>
        )}

        <StepperFooter
          onBack={onBack ? onBack : () => router.push("/kindtao-onboarding")}
          onNext={isSaving ? undefined : handleNext}
          nextLabel={isSaving ? "Saving..." : "Next"}
        />
      </div>
    </>
  );
}
