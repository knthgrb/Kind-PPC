"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/buttons";

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
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
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

          <p className="text-gray-600 text-base sm:text-lg mb-3">
            We've sent a confirmation link to
          </p>

          {email && (
            <p className="text-[#CB0000] font-semibold text-base sm:text-lg mb-4 break-all px-2">
              {email}
            </p>
          )}

          <p className="text-gray-600 text-sm sm:text-base">
            Please click the link in the email to confirm your account.
          </p>
        </div>

        {/* Gmail Integration */}
        {isGmail && (
          <div className="mb-6 sm:mb-8">
            <button
              type="button"
              onClick={handleGmailClick}
              className="w-full rounded-xl border cursor-pointer border-[#D8D8D8] h-12 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <Image
                src="/icons/google_ic.png"
                width={27}
                height={27}
                alt="Gmail"
                priority
              />
              <span className="loginInput">Open Gmail</span>
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">
            What to do next:
          </h2>
          <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            <li>Check your email inbox (and spam folder)</li>
            <li>Look for an email from Kind Platform</li>
            <li>Click the "Confirm Email" button or link</li>
          </ol>
        </div>

        {/* Additional Help */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
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
            <div className="flex-1">
              <p className="text-blue-800 text-sm font-medium mb-1">
                Didn't receive the email?
              </p>
              <p className="text-blue-700 text-sm leading-relaxed">
                It may take a few minutes to arrive. Check your spam folder or{" "}
                <Link
                  href="/email-not-confirmed"
                  className="underline hover:text-blue-900 font-medium"
                >
                  request a new one
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <Link href="/login" className="block">
            <Button variant="primary" size="md" fullWidth className="h-12">
              Go to Login
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help?{" "}
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
