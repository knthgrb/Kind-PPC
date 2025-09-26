"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export default function BusinessInfoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("phone")
          .eq("id", user?.id)
          .single();

        if (userData?.phone) {
          setPhoneNumber(userData.phone);
        }
      } catch (error) {
        console.error("Error loading existing data:", error);
      }
    };

    if (user?.id) {
      loadExistingData();
    }
  }, [user?.id, supabase]);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // If it starts with 63, keep it as is
    if (digits.startsWith("63")) {
      return `+${digits}`;
    }

    // If it starts with 0, replace with +63
    if (digits.startsWith("0")) {
      return `+63${digits.substring(1)}`;
    }

    // If it's just 9 digits, add +63
    if (digits.length === 9) {
      return `+63${digits}`;
    }

    // Otherwise, add +63 prefix
    return `+63${digits}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const [{ data: famData, error: familyErr }, { error: userErr }] =
        await Promise.all([
          supabase
            .from("family_profiles")
            .update({
              business_name: businessName.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user!.id)
            .select()
            .single(), // avoids 204, gives you the updated row
          supabase
            .from("users")
            .update({
              phone: formattedPhone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user!.id),
        ]);

      if (familyErr) throw familyErr;
      if (userErr) throw userErr;

      // Redirect to family profile
      router.push("/kindbossing-onboarding/household-info");
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">
          Business Information
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., BrightCare Homes"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 09123456789 or +639123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your phone number with or without +63 prefix
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !businessName.trim() || !phoneNumber.trim()}
            className="w-full bg-[#CC0000] cursor-pointer px-4 py-3 text-white rounded-lg hover:bg-brandColor/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
