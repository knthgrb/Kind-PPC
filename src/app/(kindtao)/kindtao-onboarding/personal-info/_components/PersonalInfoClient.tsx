"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, getMonths, generateYears } from "@/utils/dateUtils";
import { GENDER_OPTIONS, LOCATION_OPTIONS } from "@/constants/onboarding";
import { PersonalInfoForm } from "@/types/onboarding";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/StepperFooter";

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

  const daysInMonth = useMemo(
    () => getDaysInMonth(form.month, form.year),
    [form.month, form.year]
  );

  useEffect(() => {
    if (form.day && Number(form.day) > daysInMonth) {
      setForm((prev) => ({ ...prev, day: "" }));
    }
  }, [form.month, form.year, daysInMonth]);

  return (
    <form className="space-y-6">
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

      {/* Stepper Footer */}
      <StepperFooter
        onNext={() => router.push("/kindtao-onboarding/skills-availability")}
      />
    </form>
  );
}
