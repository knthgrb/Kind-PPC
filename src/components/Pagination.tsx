"use client";
import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

export default function Pagination({
  page,
  totalPages,
  onChange,
  className = "",
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [maxFit, setMaxFit] = React.useState<number>(0);

  React.useEffect(() => {
    function update() {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const approxButtonWidth = 36; // px estimate for each number button
        const fit = Math.floor(width / approxButtonWidth);
        setMaxFit(fit);
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pages = React.useMemo<(number | "...")[]>(() => {
    if (totalPages <= maxFit && maxFit > 0) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const out: (number | "...")[] = [];
    out.push(1);

    if (page > 3) out.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) out.push(i);

    if (page < totalPages - 2) out.push("...");

    out.push(totalPages);

    return out;
  }, [page, totalPages, maxFit]);

  const clamp = (p: number) => Math.min(Math.max(1, p), totalPages);

  return (
    <div className={`grid grid-cols-3 items-center w-full ${className}`}>
      {/* Prev */}
      <div className="flex justify-start">
        <button
          onClick={() => onChange(clamp(page - 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="text-xs" aria-hidden />
          <span className="hidden sm:inline">Prev</span>
        </button>
      </div>

      {/* Numbers */}
      <div
        ref={containerRef}
        className="flex justify-center items-center gap-1 overflow-hidden"
      >
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={`page-${p}-${i}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`px-2 py-1 rounded-md text-sm font-medium transition
        ${
          p === page
            ? "text-[#CB0000] bg-[#fefafa]"
            : "text-gray-500 hover:text-gray-800"
        }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <div className="flex justify-end">
        <button
          onClick={() => onChange(clamp(page + 1))}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Next</span>
          <FaChevronRight className="text-xs" aria-hidden />
        </button>
      </div>
    </div>
  );
}
