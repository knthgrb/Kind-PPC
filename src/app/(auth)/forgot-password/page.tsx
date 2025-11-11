"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth/reset-password";

// Schema for validation
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize react-hook-form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Function to clear error when user starts typing
  const clearError = () => {
    if (error) {
      setError(null);
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        setError(
          error ||
            "An error occurred while sending the reset email. Please try again."
        );
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError(
        "An error occurred while sending the reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 relative">
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
        <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h1>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to your email address.
              </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Didn't receive the email?</strong> Check your spam
                folder or{" "}
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setError(null);
                  }}
                  className="underline hover:no-underline"
                >
                  try again
                </button>
              </p>
            </div>

            <div className="flex justify-center">
              <Link
                href="/login"
                className="h-12 w-[233px] rounded-xl px-4 bg-[#CB0000] text-white cursor-pointer hover:bg-[#A00000] transition-colors flex items-center justify-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative">
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
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
        <h1 className="text-center mb-8 loginH1">Forgot Password</h1>

        <p className="text-center text-gray-600 mb-8">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 loginLabel">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className={`input-placeholder w-full rounded-xl border px-4 h-12 ${
                errors.email ? "border-red-500" : "border-[#ADADAD]"
              }`}
              {...register("email")}
              onChange={(e) => {
                register("email").onChange(e);
                clearError();
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm text-center bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center mb-6">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="h-12 w-[233px] rounded-xl px-4 bg-[#CB0000] text-white cursor-pointer hover:bg-[#A00000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>

        {/* Footer links */}
        <div className="text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="text-[#CB0000] hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
