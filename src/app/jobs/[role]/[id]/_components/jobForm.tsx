"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StepperFooter from "@/components/StepperFooter";
import { JobPost, SalaryRate } from "@/types/jobPosts";
import { amounts, units } from "@/lib/jobs";
import Dropdown from "@/components/dropdown/Dropdown";
import { updateJobPost } from "@/app/_actions/jobs/update-job";

export default function JobForm({ job }: { job: JobPost }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: job.title,
    location: job.location ?? "",
    description: job.description,
    salary: job.salary_max.toString(),
    rate: (job.salary_rate as SalaryRate) ?? "Per Day",
  });

  const handleSave = async () => {
    const numericSalary = parseInt(form.salary.replace(/[₱,]/g, ""), 10);

    const updated = await updateJobPost(job.id, {
      title: form.title,
      location: form.location,
      job_type: "yaya",
      description: form.description,
      salary_min: numericSalary,
      salary_max: numericSalary,
      salary_rate: form.rate,
    });

    if (updated) {
      router.push(`/jobs/kindbossing/${job.id}`);
    } else {
      // optional: show error message
      console.error("Failed to update job");
    }
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8">
      <h1 className="text-center mb-6 postJobH1">Edit Job</h1>

      {/* Title */}
      <div className="mb-5">
        <label className="block mb-2 postJobLabel">Job Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="postJobInputPlaceholder w-full h-12 rounded-md border border-[#DFDFDF] px-4 outline-none"
        />
      </div>

      {/* Location */}
      <div className="mb-5">
        <label className="block mb-2 postJobLabel">Location</label>
        <input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="postJobInputPlaceholder w-full h-12 rounded-md border border-[#DFDFDF] px-4 outline-none"
        />
      </div>

      {/* Salary + Rate */}
      {/* Salary + Rate */}
      <div className="mb-5">
        <label className="block mb-2 postJobLabel">Salary & Rate</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Dropdown
            value={`₱${form.salary}`}
            onChange={(val: string) =>
              setForm({ ...form, salary: val.replace(/[₱,]/g, "") })
            }
            options={amounts}
            placeholder="Select amount"
            className="border border-[#DFDFDF] rounded-md"
          />
          <Dropdown
            value={form.rate}
            onChange={(val: string) =>
              setForm({ ...form, rate: val as SalaryRate })
            }
            options={units}
            placeholder="Select unit"
            className="border border-[#DFDFDF] rounded-md"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <label className="block mb-2 postJobLabel">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="postJobInputPlaceholder w-full min-h-[160px] rounded-md border border-[#DFDFDF] px-4 py-3 outline-none resize-y"
        />
      </div>

      {/* Footer */}
      <StepperFooter
        onBack={() => router.push(`/jobs/kindbossing/${job.id}`)}
        onNext={handleSave}
        backLabel="Cancel"
        nextLabel="Save"
      />
    </section>
  );
}
