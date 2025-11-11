"use client";

interface PillToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export default function PillToggle({
  label,
  checked,
  onChange,
}: PillToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="h-9 rounded-xl px-3 border border-[#DFDFDF] bg-[#F5F5F5] flex items-center gap-2"
    >
      {/* checkbox square */}
      <span
        className={[
          "inline-flex items-center justify-center",
          "w-5 h-5 rounded-[4px] border shrink-0",
          checked
            ? "border-[#CC0000] bg-[#CC0000]"
            : "border-[#667282] bg-[#EDEDED]",
          "transition-colors",
        ].join(" ")}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>

      <span>{label}</span>
    </button>
  );
}
