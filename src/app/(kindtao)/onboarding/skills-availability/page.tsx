"use client";

import { useMemo, useState } from "react";
import Stepper from "@/components/Stepper";
import { useRouter } from "next/navigation";
import StepperFooter from "@/components/StepperFooter";
import Image from "next/image";

type Day =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export default function SkillsAvailabilityPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(["Cooking", "Cleaning"]);
  const [skillInput, setSkillInput] = useState("");

  const [daysExpanded, setDaysExpanded] = useState(true);
  const [selectedDays, setSelectedDays] = useState<Day[]>([
    "Monday",
    "Wednesday",
    "Friday",
  ]);

  const [timeSlotExpanded, setTimeSlotExpanded] = useState(false);
  const [timeSlot, setTimeSlot] = useState("Evening");
  const [slotMorning, setSlotMorning] = useState(false);
  const [slotEvening, setSlotEvening] = useState(true);

  const allDays: Day[] = useMemo(
    () => [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    []
  );

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  const toggleDay = (d: Day) =>
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8">
        {/* Stepper (set active step as needed) */}
        <Stepper steps={4} activeStep={2} />
        <br />
        <h1 className="mb-4 stepsH1">Skills &amp; Availability</h1>

        {/* Skills */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Skills</label>
          <div className="rounded-md border border-[#DFDFDF] p-2 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-2 rounded-md border border-[#DFDFDF] px-3 py-1 stepsSkills bg-[#DFDFDF]"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="rounded-sm -mt-1 leading-none"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}

            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" ? (e.preventDefault(), addSkill()) : null
              }
              placeholder="Type a skill and press Enter"
              className="flex-1 min-w-[160px] outline-none px-1"
            />
          </div>
        </div>

        {/* Days Available */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Days Available</label>

          {/* wrapper controls positioning + spacing when open */}
          <div className={["relative", daysExpanded ? "pb-24" : ""].join(" ")}>
            <button
              type="button"
              onClick={() => setDaysExpanded((v) => !v)}
              className="w-full h-12 rounded-md border px-4 flex items-center justify-between"
            >
              <span className="truncate">
                {selectedDays.length ? selectedDays.join(", ") : "Select days"}
              </span>
              <span>▾</span>
            </button>

            {daysExpanded && (
              <div
                className="
          absolute right-0 mt-3
          w-[80%] md:w-[520px] max-w-full
          rounded-md bg-[#EDEDED] border border-[#EDEDED]
          p-4 shadow-sm
        "
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allDays.map((d) => {
                    const checked = selectedDays.includes(d);
                    return (
                      <label key={d} className="inline-flex items-center gap-2">
                        {/* custom checkbox */}
                        <span
                          className={[
                            "inline-flex items-center justify-center",
                            "w-5 h-5 rounded-[4px] border flex-shrink-0",
                            checked
                              ? "border-[#CC0000] bg-[#CC0000]"
                              : "border-[#667282] bg-[#EDEDED]",
                            "transition-colors",
                          ].join(" ")}
                        >
                          {checked && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDay(d)}
                          className="sr-only"
                        />
                        <span>{d}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots */}
        <div className="mb-8">
          <label className="block mb-2 stepsLabel">Time Slots</label>

          <button
            type="button"
            onClick={() => setTimeSlotExpanded((v) => !v)}
            className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 flex items-center justify-between"
          >
            <span className="truncate">{timeSlot}</span>
            <span>▾</span>
          </button>

          {timeSlotExpanded && (
            <div className="mt-3 rounded-md border border-[#DFDFDF] p-3">
              <ul className="space-y-2">
                {["Morning", "Afternoon", "Evening"].map((o) => (
                  <li key={o}>
                    <button
                      type="button"
                      onClick={() => setTimeSlot(o)}
                      className={[
                        "w-full text-left px-3 py-2 rounded-md",
                        timeSlot === o ? "bg-[#F3F3F3]" : "hover:bg-[#F8F8F8]",
                      ].join(" ")}
                    >
                      {o}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Morning/Evening toggles aligned to the right */}
          <div className="mt-3 flex justify-end gap-3">
            <PillToggle
              label="Morning"
              checked={slotMorning}
              onChange={() => setSlotMorning((v) => !v)}
            />
            <PillToggle
              label="Evening"
              checked={slotEvening}
              onChange={() => setSlotEvening((v) => !v)}
            />
          </div>
        </div>

        <StepperFooter
          onBack={() => router.push("/onboarding/personal-info")}
          onNext={() => router.push("/onboarding/work-history")}
        />
      </section>
    </main>
  );
}

/* --- Small UI helpers --- */
function PillToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="h-9 rounded-md px-3 border border-[#DFDFDF] bg-[#F5F5F5] flex items-center gap-2"
    >
      {/* checkbox square */}
      <span
        className={[
          "inline-flex items-center justify-center",
          "w-5 h-5 rounded-[4px] border flex-shrink-0",
          checked
            ? "border-[#CC0000] bg-[#CC0000]"
            : "border-[#667282] bg-[#EDEDED]",
          "transition-colors",
        ].join(" ")}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>

      <span>{label}</span>
    </button>
  );
}
