"use client";

import Image from "next/image";

export default function AlertModal({
  open,
  onClose,
  onAction,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  onAction: () => void;
  plan?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-[263px] min-h-[220px] bg-white rounded-[21px] shadow-lg p-5 flex flex-col items-center">
        {/* only render icon if provided */}

        <Image
          src="/icons/alert.png"
          alt="Modal icon"
          width={105}
          height={105}
          priority
          className="mt-1"
        />

        <div className="text-center mt-3 mb-4 px-2">
          <h2 className="mb-1 popTitle">Alert</h2>
          <p className="popP">
            You have reached your free match limit. Upgrade now to {plan} and
            unlock more!
          </p>
        </div>

        <div className="flex gap-3 mt-auto w-full">
          <button
            type="button"
            onClick={onAction}
            className="flex-1 h-12 rounded-2xl bg-white text-[#CB0000] border border-[#CB0000] hover:bg-gray-200 transition"
          >
            Later
          </button>

          <button
            type="button"
            onClick={onAction}
            className="flex-1 h-12 rounded-2xl bg-[#CB0000] text-white hover:bg-[#a30000] transition"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
