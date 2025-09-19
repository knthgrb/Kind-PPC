"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuPencil } from "react-icons/lu";
import { PiTrash } from "react-icons/pi";
import DeleteJobPostModal from "./deleteJobPostModal";
import { JobPost } from "@/types/jobPosts";
import { deactivateJobPost } from "@/actions/jobs/deactivate-job";
import { IoChevronBackOutline } from "react-icons/io5";

export default function JobDetails({
  job,
  role,
}: {
  job: JobPost;
  role: string;
}) {
  const router = useRouter();
  const [openDelete, setOpenDelete] = useState(false);

  const handleDelete = async () => {
    const success = await deactivateJobPost(job.id);

    if (success) {
      setOpenDelete(false);
      router.push("/my-profile");
    } else {
      console.error("Failed to delete job");
    }
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8">
      {/* Back to Profile link */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/my-profile")}
          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors flex items-center gap-1"
        >
          <IoChevronBackOutline /> Back to Profile
        </button>
      </div>

      {/* Header with title + actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="postJobH1">Job Details</h1>

        {role === "kindbossing" && (
          <div className="flex items-center gap-3">
            {/* Edit button */}
            <button
              type="button"
              onClick={() => router.push(`/jobs/${role}/${job.id}/edit`)}
              className="p-2 rounded-md hover:bg-gray-100 transition"
              aria-label="Edit Job"
            >
              <LuPencil size={22} />
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => setOpenDelete(true)}
              className="p-2 rounded-md hover:bg-gray-100 transition"
              aria-label="Delete Job"
            >
              <PiTrash size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Job details */}
      <div className="mb-5">
        <label className="block mb-2 postJobLabel">Job Title</label>
        <div className="jobField">{job.title}</div>
      </div>

      <div className="mb-5">
        <label className="block mb-2 postJobLabel">Location</label>
        <div className="jobField">{job.location ?? "No location"}</div>
      </div>

      <div className="mb-5">
        <label className="block mb-2 postJobLabel">Rate</label>
        <div className="flex items-center gap-1">
          <div className="jobField">₱{job.salary_max.toLocaleString()}</div>
          <div className="jobField">{job.salary_rate}</div>
        </div>
      </div>

      <div>
        <label className="block mb-2 postJobLabel">Description</label>
        <div className="jobField">{job.description}</div>
      </div>

      {/* Delete modal */}
      <DeleteJobPostModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onAction={handleDelete}
        title="Delete Job"
      />
    </section>
  );
}
