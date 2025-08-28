"use client";

import { useState, useMemo, useEffect } from "react";
import Stepper from "@/components/Stepper";
import StepperFooter from "@/components/StepperFooter";
import { useRouter } from "next/navigation";
import { getDaysInMonth, generateYears, getMonths } from "@/utils/dateOfBirth";

export default function PersonalInfoForm() {
  const router = useRouter();
  const months = getMonths();
  const years = generateYears(100);

  const [form, setForm] = useState({
    day: "",
    month: "",
    year: "",
    gender: "Male",
    location: "Philippines",
  });

  const [dayExpanded, setDayExpanded] = useState(false);
  const [monthExpanded, setMonthExpanded] = useState(false);
  const [yearExpanded, setYearExpanded] = useState(false);
  const [genderExpanded, setGenderExpanded] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);

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
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8 bg-white">
        <Stepper steps={4} activeStep={1} />
        <br />
        <h1 className="mb-6 stepsH1">Personal Information</h1>

        <form className="space-y-6">
          {/* Date of Birth */}
          <div>
            <label className="block mb-2 stepsLabel">Date of Birth</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Day */}
              <Dropdown
                label={form.day || "Day"}
                expanded={dayExpanded}
                onToggle={() => setDayExpanded((v) => !v)}
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (d) => (
                    <DropdownOption
                      key={d}
                      isActive={form.day === String(d)}
                      onClick={() => {
                        setForm({ ...form, day: String(d) });
                        setDayExpanded(false);
                      }}
                    >
                      {d}
                    </DropdownOption>
                  )
                )}
              </Dropdown>

              {/* Month */}
              <Dropdown
                label={form.month || "Month"}
                expanded={monthExpanded}
                onToggle={() => setMonthExpanded((v) => !v)}
              >
                {months.map((m) => (
                  <DropdownOption
                    key={m}
                    isActive={form.month === String(m)}
                    onClick={() => {
                      setForm({ ...form, month: String(m) });
                      setMonthExpanded(false);
                    }}
                  >
                    {m}
                  </DropdownOption>
                ))}
              </Dropdown>

              {/* Year */}
              <Dropdown
                label={form.year || "Year"}
                expanded={yearExpanded}
                onToggle={() => setYearExpanded((v) => !v)}
              >
                {years.map((y) => (
                  <DropdownOption
                    key={y}
                    isActive={form.year === String(y)}
                    onClick={() => {
                      setForm({ ...form, year: String(y) });
                      setYearExpanded(false);
                    }}
                  >
                    {y}
                  </DropdownOption>
                ))}
              </Dropdown>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Gender */}
            <div>
              <label className="block mb-2 stepsLabel">Gender</label>
              <Dropdown
                label={form.gender}
                expanded={genderExpanded}
                onToggle={() => setGenderExpanded((v) => !v)}
              >
                {["Male", "Female", "Other"].map((g) => (
                  <DropdownOption
                    key={g}
                    isActive={form.gender === g}
                    onClick={() => {
                      setForm({ ...form, gender: g });
                      setGenderExpanded(false);
                    }}
                  >
                    {g}
                  </DropdownOption>
                ))}
              </Dropdown>
            </div>

            {/* Location */}
            <div className="sm:col-span-2">
              <label className="block mb-2 stepsLabel">Location</label>
              <Dropdown
                label={form.location}
                expanded={locationExpanded}
                onToggle={() => setLocationExpanded((v) => !v)}
              >
                {["Philippines", "USA", "UK", "Canada", "India"].map((loc) => (
                  <DropdownOption
                    key={loc}
                    isActive={form.location === loc}
                    onClick={() => {
                      setForm({ ...form, location: loc });
                      setLocationExpanded(false);
                    }}
                  >
                    {loc}
                  </DropdownOption>
                ))}
              </Dropdown>
            </div>
          </div>

          {/* Stepper Footer */}
          <StepperFooter
            onNext={() => router.push("/onboarding/skills-availability")}
          />
        </form>
      </section>
    </main>
  );
}

/* --- Small reusable UI helpers --- */
function Dropdown({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 flex items-center justify-between"
      >
        <span className="truncate">{label}</span>
        <span>▾</span>
      </button>

      {expanded && (
        <div className="absolute mt-2 w-full max-h-60 overflow-y-auto rounded-md border border-[#DFDFDF] bg-white shadow-sm z-10">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-2",
        isActive ? "bg-[#F3F3F3]" : "hover:bg-[#F8F8F8]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
