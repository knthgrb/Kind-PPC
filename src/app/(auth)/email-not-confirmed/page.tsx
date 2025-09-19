"use client";

import { useState } from "react";
import Link from "next/link";
import { resendConfirmationEmail } from "@/actions/auth/resend-confirmation";

export default function EmailNotConfirmedPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await resendConfirmationEmail(email);
      if (result.success) {
        setMessage(
          "Confirmation email sent! Please check your inbox and spam folder."
        );
      } else {
        setError(result.error || "Failed to send confirmation email");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Not Confirmed
          </h1>

          <p className="text-gray-600">
            Please confirm your email address before signing in.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">What to do next:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Check your email inbox for a confirmation email</li>
              <li>Click the confirmation link in the email</li>
              <li>Return here and try signing in again</li>
            </ol>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">
              Didn&apos;t receive the email?
            </h3>
            <form onSubmit={handleResendConfirmation} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                required
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Resend Confirmation Email"}
              </button>
            </form>

            {message && (
              <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-800 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <Link
              href="/login"
              className="block w-full text-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Still having trouble?{" "}
            <Link
              href="/contact-us"
              className="text-blue-600 hover:text-blue-800"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
