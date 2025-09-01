"use client";

import { useState, useRef, useEffect } from "react";

export type DropdownProps = {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
};

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "",
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
        onClick={() => setExpanded((v) => !v)}
        className="w-full h-11.5 rounded-md px-3 text-left text-sm text-gray-700 flex items-center justify-between bg-white focus:outline-none"
      >
        <span className="truncate">
          {value || <span className="text-gray-400">{placeholder}</span>}
        </span>
        <span className="ml-2">▾</span>
      </button>

      {/* Dropdown options */}
      {expanded && (
        <div className="absolute mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md z-20">
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
