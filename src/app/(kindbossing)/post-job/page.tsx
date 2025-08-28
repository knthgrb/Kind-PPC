// app/post-job/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ContinueModal from "@/components/ContinueModal";
import StepperFooter from "@/components/StepperFooter";

export default function PostJobPage() {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [amount, setAmount] = useState("₱550");
  const [unit, setUnit] = useState("Per Day");
  const [description, setDescription] = useState("");

  // modal state (use optional fields + safe fallback)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title?: string;
    description?: string;
    buttonLabel?: string;
    icon?: string | null;
    onAction?: () => void;
  }>({});

  const amounts = ["₱350", "₱450", "₱500", "₱550", "₱600", "₱700", "₱800"];
  const units = ["Per Hour", "Per Day", "Per Week", "Per Month"];

  const handlePost = () => {
    if (
      !title.trim() ||
      !location.trim() ||
      !amount ||
      !unit ||
      !description.trim()
    ) {
      setModalProps({
        title: "Missing Information",
        description: "Please complete all required fields before posting.",
        buttonLabel: "OK",
        icon: null, // AccountCreatedModal hides the icon when null
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    setModalProps({
      title: "Job Posted",
      description: "Your job has been posted successfully",
      buttonLabel: "Continue",
      icon: "/icons/checkCircleOTP.png",
      onAction: () => {
        setModalOpen(false);
        // router.push("/jobs"); // navigate if desired
      },
    });
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-6">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8">
        <h1 className="text-center mb-6 postJobH1">Post Job</h1>

        {/* Job Title */}
        <div className="mb-5">
          <label className="block mb-2 postJobLabel">Job Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Job Title"
            className="postJobInputPlaceholder w-full h-12 rounded-md border border-[#DFDFDF] px-4 outline-none"
          />
        </div>

        {/* Location */}
        <div className="mb-5">
          <label className="block mb-2 postJobLabel">Location</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            type="text"
            placeholder="Company"
            className="postJobInputPlaceholder w-full h-12 rounded-md border border-[#DFDFDF] px-4 outline-none"
          />
        </div>

        {/* Rate */}
        <div className="mb-5">
          <label className="block mb-2 postJobLabel">Rate</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <select
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
              >
                {amounts.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                ▾
              </span>
            </div>

            <div className="relative">
              <select
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
              >
                {units.map((v) => (
                  <option key={v} value={v}>
                    {v}
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
        <div className="mb-8">
          <label className="block mb-2 postJobLabel">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Type Here…."
            className="postJobInputPlaceholder w-full min-h-[160px] rounded-md border border-[#DFDFDF] px-4 py-3 outline-none resize-y"
          />
        </div>

        {/* Footer with icons (prev/next) */}
        <StepperFooter
          onBack={() => router.back()}
          onNext={handlePost}
          backLabel="Back"
          nextLabel="Post"
        />
      </section>

      {/* Modal with safe fallbacks to satisfy TS */}
      <ContinueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={modalProps.onAction ?? (() => setModalOpen(false))}
        title={modalProps.title ?? ""}
        description={modalProps.description ?? ""}
        buttonLabel={modalProps.buttonLabel ?? "OK"}
        icon={modalProps.icon ?? undefined}
      />
    </main>
  );
}
