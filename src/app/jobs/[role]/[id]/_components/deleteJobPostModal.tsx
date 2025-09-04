"use client";

import Image from "next/image";

export default function DeleteJobPostModal({
  open,
  onClose,
  onAction,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onAction: () => void;
  title?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-[263px] min-h-[220px] bg-white rounded-[21px] shadow-lg p-5 flex flex-col items-center">
        <Image
          src="/icons/alert.png"
          alt="Modal icon"
          width={105}
          height={105}
          priority
          className="mt-1"
        />

        <div className="text-center mt-3 mb-4 px-2">
          <h2 className="mb-1 popTitle">{title}</h2>
          <p className="popP">Are you sure you want to delete this job post?</p>
        </div>

        <div className="flex gap-3 mt-auto w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-white text-[#CB0000] border border-[#CB0000] hover:bg-gray-200 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onAction}
            className="flex-1 h-12 rounded-2xl bg-[#CB0000] text-white hover:bg-[#a30000] transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
