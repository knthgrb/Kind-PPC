"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signup } from "@/app/_actions/auth/signup";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { logger } from "@/utils/logger";
import { AuthService } from "@/services/client/AuthService";

// Schema for validation
const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  businessName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .max(10, "Please enter a valid phone number")
    .regex(/^9[0-9]{9}$/, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["kindbossing", "kindtao"]),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const params = useParams();
  const role = params.role as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize react-hook-form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: "kindtao", // Default value
    },
  });

  // Update role when it's available
  useEffect(() => {
    if (role) {
      setValue("role", role as "kindbossing" | "kindtao");
    }
  }, [role, setValue]);

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData for the server action
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("password", data.password);
      formData.append("role", data.role);

      if (data.businessName) {
        formData.append("businessName", data.businessName);
      }

      const result = await signup(formData);

      if (result && !result.success) {
        setError(
          result.error || "An error occurred during signup. Please try again."
        );
      }
    } catch (err) {
      setError("An error occurred during signup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle Google OAuth
  const handleGoogleSignIn = async () => {
    const { error } = await AuthService.signInWithGoogle(
      `${window.location.origin}/oauth/google/callback?role=${role}`
    );
    if (error) logger.error("Error:", error);
  };

  const roleTitle = role === "kindbossing" ? "kindBossing" : "kindTao";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
        <h1 className="text-center mb-8 registerH1">Sign up as {roleTitle}</h1>

        {/* Google SSO */}
        <button
          type="button"
          onClick={() => handleGoogleSignIn()}
          className="w-full rounded-md border cursor-pointer border-[#D8D8D8] h-12 px-4 flex items-center justify-center gap-3 mb-8"
        >
          <Image
            src="/icons/google_ic.png"
            width={27}
            height={27}
            alt="Google"
            priority
          />
          <span className="registerInput">Continue with Google</span>
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block mb-2 registerLabel">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="First name"
                className={`registerInput w-full rounded-md border-[1px] px-4 h-12 ${
                  errors.firstName ? "border-red-500" : "border-[#ADADAD]"
                }`}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block mb-2 registerLabel">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                className={`registerInput w-full rounded-md border-[1px] px-4 h-12 ${
                  errors.lastName ? "border-red-500" : "border-[#ADADAD]"
                }`}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Business name - only for kindbossing */}
          {role === "kindbossing" && (
            <div>
              <label
                htmlFor="businessName"
                className="block mb-2 registerLabel"
              >
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                placeholder="BrightCare Homes"
                className={`registerInput w-full rounded-md border-[1px] px-4 h-12 ${
                  errors.businessName ? "border-red-500" : "border-[#ADADAD]"
                }`}
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.businessName.message}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block mb-2 registerLabel">
              Enter your email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Username or email address"
              className={`registerInput w-full rounded-md border-[1px] px-4 h-12 ${
                errors.email ? "border-red-500" : "border-[#ADADAD]"
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block mb-2 registerLabel">
              Enter your Phone
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 rounded-md border-[1px] border-[#ADADAD] h-12 px-3">
                <Image
                  src="/icons/ph_flag.png"
                  width={24}
                  height={16}
                  alt="Philippines Flag"
                />
                <span>+63</span>
              </div>
              <input
                id="phone"
                type="tel"
                placeholder="9XXXXXXXXX"
                maxLength={10}
                className={`registerInput flex-1 rounded-md border-[1px] px-4 h-12 ${
                  errors.phone ? "border-red-500" : "border-[#ADADAD]"
                }`}
                {...register("phone", {
                  onChange: (e) => {
                    // Remove any non-digit characters
                    const value = e.target.value.replace(/\D/g, "");
                    // Ensure it starts with 9
                    if (value && !value.startsWith("9")) {
                      e.target.value = "9" + value.replace(/^9/, "");
                    }
                    e.target.value = value;
                  },
                })}
              />
            </div>
            {errors.phone ? (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Format: 9XXXXXXXXX (e.g., 9096862170)
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block mb-2 registerLabel">
              Enter your Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              className={`registerInput w-full rounded-md border-[1px] px-4 h-12 ${
                errors.password ? "border-red-500" : "border-[#ADADAD]"
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="h-12 w-[233px] rounded-md cursor-pointer px-4 bg-[#CB0000] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? "Creating Account..." : "Register"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center mt-6">
          Have an Account ?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
