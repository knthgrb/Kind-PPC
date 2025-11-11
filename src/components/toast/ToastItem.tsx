"use client";

import React, { useEffect, useState } from "react";
import { useRemoveToast } from "@/stores/useToastStore";
import { Toast } from "@/stores/useToastStore";

interface ToastItemProps {
  toast: Toast;
}

export default function ToastItem({ toast }: ToastItemProps) {
  const removeToast = useRemoveToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 200);
  };

  // Google-style: gray/black background with white text
  const getToastStyles = () => {
    const baseStyles =
      "relative rounded-lg shadow-lg px-4 py-3 text-white text-sm font-normal transition-all duration-200 transform flex items-center justify-between gap-4 min-w-[300px] max-w-[500px]";

    // Google Material Design style: dark gray background
    const bgColor = "bg-[#323232]"; // Google's dark gray

    if (isExiting) {
      return `${baseStyles} ${bgColor} translate-y-2 opacity-0 scale-95`;
    }

    if (!isVisible) {
      return `${baseStyles} ${bgColor} translate-y-2 opacity-0 scale-95`;
    }

    return `${baseStyles} ${bgColor} translate-y-0 opacity-100 scale-100`;
  };

  return (
    <div className={getToastStyles()}>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={handleClose}
        className="text-white/70 hover:text-white transition-colors shrink-0 ml-2"
        aria-label="Close"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
