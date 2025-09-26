"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK, TIME_SLOTS } from "@/constants/onboarding";
import { DayOfWeek, TimeSlot } from "@/types/onboarding";
import PillToggle from "@/components/onboarding/PillToggle";
import StepperFooter from "@/components/StepperFooter";
import { createClient } from "@/utils/supabase/client";

export default function SkillsAvailabilityClient() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(["cooking", "cleaning"]);
  const [skillInput, setSkillInput] = useState("");

  const [daysExpanded, setDaysExpanded] = useState(true);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    "Monday",
    "Wednesday",
    "Friday",
  ]);

  const [timeSlotExpanded, setTimeSlotExpanded] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("Evening");
  const [slotMorning, setSlotMorning] = useState(false);
  const [slotEvening, setSlotEvening] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isClickingDropdown = useRef(false);

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from("helper_profiles")
          .select("skills, availability_schedule")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          if (profileData.skills && Array.isArray(profileData.skills)) {
            setSkills(profileData.skills);
          }
          if (profileData.availability_schedule) {
            const schedule = profileData.availability_schedule as Record<
              string,
              Record<string, unknown>
            >;
            const availableDays = Object.keys(schedule).filter(
              (day) => schedule[day]?.available === true
            );
            setSelectedDays(availableDays as DayOfWeek[]);
          }
        }
      } catch (error) {
        console.error("Error loading existing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, []);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setSkillDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const allDays: DayOfWeek[] = useMemo(() => [...DAYS_OF_WEEK], []);

  // Valid skills from database enum
  const VALID_SKILLS = [
    "childcare",
    "elderly_care",
    "cooking",
    "cleaning",
    "driving",
    "pet_care",
    "tutoring",
  ];

  // Filter skills based on input and already selected skills
  const filteredSkills = VALID_SKILLS.filter(
    (skill) =>
      !skills.includes(skill) &&
      skill.toLowerCase().includes(skillInput.toLowerCase())
  );

  // Helper function to capitalize skill names for display
  const capitalizeSkill = (skill: string) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1).replace("_", " ");
  };

  const addSkill = (skill: string) => {
    if (!skill) return;
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setSkillInput("");
    setSkillDropdownOpen(false);
  };

  const removeSkill = (s: string) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  const toggleDay = (d: DayOfWeek) =>
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setSkillInput(input);
    setSkillDropdownOpen(true);
  };

  const handleSkillInputBlur = () => {
    // Only close if we're not clicking on the dropdown
    if (!isClickingDropdown.current) {
      setTimeout(() => setSkillDropdownOpen(false), 150);
    }
  };

  const handleSkillClick = (skill: string) => {
    isClickingDropdown.current = true;
    addSkill(skill);
    // Reset the flag after a short delay
    setTimeout(() => {
      isClickingDropdown.current = false;
    }, 100);
  };

  const handleNext = async () => {
    if (skills.length === 0) {
      setSaveError("Please add at least one skill");
      return;
    }

    if (selectedDays.length === 0) {
      setSaveError("Please select at least one day");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("User not authenticated");
        return;
      }

      // Create availability schedule
      const availabilitySchedule: Record<
        string,
        {
          available: boolean;
          timeSlot: TimeSlot;
          morning: boolean;
          evening: boolean;
        }
      > = {};
      selectedDays.forEach((day) => {
        availabilitySchedule[day.toLowerCase()] = {
          available: true,
          timeSlot: timeSlot,
          morning: slotMorning,
          evening: slotEvening,
        };
      });

      // Check if helper_profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from("helper_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let saveResult;
      if (existingProfile) {
        // Update existing profile
        saveResult = await supabase
          .from("helper_profiles")
          .update({
            skills: skills,
            availability_schedule: availabilitySchedule,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Create new profile
        saveResult = await supabase.from("helper_profiles").insert({
          user_id: user.id,
          skills: skills,
          availability_schedule: availabilitySchedule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (saveResult.error) {
        setSaveError(`Failed to save data: ${saveResult.error.message}`);
        return;
      }

      // Redirect to next stage
      router.push("/kindtao-onboarding/work-history");
    } catch {
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
          <p className="text-blue-600 text-sm">Loading your data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Skills */}
      <div className="mb-6">
        <label className="block mb-2 stepsLabel">Skills</label>
        <div className="rounded-md border border-[#DFDFDF] p-2 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-md border border-[#DFDFDF] px-3 py-1 stepsSkills bg-[#DFDFDF]"
            >
              {capitalizeSkill(s)}
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

          {/* Skills Dropdown */}
          <div className="relative flex-1 min-w-[160px]">
            <input
              value={skillInput}
              onChange={handleSkillInputChange}
              onFocus={() => setSkillDropdownOpen(true)}
              onBlur={handleSkillInputBlur}
              placeholder="Type to search skills..."
              className="w-full outline-none px-1"
              ref={inputRef}
            />

            {/* Dropdown Options */}
            {skillDropdownOpen && filteredSkills.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DFDFDF] rounded-md shadow-lg z-20 max-h-48 overflow-y-auto"
                ref={dropdownRef}
              >
                {filteredSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillClick(skill)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {capitalizeSkill(skill)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Valid skills: childcare, elderly_care, cooking, cleaning, driving,
            pet_care, tutoring
          </div>
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
            className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 flex items-center justify-between"
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
              {TIME_SLOTS.map((o) => (
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

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      {/* Loading State */}
      {isSaving && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
          <p className="text-blue-600 text-sm">
            Saving your skills & availability...
          </p>
        </div>
      )}

      <StepperFooter
        onBack={() => router.push("/kindtao-onboarding/personal-info")}
        onNext={isSaving ? undefined : handleNext}
        nextLabel={isSaving ? "Saving..." : "Next"}
      />
    </>
  );
}
