"use client";

import { useState, useRef, useEffect } from "react";

export type DropdownProps = {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: DropdownProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger (styled like a select) */}
      <button
        type="button"
        onClick={() => !disabled && setExpanded((v) => !v)}
        disabled={disabled}
        className={`w-full h-11.5 rounded-xl px-3 text-left text-sm flex items-center justify-between focus:outline-none ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "text-gray-700 bg-white"
        }`}
      >
        <span className="truncate">
          {value || <span className="text-gray-400">{placeholder}</span>}
        </span>
        <span className="ml-2">▾</span>
      </button>

      {/* Dropdown options */}
      {expanded && !disabled && (
        <div className="absolute mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-md z-60">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setExpanded(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition ${
                value === opt ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
