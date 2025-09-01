"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MONTHS, WORK_HISTORY_YEARS } from "@/constants/onboarding";
import { WorkEntry } from "@/types/onboarding";
import { formatDateRange } from "@/helpers/dateUtils";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/StepperFooter";
import { createClient } from "@/utils/supabase/client";

export default function WorkHistoryClient() {
  const router = useRouter();

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

  // save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const months = [...MONTHS];
  const years = WORK_HISTORY_YEARS.map(String);

  const resetForm = () => {
    setJobTitle("");
    setCompany("");
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
    setDescription("");
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
    if (entries.length === 0) {
      setSaveError("Please add at least one work experience entry");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("User not authenticated");
        return;
      }

      console.log("🔄 Saving work history for user:", user.id);
      console.log("💼 Work entries:", entries);

      // Convert entries to the format expected by the database
      const workExperience = entries.map(entry => ({
        jobTitle: entry.jobTitle,
        company: entry.company,
        startDate: `${entry.startYear}-${entry.startMonth.padStart(2, '0')}-01`,
        endDate: entry.endYear && entry.endMonth ? `${entry.endYear}-${entry.endMonth.padStart(2, '0')}-01` : null,
        description: entry.description,
        duration: formatDateRange(entry.startMonth, entry.startYear, entry.endMonth, entry.endYear)
      }));

      // Check if helper_profile exists, if not create it
      const { data: existingProfile, error: checkError } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let saveResult;
      if (existingProfile) {
        // Update existing profile with work experience
        saveResult = await supabase
          .from('helper_profiles')
          .update({
            work_experience: workExperience,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new profile with work experience
        saveResult = await supabase
          .from('helper_profiles')
          .insert({
            user_id: user.id,
            work_experience: workExperience,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (saveResult.error) {
        console.error("❌ Error saving work history:", saveResult.error);
        setSaveError(`Failed to save data: ${saveResult.error.message}`);
        return;
      }

      console.log("✅ Work history saved successfully!");
      console.log("📊 Updated helper_profiles table with work_experience");
      
      // Redirect to next stage
      router.push("/onboarding/document-upload");
      
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

  return (
    <>
      {/* Saved (foldable) entries */}
      {entries.length > 0 && (
        <div className="mb-6 space-y-3">
          {entries.map((e, idx) => (
            <div
              key={idx}
              className="rounded-md border border-[#DFDFDF] overflow-hidden"
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
                    className="px-2 py-1 rounded-md border border-[#DFDFDF]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    aria-label="Remove"
                    className="px-2 py-1 rounded-md border border-[#DFDFDF]"
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
                <div className="px-4 pb-4">
                  {e.description ? (
                    <p className="whitespace-pre-line">{e.description}</p>
                  ) : (
                    <p className="opacity-70">No description provided.</p>
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
            className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 outline-none"
          />
        </div>

        {/* Company */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Company</label>
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 outline-none"
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
            />
            <Dropdown
              value={endYear}
              options={years}
              onChange={setEndYear}
              placeholder="Year"
              className="rounded-lg border border-[#DFDFDF]"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Description</label>
          <textarea
            placeholder="Type Here…."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[140px] rounded-md border border-[#DFDFDF] px-4 py-3 outline-none resize-y"
          />
        </div>

        {/* Save button (changes label in edit mode) */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={handleSave}
            className="relative inline-flex items-center gap-2 rounded-md border border-[#CC0000] px-4 h-[43px] text-[#CC0000] bg-white"
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
              className="px-3 h-[43px] rounded-md border border-[#DFDFDF] bg-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
      <br />

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      {/* Loading State */}
      {isSaving && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
          <p className="text-blue-600 text-sm">Saving your work history...</p>
        </div>
      )}

      <StepperFooter
        onBack={() => router.push("/onboarding/skills-availability")}
        onNext={isSaving ? undefined : handleNext}
        nextLabel={isSaving ? "Saving..." : "Next"}
      />
    </>
  );
}
