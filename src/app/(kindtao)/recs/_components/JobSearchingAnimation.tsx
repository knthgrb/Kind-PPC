"use client";

import { useEffect, useState } from "react";

export default function JobSearchingAnimation() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Add CSS animations to document head
  useEffect(() => {
    const styleId = "job-searching-animation-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = ``;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center px-4">
      {/* Radar Animation */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mb-8 mx-auto">
        {/* Outer pulsing circles */}
        <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-red-200 opacity-20 animate-ping" />
        <div
          className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full border-4 border-red-300 opacity-30 animate-ping"
          style={{ animationDelay: "0.5s", animationDuration: "2s" }}
        />
        <div
          className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-red-400 opacity-40 animate-ping"
          style={{ animationDelay: "1s", animationDuration: "2.5s" }}
        />

        {/* Center circle with icon */}
        <div className="relative z-10 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl border-4 border-white">
          <svg
            className="w-8 h-8 sm:w-12 sm:h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="text-center w-full max-w-sm mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Searching for matches{dots}
        </h3>
        <p className="text-sm text-gray-500">
          Finding the perfect jobs for you
        </p>
      </div>
    </div>
  );
}
