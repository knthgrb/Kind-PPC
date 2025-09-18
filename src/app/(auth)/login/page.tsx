"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/actions/auth/login";
import { createClient } from "@/utils/supabase/client";
import { logger } from "@/utils/logger";
import { AuthService } from "@/services/client/AuthService";

// Schema for validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  // Initialize react-hook-form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Function to clear error when user starts typing
  const clearError = () => {
    if (error) {
      setError(null);
      setErrorType(null);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // Create FormData for the server action
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await login(formData);

      // Handle error responses
      if (result && !result.success) {
        setError(
          result.error || "An error occurred during login. Please try again."
        );
        setErrorType(result.errorType || "general_error");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      setErrorType("general_error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle Google OAuth
  const handleGoogleSignIn = async () => {
    const { error } = await AuthService.signInWithGoogle(
      `${window.location.origin}/oauth/google/callback`
    );
    if (error) logger.error("Error:", error);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
        <h1 className="text-center mb-8 loginH1">Login</h1>

        {/* Google SSO */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-md border cursor-pointer border-[#D8D8D8] h-12 px-4 flex items-center justify-center gap-3 mb-8"
        >
          <Image
            src="/icons/google_ic.png"
            width={27}
            height={27}
            alt="Google"
            priority
          />
          <h2 className="loginInput">Continue with Google</h2>
        </button>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username / Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 loginLabel">
              Enter your username or email address
            </label>
            <input
              id="email"
              type="text"
              placeholder="Username or email address"
              className={`input-placeholder w-full rounded-md border-1 px-4 h-12 ${
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

          {/* Password */}
          <div className="mb-2">
            <label htmlFor="password" className="block mb-2 loginLabel">
              Enter your Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              className={`input-placeholder w-full rounded-md border-[1px] px-4 h-12 ${
                errors.password ? "border-red-500" : "border-[#ADADAD]"
              }`}
              {...register("password")}
              onChange={(e) => {
                register("password").onChange(e);
                clearError();
              }}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot password */}
          <div className="mb-6 flex justify-end">
            <Link
              href="/forgot-password"
              className="underline underline-offset-2"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Error message */}
          {error && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm text-center ${
                errorType === "email_not_confirmed"
                  ? "bg-blue-50 border border-blue-200 text-blue-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {errorType === "email_not_confirmed" ? (
                <div>
                  <strong>Email not confirmed!</strong> Please check your email
                  and click the confirmation link before logging in.
                </div>
              ) : (
                error
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center mb-6">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="h-12 w-[233px] rounded-md px-4 bg-[#CB0000] text-white cursor-pointer hover:bg-[#A00000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        {/* Email confirmation note - only show if no error */}
        {!error && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm text-center">
              <strong>New user?</strong> Please check your email and click the
              confirmation link before logging in.
            </p>
          </div>
        )}

        {/* Footer links */}
        <p className="text-center">
          No Account ?{" "}
          <Link href="/signup" className="underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
