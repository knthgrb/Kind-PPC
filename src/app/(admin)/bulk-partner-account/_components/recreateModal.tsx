"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LuCloudUpload } from "react-icons/lu";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function RecreateModal({ open, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const prevActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevActive.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    document.body.classList.add("overflow-hidden");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
      prevActive.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof window === "undefined") return null;

  const password = "smith321564";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-partner-modal-title"
    >
      <div
        className="inline-block w-fit rounded-2xl bg-white p-6 shadow-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="bulk-partner-modal-title"
          className="text-[1.384rem] text-[#222222] font-semibold pb-4"
        >
          Upload CSV
        </h2>

        <p>
          Upload your CSV for bulk <br />
          account creation
        </p>
        <div className=" flex justify-center pt-4">
          <button
            onClick={onClose}
            className="rounded-lg flex items-center gap-2 border border-[#CB0000] bg-white px-4 py-2 text-[#CB0000] font-medium hover:bg-gray-100"
          >
            <LuCloudUpload className="text-xl" />
            Upload File
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
