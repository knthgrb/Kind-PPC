"use client";

import { useState } from "react";
import { HiOutlinePencil } from "react-icons/hi";
import Image from "next/image";
import Dropdown from "@/components/dropdown/Dropdown";

/* ---------- Types ---------- */
export type ReportRecord = {
  id: string;
  title: string;
  issueType: string;
  notes: string;
};

/* ---------- Report Form ---------- */
function ReportForm({
  initialData,
  onCancel,
  onSave,
}: {
  initialData?: ReportRecord;
  onCancel: () => void;
  onSave: (data: ReportRecord) => void;
}) {
  const [form, setForm] = useState<ReportRecord>(
    initialData ?? {
      id: crypto.randomUUID(),
      title: "",
      issueType: "",
      notes: "",
    }
  );

  const handleChange = (field: keyof ReportRecord, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 space-y-4 bg-[#F6F6F6] rounded-lg"
    >
      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm text-gray-700 border border-[#ADADAD] bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Issue Type</label>
          <Dropdown
            value={form.issueType}
            options={["General", "Incident", "Medical", "Behavioral"]}
            onChange={(val) => handleChange("issueType", val)}
            className="w-full border border-[#ADADAD] bg-white rounded-lg"
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

      {/* Buttons */}
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

/* ---------- Reports Section ---------- */
export default function Reports() {
  const [records, setRecords] = useState<ReportRecord[]>([
    {
      id: crypto.randomUUID(),
      title: "Sample Report",
      issueType: "Fraud",
      notes:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ]);
  const [editing, setEditing] = useState<ReportRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data: ReportRecord) => {
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
    <section className="rounded-2xl border border-[#F6F6F6] bg-[#F6F6F6] p-4 md:p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">Reports</h3>
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
              width={32}
              height={32}
              className="object-contain"
            />
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <ReportForm
            initialData={editing ?? undefined}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={handleSave}
          />
        )}

        {/* List */}
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="p-5 rounded-4xl bg-white relative">
              <div className="flex items-center justify-between pb-2">
                <div className="flex flex-col">
                  <h3 className="font-semibold">{r.issueType}</h3>
                  <p className="text-xs text-[#cb0000] mt-1">
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

              <div className="text-sm text-[#667282] w-100">{r.notes}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
