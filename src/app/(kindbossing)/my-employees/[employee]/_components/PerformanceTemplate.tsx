"use client";

import { useState } from "react";
import { HiOutlinePencil } from "react-icons/hi";
import Image from "next/image";

/* ---------- Types ---------- */
export type PerformanceRecord = {
  id: string;
  title: string;
  attendance: number;
  workQuality: number;
  communication: number;
  problemSolving: number;
  teamwork: number;
  notes: string;
};

/* ---------- Performance Form ---------- */
function PerformanceForm({
  initialData,
  onCancel,
  onSave,
}: {
  initialData?: PerformanceRecord;
  onCancel: () => void;
  onSave: (data: PerformanceRecord) => void;
}) {
  const [form, setForm] = useState<PerformanceRecord>(
    initialData ?? {
      id: crypto.randomUUID(),
      title: "",
      attendance: 5,
      workQuality: 5,
      communication: 5,
      problemSolving: 5,
      teamwork: 5,
      notes: "",
    }
  );

  const handleChange = (field: keyof PerformanceRecord, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const RatingSelect = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (val: number) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full border border-[#ADADAD] bg-white rounded-lg px-2 py-2 focus:outline-none"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n} ⭐
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-[#F6F6F6]">
      {/* 2-column grid for inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border border-[#ADADAD] bg-white rounded-lg px-3 py-2 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Attendance Rating</label>
          <RatingSelect
            value={form.attendance}
            onChange={(v) => handleChange("attendance", v)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Work Quality</label>
          <RatingSelect
            value={form.workQuality}
            onChange={(v) => handleChange("workQuality", v)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Communication Skills</label>
          <RatingSelect
            value={form.communication}
            onChange={(v) => handleChange("communication", v)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Problem Solving</label>
          <RatingSelect
            value={form.problemSolving}
            onChange={(v) => handleChange("problemSolving", v)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Teamwork</label>
          <RatingSelect
            value={form.teamwork}
            onChange={(v) => handleChange("teamwork", v)}
          />
        </div>
      </div>

      {/* Notes full width */}
      <div>
        <label className="block text-sm mb-1">Notes/Comments</label>
        <textarea
          placeholder="Type here..."
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="w-full border border-[#ADADAD] bg-white rounded-lg px-3 py-3 h-28 focus:outline-none"
        />
      </div>

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-28 py-2 border border-[#ADADAD] font-bold bg-white rounded-lg focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-28 py-2 bg-[#CB0000] text-white font-bold rounded-lg focus:outline-none"
        >
          {initialData ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Performance Templates Section ---------- */
export default function PerformanceTemplates() {
  const [records, setRecords] = useState<PerformanceRecord[]>([
    {
      id: crypto.randomUUID(),
      title: "Initial Review",
      attendance: 5,
      workQuality: 4,
      communication: 5,
      problemSolving: 5,
      teamwork: 4,
      notes:
        "Strong performer, consistent attendance and excellent communication.",
    },
  ]);
  const [editing, setEditing] = useState<PerformanceRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data: PerformanceRecord) => {
    setRecords((prev) => {
      const exists = prev.find((r) => r.id === data.id);
      if (exists) {
        return prev.map((r) => (r.id === data.id ? data : r));
      }
      return [...prev, data];
    });
    setShowForm(false);
    setEditing(null);
  };

  return (
    <section
      className={`rounded-2xl border border-[#F6F6F6] bg-[#F6F6F6] p-4 md:p-5`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">Performance Templates</h3>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="rounded-full bg-white p-2 focus:outline-none"
          >
            <Image
              src="/icons/plusAlternative.png"
              alt="Add"
              width={32} // adjust size as needed
              height={32}
              className="object-contain"
            />
          </button>
        </div>

        {showForm && (
          <PerformanceForm
            initialData={editing ?? undefined}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={handleSave}
          />
        )}

        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="p-5 rounded-4xl bg-white relative">
              <div className="flex items-center justify-between pb-2">
                <div className="flex flex-col">
                  <h3 className="font-semibold">Performance Templates</h3>
                  <p className="text-xs text-[#cb0000]">
                    Last Edit on 25/12/2024
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditing(r);
                    setShowForm(true);
                  }}
                  className="text-lg rounded-full bg-[#F6F6F6] p-3"
                >
                  <HiOutlinePencil />
                </button>
              </div>
              {/* <div className="font-medium">{r.title}</div> */}
              {[
                { label: "Attendance Rating", key: "attendance" },
                { label: "Work Quality", key: "workQuality" },
                { label: "Communication Skills", key: "communication" },
                { label: "Problem Solving", key: "problemSolving" },
                { label: "Teamwork", key: "teamwork" },
              ].map(({ label, key }) => (
                <div key={key} className="font-semibold mt-1">
                  <span className="text-[#667282]">{label}: </span>
                  {r[key as keyof typeof r]} ⭐
                </div>
              ))}

              <div className="font-semibold mt-1">Notes/Comments:</div>
              <div className="text-sm text-[#667282] mt-1">{r.notes}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
