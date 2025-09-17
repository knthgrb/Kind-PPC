"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SelectRolePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "kindbossing" | "kindtao" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleRoleSelection = async (role: "kindbossing" | "kindtao") => {
    if (role === "kindbossing") {
      // Populate defaults plus role, non-destructively, then redirect to business-info
      const { data: userRes } = await supabase.auth.getUser();
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
        email: userRes?.user?.email || m.email || "",
        phone: m.phone ?? null,
        business_name: m.business_name ?? null,
        date_of_birth: m.date_of_birth ?? null,
        gender: m.gender ?? null,
        profile_image_url: m.avatar_url ?? m.picture ?? null,
        full_address: m.full_address ?? null,
        city: m.city ?? null,
        province: m.province ?? null,
        postal_code: m.postal_code ?? null,
        verification_status: m.verification_status ?? "pending",
        subscription_tier: m.subscription_tier ?? "free",
        swipe_credits: m.swipe_credits ?? 10,
        boost_credits: m.boost_credits ?? 0,
        has_completed_onboarding: m.has_completed_onboarding ?? false,
      };
      const toUpdate: Record<string, any> = {};
      for (const [k, v] of Object.entries(defaults)) {
        if (typeof m[k] === "undefined") {
          toUpdate[k] = v;
        }
      }
      const { error } = await supabase.auth.updateUser({
        data: Object.keys(toUpdate).length ? toUpdate : { role },
      });
      if (error) throw error;
      router.push("/family-profile/business-info");
      return;
    }

    // For kindtao, proceed directly
    await proceedWithRole(role);
  };

  const proceedWithRole = async (role: "kindbossing" | "kindtao") => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare user metadata with defaults, non-destructive
      const { data: userRes } = await supabase.auth.getUser();
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
        email: userRes?.user?.email || m.email || "",
        phone: m.phone ?? null,
        business_name: m.business_name ?? null,
        date_of_birth: m.date_of_birth ?? null,
        gender: m.gender ?? null,
        profile_image_url: m.avatar_url ?? m.picture ?? null,
        full_address: m.full_address ?? null,
        city: m.city ?? null,
        province: m.province ?? null,
        postal_code: m.postal_code ?? null,
        verification_status: m.verification_status ?? "pending",
        subscription_tier: m.subscription_tier ?? "free",
        swipe_credits: m.swipe_credits ?? 10,
        boost_credits: m.boost_credits ?? 0,
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

      // Redirect to onboarding
      router.push("/onboarding/personal-info");
    } catch (error) {
      console.error("Error updating role:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show role selection
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">
          Choose Your Role
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleRoleSelection("kindtao")}
            disabled={isLoading}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-4">
              I'm looking for work (kindTao)
            </h2>
            <p className="text-gray-600">
              Find flexible household employment opportunities
            </p>
          </button>

          <button
            onClick={() => handleRoleSelection("kindbossing")}
            disabled={isLoading}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-4">
              I'm looking to hire (kindBossing)
            </h2>
            <p className="text-gray-600">
              Find reliable help for your household needs
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
