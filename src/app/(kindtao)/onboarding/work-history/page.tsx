"use client";

import Stepper from "@/components/Stepper";
import { useRouter } from "next/navigation";
import StepperFooter from "@/components/StepperFooter";
import { useState } from "react";

type WorkEntry = {
  jobTitle: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description: string;
  expanded?: boolean;
};

export default function WorkHistoryPage() {
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

  const months = [
    "Month",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["Year", "2025", "2024", "2023", "2022", "2021", "2020"];

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
      setEntries((prev) => [entry, ...prev.map((e) => ({ ...e, expanded: false }))]);
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
    // scroll to form (optional)
    // document.getElementById("work-form")?.scrollIntoView({ behavior: "smooth" });
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

  const toggleExpand = (idx: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, expanded: !e.expanded } : e))
    );
  };

  const formatRange = (e: WorkEntry) => {
    const sm = e.startMonth || "–";
    const sy = e.startYear || "–";
    const em = e.endMonth || "–";
    const ey = e.endYear || "–";
    return `${sm} ${sy} → ${em} ${ey}`;
  };

  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8">
        {/* Stepper */}
        <Stepper steps={4} activeStep={3} />
        <br/>
        <h1 className="mb-4 stepsH1">Work History</h1>

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
                      {e.jobTitle || "Untitled role"} {e.company ? `· ${e.company}` : ""}
                    </div>
                    <div className="text-sm opacity-80">{formatRange(e)}</div>
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
              <div className="relative">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
                >
                  {months.map((m) => (
                    <option key={m} value={m === "Month" ? "" : m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  ▾
                </span>
              </div>
              <div className="relative">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y === "Year" ? "" : y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  ▾
                </span>
              </div>
            </div>
          </div>

          {/* End Date */}
          <div className="mb-6">
            <label className="block mb-2 stepsLabel">End Date</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
                >
                  {months.map((m) => (
                    <option key={m} value={m === "Month" ? "" : m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  ▾
                </span>
              </div>
              <div className="relative">
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y === "Year" ? "" : y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  ▾
                </span>
              </div>
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
              <span>{editingIndex === null ? "Save & Add More" : "Save Changes"}</span>
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
            <br/>
    <StepperFooter
      onBack={() => router.push("/onboarding/skills-availability")}
      onNext={() => router.push("/onboarding/document-upload")}
    />

      </section>
    </main>
  );
}
