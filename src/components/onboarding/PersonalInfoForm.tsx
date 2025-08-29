"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, getMonths, generateYears } from "@/helpers/dateUtils";
import { GENDER_OPTIONS, LOCATION_OPTIONS } from "@/constants/onboarding";
import { PersonalInfoForm } from "@/types/onboarding";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/StepperFooter";
import { createClient } from "@/utils/supabase/client";

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

  const daysInMonth = useMemo(
    () => getDaysInMonth(form.month, form.year),
    [form.month, form.year]
  );

  useEffect(() => {
    if (form.day && Number(form.day) > daysInMonth) {
      setForm((prev) => ({ ...prev, day: "" }));
    }
  }, [form.month, form.year, daysInMonth]);

  const handleNext = async () => {
    if (!form.day || !form.month || !form.year) {
      setSaveError("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("User not authenticated");
        return;
      }

      console.log("🔄 Saving personal info for user:", user.id);
      console.log("📅 Form data:", form);

      // Convert to date format for database (YYYY-MM-DD)
      const dateOfBirth = `${form.year}-${form.month.padStart(2, '0')}-${form.day.padStart(2, '0')}`;
      console.log("📅 Converted date:", dateOfBirth);

      // Save to users table
      const { error: saveError } = await supabase
        .from('users')
        .update({
          date_of_birth: dateOfBirth,
          gender: form.gender,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (saveError) {
        console.error("❌ Error saving personal info:", saveError);
        setSaveError(`Failed to save data: ${saveError.message}`);
        return;
      }

      console.log("✅ Personal info saved successfully!");
      console.log("📊 Updated fields: date_of_birth, gender, updated_at");
      
      // Redirect to next stage
      router.push("/onboarding/skills-availability");
      
    } catch (err) {
      console.error("❌ Unexpected error saving personal info:", err);
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
