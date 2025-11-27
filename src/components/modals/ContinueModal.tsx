"use client";

import { createPortal } from "react-dom";
import Image from "next/image";

export default function ContinueModal({
  open,
  onClose,
  onAction,
  title,
  description,
  buttonLabel,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  onAction: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
  icon?: string | null; // <-- optional now
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-[263px] min-h-[220px] bg-white rounded-[21px] shadow-lg p-5 flex flex-col items-center">
        {/* only render icon if provided */}
        {icon && (
          <Image
            src={icon}
            alt="Modal icon"
            width={105}
            height={105}
            priority
            className="mt-1"
          />
        )}

        <div className="text-center mt-3 mb-4 px-2">
          {title && <h2 className="mb-1 popTitle">{title}</h2>}
          {description && <p className="popP">{description}</p>}
        </div>

        <button
          type="button"
          onClick={onAction}
          className="mt-auto w-45 h-12 pt-2 pb-2 rounded-2xl bg-[#CB0000] text-white"
        >
          {buttonLabel || "OK"}
        </button>
      </div>
    </div>,
    document.body
  );
}
