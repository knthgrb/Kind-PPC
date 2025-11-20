"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { logger } from "@/utils/logger";
import { AuthService } from "@/services/AuthService";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons";
import { authClient } from "@/lib/auth-client";

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
  const router = useRouter();
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

  const routeAfterLogin = async () => {
    try {
      const response = await fetch("/api/users/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        router.replace("/recs");
        return;
      }

      const payload = await response.json();
      const user = payload.user;

      if (!user?.role) {
        router.replace("/select-role");
        return;
      }

      if (user.role === "kindbossing") {
        const target = user.has_completed_onboarding
          ? "/my-job-posts"
          : "/kindbossing-onboarding/business-info";
        router.replace(target);
        return;
      }

      if (user.role === "kindtao") {
        const target = user.has_completed_onboarding
          ? "/recs"
          : "/kindtao-onboarding";
        router.replace(target);
        return;
      }

      if (user.role === "admin") {
        router.replace("/admin");
        return;
      }

      router.replace("/");
    } catch (apiError) {
      logger.error("Failed to determine role after login:", apiError);
      router.replace("/recs");
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // Use Better Auth client for sign in
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        if (result.error.message?.includes("email not verified") || result.error.message?.includes("Email not confirmed")) {
          setError(
            "Email not confirmed! Please check your email and click the confirmation link before logging in."
          );
          setErrorType("email_not_confirmed");
        } else {
          setError(
            result.error.message ||
              "An error occurred during login. Please try again."
          );
          setErrorType("general_error");
        }
        return;
      }
      
      // Refresh to update auth state
      router.refresh();
      await routeAfterLogin();
    } catch (err) {
      logger.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
      setErrorType("general_error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorType(null);
      
    const { error } = await AuthService.signInWithGoogle(
      `${window.location.origin}/oauth/google/callback`
    );
      
      if (error) {
        // Only log if error has a meaningful message
        const errorMessage = error instanceof Error 
          ? error.message 
          : (error as any)?.message || String(error);
        
        if (errorMessage && errorMessage !== "{}" && errorMessage !== "[object Object]") {
          logger.error("Google sign-in error:", error);
          setError(errorMessage || "An error occurred during Google sign-in. Please try again.");
          setErrorType("general_error");
        }
        // Note: OAuth redirects the browser, so if there's no error message,
        // the redirect likely succeeded and we don't need to show an error
      }
    } catch (err) {
      logger.error("Google sign-in exception:", err);
      setError("An error occurred during Google sign-in. Please try again.");
      setErrorType("general_error");
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-center mb-8 loginH1">Login</h1>

        {/* Google SSO */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full rounded-xl border cursor-pointer border-[#D8D8D8] hover:bg-gray-50 h-12 px-4 flex items-center justify-center gap-3 mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Image
            src="/icons/google_ic.png"
            width={27}
            height={27}
            alt="Google"
            priority
          />
          <h2 className="loginInput">
            {isLoading ? "Signing in..." : "Continue with Google"}
          </h2>
        </button>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username / Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 loginLabel">
              Enter your email address
            </label>
            <input
              id="email"
              type="text"
              placeholder="Username or email address"
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

          {/* Password */}
          <div className="mb-2">
            <label htmlFor="password" className="block mb-2 loginLabel">
              Enter your Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              className={`input-placeholder w-full rounded-xl border px-4 h-12 ${
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
          <div className="my-6 text-center">
            <Link
              href="/forgot-password"
              className="text-[#CB0000] hover:underline"
            >
              Forgot password?
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
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSubmitting || isLoading}
            className="h-12 mb-6"
          >
            {isSubmitting || isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Footer links */}
        <p className="text-center">
          Don't have an account yet?{" "}
          <Link href="/signup" className="text-[#CB0000] hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
