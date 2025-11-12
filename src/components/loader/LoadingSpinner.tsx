import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "fullscreen";
}

export default function LoadingSpinner({
  message = "Loading...",
  size = "md",
  variant = "default",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div
            className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2`}
          ></div>
          <p className={`${textSizeClasses[size]} text-gray-600`}>{message}</p>
        </div>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {message}
            </h2>
          </div>
          <div className="flex justify-center mt-4 space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4`}
        ></div>
        <p className={`${textSizeClasses[size]} text-gray-600`}>{message}</p>
      </div>
    </div>
  );
}
