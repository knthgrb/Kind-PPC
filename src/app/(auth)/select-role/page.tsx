"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import RoleCard from "@/app/(marketing)/_components/RoleCard";

export default function SelectRolePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleRoleSelection = async (role: "kindbossing" | "kindtao") => {
    if (isLoading) return; // Prevent multiple clicks
    await proceedWithRole(role);
  };

  const proceedWithRole = async (role: "kindbossing" | "kindtao") => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare user metadata with defaults, non-destructive
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) throw new Error("No authenticated user");
      const m = (userRes?.user?.user_metadata || {}) as Record<string, any>;
      const fullName: string | undefined = m.full_name || m.name || undefined;
      const given = m.given_name || (fullName ? fullName.split(" ")[0] : "");
      const family =
        m.family_name ||
        (fullName ? fullName.split(" ").slice(1).join(" ") : "");
      const defaults: Record<string, any> = {
        role,
        first_name: given || "",
        last_name: family || "",
        full_name: fullName || "",
        email: userRes?.user?.email || m.email || "",
        has_completed_onboarding: m.has_completed_onboarding ?? false,
      };
      const toUpdate: Record<string, any> = {};
      for (const [k, v] of Object.entries(defaults)) {
        if (typeof m[k] === "undefined") {
          toUpdate[k] = v;
        }
      }

      // Update user metadata with selected role and defaults
      const { error } = await supabase.auth.updateUser({
        data: Object.keys(toUpdate).length ? toUpdate : { role },
      });

      if (error) throw error;

      // Upsert into users table (first-time Google login or missing row)
      const upsertPayload = {
        id: userRes.user.id,
        role,
        email: userRes.user.email || m.email || "",
        phone: m.phone ?? null, // Keep existing phone or null
        first_name: defaults.first_name,
        last_name: defaults.last_name,
        profile_image_url: defaults.profile_image_url,
      } as Record<string, any>;
      const { error: upsertError } = await supabase
        .from("users")
        .upsert(upsertPayload, { onConflict: "id" });
      if (upsertError) throw upsertError;

      // Redirect to onboarding
      if (role === "kindbossing") {
        router.push("/kindbossing-onboarding/business-info");
      } else {
        router.push("/kindtao-onboarding");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show role selection
  return (
    <main className="min-h-screen flex items-start justify-center px-4 relative">
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
      <section className="w-full max-w-5xl">
        <div className="text-center mt-10 mb-8">
          <h1 className="mb-2 signupH1">Choose Your Role</h1>
          <h2 className="signupH2">
            Are you looking to hire help or find rewarding
            <br /> household work?
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <RoleCard
            selected={false}
            onSelect={() => handleRoleSelection("kindbossing")}
            iconSrc="/icons/reg_kind_bossing.png"
            title="I'm a kindBossing, looking to hire:"
            bullets={[
              "Quickly find verified, reliable help tailored to your family's needs.",
              "Access trusted yayas, caregivers, helpers, drivers, and skilled labor.",
              "Benefit from built-in HR management tools for stress-free hiring.",
            ]}
          />

          <RoleCard
            selected={false}
            onSelect={() => handleRoleSelection("kindtao")}
            iconSrc="/icons/reg_kind_tao.png"
            title="I'm a kindTao, looking for work:"
            bullets={[
              "Easily find flexible and rewarding household employment.",
              "Showcase your skills and connect with kindBossing who value you.",
              "Enjoy secure communication and straightforward job applications.",
            ]}
          />
        </div>

        {error && (
          <div className="flex justify-center mt-6">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center mt-6">
            <p className="text-gray-600 text-center">
              Setting up your account...
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
