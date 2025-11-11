"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resendConfirmationEmail } from "@/actions/auth/resend-confirmation";
import { Button } from "@/components/buttons";

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
    <main className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      {/* Logo in upper left */}
      <Link href="/" className="absolute top-6 left-6 z-10">
        <Image
          src="/kindLogo.png"
          width={120}
          height={40}
          alt="Kind"
          priority
          className="h-8 w-auto"
        />
      </Link>
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 sm:p-8 md:p-10">
        {/* Warning Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600"
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

          <h1 className="loginH1 mb-4">Email Not Confirmed</h1>

          <p className="text-gray-600 text-base sm:text-lg">
            Please confirm your email address before signing in.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">
            What to do next:
          </h2>
          <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            <li>
              Check your email inbox (and spam folder) for a confirmation email
            </li>
            <li>Click the confirmation link in the email</li>
          </ol>
        </div>

        {/* Resend Email Form */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">
            Didn&apos;t receive the email?
          </h3>
          <form onSubmit={handleResendConfirmation} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 loginLabel">
                Enter your email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Enter your email address"
                className={`input-placeholder w-full rounded-xl border px-4 h-12 ${
                  error ? "border-red-500" : "border-[#ADADAD]"
                }`}
                required
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isLoading}
                className="h-12"
              >
                {isLoading ? "Sending..." : "Resend Confirmation Email"}
              </Button>
            </div>
          </form>

          {/* Success Message */}
          {message && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mb-4">
          <Link href="/login" className="block">
            <Button variant="secondary" size="md" fullWidth className="h-12">
              ← Back to Login
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still having trouble?{" "}
            <Link
              href="/contact-us"
              className="text-[#CB0000] hover:text-[#A00000] font-medium hover:underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
