"use client";
import React from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const handleRetry = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <main className="grid min-h-screen place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-small font-semibold text-brand">500</p>
        <h1 className="mt-xs text-heading-1 font-bold tracking-tight text-strong">
          Something went wrong.
        </h1>
        <p className="mt-s text-tiny text-weak">
          Sorry, we encountered an error while loading this page. Please try
          again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-m text-left">
            <summary className="cursor-pointer text-sm font-medium text-weak hover:text-strong">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-weak bg-gray-50 p-4 rounded-md overflow-auto">
              {error.message}
              {error.stack && (
                <>
                  <br />
                  <br />
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
        <div className="mt-m flex items-center justify-center gap-x-6">
          <button
            className="bg-red-700 text-white px-4 py-2 rounded-md cursor-pointer"
            onClick={handleRetry}
          >
            Try again
          </button>
          <button
            className="bg-red-700 text-white px-4 py-2 rounded-md cursor-pointer"
            onClick={handleGoHome}
          >
            Go back home
          </button>
        </div>
      </div>
    </main>
  );
}
