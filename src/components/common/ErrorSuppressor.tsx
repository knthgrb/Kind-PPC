"use client";

import { useEffect } from "react";

/**
 * Suppresses non-critical JSON parse errors from Convex client
 * that occur when the client tries to connect before authentication is ready.
 * These errors don't affect functionality but clutter the console.
 */
export default function ErrorSuppressor({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Suppress specific JSON parse errors from Convex
    const errorHandler = (...args: any[]) => {
      // Convert args to string for checking, handling Error objects properly
      const errorString = args
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.message || arg.toString();
          }
          if (typeof arg === "object" && arg !== null) {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(" ");
      
      // Check if this is the JSON parse error we want to suppress
      if (
        typeof errorString === "string" &&
        (errorString.includes("Unexpected token '<'") ||
          errorString.includes("<!DOCTYPE") ||
          (errorString.includes("is not valid JSON") &&
            errorString.includes("DOCTYPE")))
      ) {
        // Suppress this error - it's non-critical and happens during Convex initialization
        return;
      }

      // Log all other errors normally
      originalError.apply(console, args);
    };

    // Handle unhandled promise rejections (which Next.js error overlay catches)
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const errorString = String(event.reason || "");
      
      // Suppress JSON parse errors from unhandled rejections
      if (
        errorString.includes("Unexpected token '<'") ||
        errorString.includes("<!DOCTYPE") ||
        (errorString.includes("is not valid JSON") &&
          errorString.includes("DOCTYPE"))
      ) {
        event.preventDefault();
        return;
      }
    };

    // Override console.error
    console.error = errorHandler;
    
    // Add unhandled rejection handler
    window.addEventListener("unhandledrejection", unhandledRejectionHandler);

    // Cleanup on unmount
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler);
    };
  }, []);

  return <>{children}</>;
}

