"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/buttons";

type Role = "kindbossing" | "kindtao" | null;

export default function RegisterChooseRolePage() {
  const [role, setRole] = useState<Role>(null);

  const onContinue = () => {
    if (!role) return;
    const next =
      role === "kindbossing" ? "/signup/kindbossing" : "/signup/kindtao";
    window.location.href = next;
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
      <section className="w-full max-w-4xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 sm:p-8 md:p-10">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="mb-2 signupH1">Join Kind Today!</h1>
          <h2 className="signupH2 px-2">
            Are you looking to hire help or find rewarding household work?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* kindBossing Card */}
          <button
            type="button"
            onClick={() => setRole("kindbossing")}
            className={`group relative cursor-pointer text-left rounded-xl border-2 p-5 sm:p-6 transition-all duration-200 hover:shadow-md ${
              role === "kindbossing"
                ? "border-[#CB0000] bg-red-50/30"
                : "border-[#DCDCDC] bg-white hover:border-[#CB0000]/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-colors ${
                  role === "kindbossing"
                    ? "bg-[#CB0000]"
                    : "bg-gray-100 group-hover:bg-red-50"
                }`}
              >
                <Image
                  src="/icons/reg_kind_bossing.png"
                  width={24}
                  height={24}
                  alt="kindBossing"
                  className={`transition-all ${
                    role === "kindbossing" ? "brightness-0 invert" : ""
                  }`}
                />
              </div>
              {role === "kindbossing" && (
                <div className="w-5 h-5 rounded-full bg-[#CB0000] flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            <h3
              className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 transition-colors ${
                role === "kindbossing" ? "text-[#CB0000]" : "text-gray-900"
              }`}
            >
              I'm a kindBossing, looking to hire:
            </h3>

            <ul className="space-y-2 sm:space-y-2.5">
              {[
                "Quickly find verified, reliable help tailored to your family's needs.",
                "Access trusted yayas, caregivers, helpers, drivers, and skilled labor.",
                "Benefit from built-in HR management tools for stress-free hiring.",
              ].map((bullet, index) => (
                <li
                  key={index}
                  className="text-sm sm:text-base text-gray-600 leading-relaxed flex items-start gap-2"
                >
                  <span
                    className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${
                      role === "kindbossing" ? "bg-[#CB0000]" : "bg-gray-400"
                    }`}
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </button>

          {/* kindTao Card */}
          <button
            type="button"
            onClick={() => setRole("kindtao")}
            className={`group relative cursor-pointer text-left rounded-xl border-2 p-5 sm:p-6 transition-all duration-200 hover:shadow-md ${
              role === "kindtao"
                ? "border-[#CB0000] bg-red-50/30"
                : "border-[#DCDCDC] bg-white hover:border-[#CB0000]/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-colors ${
                  role === "kindtao"
                    ? "bg-[#CB0000]"
                    : "bg-gray-100 group-hover:bg-red-50"
                }`}
              >
                <Image
                  src="/icons/reg_kind_tao.png"
                  width={24}
                  height={24}
                  alt="kindTao"
                  className={`transition-all ${
                    role === "kindtao" ? "brightness-0 invert" : ""
                  }`}
                />
              </div>
              {role === "kindtao" && (
                <div className="w-5 h-5 rounded-full bg-[#CB0000] flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            <h3
              className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 transition-colors ${
                role === "kindtao" ? "text-[#CB0000]" : "text-gray-900"
              }`}
            >
              I'm a kindTao, looking for work:
            </h3>

            <ul className="space-y-2 sm:space-y-2.5">
              {[
                "Easily find flexible and rewarding household employment.",
                "Showcase your skills and connect with kindBossing who value you.",
                "Enjoy secure communication and straightforward job applications.",
              ].map((bullet, index) => (
                <li
                  key={index}
                  className="text-sm sm:text-base text-gray-600 leading-relaxed flex items-start gap-2"
                >
                  <span
                    className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${
                      role === "kindtao" ? "bg-[#CB0000]" : "bg-gray-400"
                    }`}
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onContinue}
            disabled={!role}
            className="h-12 w-full sm:w-[230px]"
          >
            Create Your Account
          </Button>
        </div>

        <p className="text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-[#CB0000] hover:underline">
            Log In
          </Link>
        </p>
      </section>
    </main>
  );
}
