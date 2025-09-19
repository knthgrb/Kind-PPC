"use client";

import React, { useEffect, useState } from "react";
import { useToastActions } from "@/stores/useToastStore";
import { Toast } from "@/types/notification";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoWarning,
  IoInformationCircle,
} from "react-icons/io5";

interface ToastItemProps {
  toast: Toast;
}

export default function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToastActions();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match the exit animation duration
  };

  const getToastStyles = () => {
    const baseStyles =
      "relative shadow-lg bg-white text-gray-900 p-4 transition-all duration-300 transform";

    // Type-based left border colors
    const typeStyles = {
      success: "border-l-8 border-green-500",
      error: "border-l-8 border-red-500",
      warning: "border-l-8 border-yellow-500",
      info: "border-l-8 border-blue-500",
    };

    const typeStyle = typeStyles[toast.type];

    // Priority-based shadow styling
    const priorityStyles = {
      urgent: "shadow-gray-200",
      high: "shadow-gray-200",
      normal: "shadow-gray-200",
      low: "shadow-gray-100",
    };

    const priorityStyle = priorityStyles[toast.priority || "normal"];

    if (isExiting) {
      return `${baseStyles} ${typeStyle} ${priorityStyle} translate-y-full opacity-0`;
    }

    if (!isVisible) {
      return `${baseStyles} ${typeStyle} ${priorityStyle} translate-y-full opacity-0`;
    }

    return `${baseStyles} ${typeStyle} ${priorityStyle} translate-y-0 opacity-100`;
  };

  const getIconComponent = () => {
    const iconContainerStyles =
      "w-8 h-8 flex items-center justify-center flex-shrink-0";
    const iconStyles = "w-5 h-5";

    const getIconColor = () => {
      const colors = {
        success: "text-green-500",
        error: "text-red-500",
        warning: "text-yellow-500",
        info: "text-blue-500",
      };
      return colors[toast.type];
    };

    switch (toast.type) {
      case "success":
        return (
          <div className={iconContainerStyles}>
            <IoCheckmarkCircle className={`${iconStyles} ${getIconColor()}`} />
          </div>
        );
      case "error":
        return (
          <div className={iconContainerStyles}>
            <IoCloseCircle className={`${iconStyles} ${getIconColor()}`} />
          </div>
        );
      case "warning":
        return (
          <div className={iconContainerStyles}>
            <IoWarning className={`${iconStyles} ${getIconColor()}`} />
          </div>
        );
      case "info":
        return (
          <div className={iconContainerStyles}>
            <IoInformationCircle
              className={`${iconStyles} ${getIconColor()}`}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // If custom content is provided, render it instead of the default layout
  if (toast.customContent) {
    return (
      <div className={getToastStyles()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {toast.customContent}
      </div>
    );
  }

  return (
    <div className={getToastStyles()}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className="flex items-start space-x-3 pr-6">
        {getIconComponent()}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
          {toast.message && (
            <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
          )}

          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                handleClose();
              }}
              className="mt-2 text-sm font-medium text-blue-600 underline hover:no-underline focus:outline-none transition-all duration-200"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for timed notifications */}
      {toast.duration && toast.duration > 0 && !toast.persistent && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-current transition-all ease-linear opacity-30"
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
