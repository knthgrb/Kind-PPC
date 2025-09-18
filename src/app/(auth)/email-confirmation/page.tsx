"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function EmailConfirmationPage() {
  const [email, setEmail] = useState("");
  const [isGmail, setIsGmail] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get email from URL params or localStorage if available
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
      setIsGmail(emailParam.toLowerCase().includes("@gmail.com"));
    } else {
      router.replace("/login");
    }
  }, [searchParams]);

  const handleGmailClick = () => {
    if (isGmail) {
      window.open("https://mail.google.com", "_blank");
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="loginH1 mb-4">Check Your Email</h1>

          <p className="text-gray-600 text-lg mb-2">
            We've sent a confirmation link to
          </p>

          {email && (
            <p className="text-[#CB0000] font-semibold text-lg mb-4">{email}</p>
          )}

          <p className="text-gray-600">
            Please click the link in the email to confirm your account.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Gmail Integration */}
          {isGmail && (
            <div className="mb-6">
              <button
                onClick={handleGmailClick}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 flex items-center justify-center gap-3 transition-colors"
              >
                <Image
                  src="/icons/google_ic.png"
                  width={24}
                  height={24}
                  alt="Gmail"
                  className="w-6 h-6"
                />
                <span className="text-red-700 font-medium">Open Gmail</span>
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              What to do next:
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>Check your email inbox (and spam folder)</li>
              <li>Look for an email from Kind Platform</li>
              <li>Click the "Confirm Email" button or link</li>
              <li>Return here and try logging in</li>
            </ol>
          </div>

          {/* Additional Help */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-blue-800 text-sm font-medium mb-1">
                  Didn't receive the email?
                </p>
                <p className="text-blue-700 text-sm">
                  It may take a few minutes to arrive. Check your spam folder or{" "}
                  <Link
                    href="/email-not-confirmed"
                    className="underline hover:text-blue-900"
                  >
                    request a new one
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBackClick}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              ← Back to Previous Page
            </button>

            <Link
              href="/login"
              className="block w-full text-center bg-[#CB0000] hover:bg-[#A00000] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link
              href="/contact-us"
              className="text-[#CB0000] hover:text-[#A00000] font-medium"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
