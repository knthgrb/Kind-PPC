"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, getMonths, generateYears } from "@/utils/dateUtils";
import { GENDER_OPTIONS, LOCATION_OPTIONS } from "@/constants/onboarding";
import { PersonalInfoForm } from "@/types/onboarding";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/StepperFooter";
import { createClient } from "@/utils/supabase/client";
import { logger } from "@/utils/logger";
import { UserService } from "@/services/client/UserService";
import { updateUserMetadata } from "@/app/_actions/user/updateUserMetadata";

export default function PersonalInfoClient() {
  const router = useRouter();
  const months = getMonths();
  const years = generateYears(100);

  const [form, setForm] = useState<PersonalInfoForm>({
    day: "",
    month: "",
    year: "",
    gender: "Male",
    location: "Philippines",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const daysInMonth = useMemo(
    () => getDaysInMonth(form.month, form.year),
    [form.month, form.year]
  );

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from("users")
          .select("date_of_birth, gender")
          .eq("id", user.id)
          .single();

        if (userData?.date_of_birth) {
          const date = new Date(userData.date_of_birth);
          setForm((prev) => ({
            ...prev,
            day: date.getDate().toString(),
            month: (date.getMonth() + 1).toString(),
            year: date.getFullYear().toString(),
            gender: userData.gender || prev.gender,
          }));
        }
      } catch (error) {
        console.error("Error loading existing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, []);

  useEffect(() => {
    if (form.day && Number(form.day) > daysInMonth) {
      setForm((prev) => ({ ...prev, day: "" }));
    }
  }, [form.day, form.month, form.year, daysInMonth]);

  const handleNext = async () => {
    if (!form.day || !form.month || !form.year) {
      setSaveError("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const supabase = createClient();

      // Convert to date format for database (YYYY-MM-DD)
      const dateOfBirth = `${form.year}-${form.month.padStart(
        2,
        "0"
      )}-${form.day.padStart(2, "0")}`;

      const { error, data } = await updateUserMetadata({
        date_of_birth: dateOfBirth,
        gender: form.gender,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        logger.error("❌ Error saving personal info:", error);
        setSaveError(`Failed to save data: ${error}`);
        return;
      }

      // Redirect to next stage
      router.push("/onboarding/skills-availability");
    } catch (err) {
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600 text-sm">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date of Birth */}
      <div>
        <label className="block mb-2 stepsLabel">Date of Birth</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Day */}
          <Dropdown
            value={form.day}
            options={Array.from({ length: daysInMonth }, (_, i) =>
              String(i + 1)
            )}
            onChange={(day) => setForm({ ...form, day })}
            placeholder="Day"
            className="rounded-lg border border-[#DFDFDF]"
          />

          {/* Month */}
          <Dropdown
            value={form.month}
            options={months}
            onChange={(month) => setForm({ ...form, month })}
            placeholder="Month"
            className="rounded-lg border border-[#DFDFDF]"
          />

          {/* Year */}
          <Dropdown
            value={form.year}
            options={years.map(String)}
            onChange={(year) => setForm({ ...form, year })}
            placeholder="Year"
            className="rounded-lg border border-[#DFDFDF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gender */}
        <div>
          <label className="block mb-2 stepsLabel">Gender</label>
          <Dropdown
            value={form.gender}
            options={[...GENDER_OPTIONS]}
            onChange={(gender) =>
              setForm({ ...form, gender: gender as typeof form.gender })
            }
            placeholder="Select Gender"
            className="rounded-lg border border-[#DFDFDF]"
          />
        </div>

        {/* Location */}
        <div className="sm:col-span-2">
          <label className="block mb-2 stepsLabel">Location</label>
          <Dropdown
            value={form.location}
            options={[...LOCATION_OPTIONS]}
            onChange={(location) =>
              setForm({ ...form, location: location as typeof form.location })
            }
            placeholder="Select Location"
            className="rounded-lg border border-[#DFDFDF]"
          />
        </div>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      {/* Loading State */}
      {isSaving && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600 text-sm">Saving your data...</p>
        </div>
      )}

      {/* Stepper Footer */}
      <StepperFooter
        onNext={isSaving ? undefined : handleNext}
        nextLabel={isSaving ? "Saving..." : "Next"}
      />
    </div>
  );
}
