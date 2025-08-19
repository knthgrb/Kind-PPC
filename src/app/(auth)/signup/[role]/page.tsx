"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signup } from "@/app/_actions/auth/signup";

export default function SignUpPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const [role, setRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get role from params when component mounts
  useEffect(() => {
    params.then(({ role }) => setRole(role));
  }, [params]);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add the role to the form data
      formData.append("role", role);
      await signup(formData);
    } catch (err) {
      setError("An error occurred during signup. Please try again.");
      setIsLoading(false);
    }
  };

  const roleTitle = role === "bossing" ? "kindBossing" : "kindTao";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
        <h1 className="text-center mb-8 registerH1">Sign up as {roleTitle}</h1>

        {/* Google SSO */}
        <button
          type="button"
          className="w-full rounded-md border border-[#D8D8D8] h-12 px-4 flex items-center justify-center gap-3 mb-8"
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

        <form action={handleSubmit} className="space-y-6">
          {/* Name row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block mb-2 registerLabel">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                required
                className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block mb-2 registerLabel">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last Name"
                required
                className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
              />
            </div>
          </div>

          {/* Business name - only for bossing */}
          {role === "bossing" && (
            <div>
              <label
                htmlFor="businessName"
                className="block mb-2 registerLabel"
              >
                Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="BrightCare Homes"
                required
                className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block mb-2 registerLabel">
              Enter your email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Username or email address"
              required
              className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
            />
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
                name="phone"
                type="tel"
                placeholder="9XXXXXXXXX"
                required
                maxLength={10}
                pattern="^9[0-9]{9}$"
                title="Please enter a valid Philippine mobile number starting with 9 (e.g., 9096862170)"
                className="registerInput flex-1 rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
                onChange={(e) => {
                  // Remove any non-digit characters
                  const value = e.target.value.replace(/\D/g, "");
                  // Ensure it starts with 9
                  if (value && !value.startsWith("9")) {
                    e.target.value = "9" + value.replace(/^9/, "");
                  }
                  e.target.value = value;
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: 9XXXXXXXXX (e.g., 9096862170)
            </p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block mb-2 registerLabel">
              Enter your Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              required
              minLength={6}
              className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-[233px] rounded-md cursor-pointer px-4 bg-[#CB0000] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Register"}
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
