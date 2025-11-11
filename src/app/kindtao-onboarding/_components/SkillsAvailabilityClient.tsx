"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK, TIME_SLOTS } from "@/constants/onboarding";
import { DayOfWeek, TimeSlot } from "@/types/onboarding";
import PillToggle from "@/components/toggle/PillToggle";
import StepperFooter from "@/components/common/StepperFooter";
import Dropdown from "@/components/dropdown/Dropdown";
import { useKindTaoOnboardingStore } from "@/stores/useKindTaoOnboardingStore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type SkillsAvailabilityProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export default function SkillsAvailabilityClient({
  onNext,
  onBack,
}: SkillsAvailabilityProps) {
  const router = useRouter();
  const { setSkillsAvailability, skillsAvailability } =
    useKindTaoOnboardingStore();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [daysExpanded, setDaysExpanded] = useState(true);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);

  const [slotMorning, setSlotMorning] = useState(true);
  const [slotEvening, setSlotEvening] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // react-hook-form schema for extra fields
  const schema = z.object({
    languages: z.array(z.string()).optional(),
  });

  type ExtraForm = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExtraForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      languages: ["Tagalog"],
    },
  });

  const languages = watch("languages") || [];
  const extra = watch();

  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isClickingDropdown = useRef(false);

  // Load existing data when component mounts
  useEffect(() => {
    console.log(
      "SkillsAvailabilityClient: Loading data from store",
      skillsAvailability
    );
    if (skillsAvailability) {
      // Load skills
      if (skillsAvailability.skills && skillsAvailability.skills.length > 0) {
        console.log("Loading skills:", skillsAvailability.skills);
        setSkills(skillsAvailability.skills);
      }

      // Load availability schedule
      if (skillsAvailability.availabilitySchedule) {
        const availableDays: DayOfWeek[] = [];
        Object.entries(skillsAvailability.availabilitySchedule).forEach(
          ([day, schedule]) => {
            if (schedule.available) {
              const dayName = (day.charAt(0).toUpperCase() +
                day.slice(1)) as DayOfWeek;
              availableDays.push(dayName);
            }
          }
        );
        if (availableDays.length > 0) {
          console.log("Loading selected days:", availableDays);
          setSelectedDays(availableDays);
        }

        // Load time slots from first available day
        const firstDay = Object.values(
          skillsAvailability.availabilitySchedule
        )[0];
        if (firstDay) {
          console.log("Loading time slots:", {
            morning: firstDay.morning,
            evening: firstDay.evening,
          });
          setSlotMorning(firstDay.morning);
          setSlotEvening(firstDay.evening);
        }
      }

      // Load languages
      if (
        skillsAvailability.languages &&
        skillsAvailability.languages.length > 0
      ) {
        console.log("Loading languages:", skillsAvailability.languages);
        setValue("languages", skillsAvailability.languages);
      }
    }
  }, [skillsAvailability, setValue]);

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

  // Valid skills from database enum + expanded suggestions based on job categories
  const VALID_SKILLS = [
    // Maintenance & Repairs
    "plumbing",
    "painting",
    "masonry",
    "welding",
    "aircon_repair",
    "handyman",
    "pest_control",
    "warehouse_management",

    // Care & Support
    "nanny",
    "yaya",
    "kasambahay",
    "alalay",
    "bantay",
    "nursing",
    "therapy",
    "elderly_care",
    "childcare",
    "babysitting",

    // Household Management
    "laundry",
    "ironing",
    "cleaning",
    "housekeeping",
    "house_management",
    "errands",
    "messenger",

    // Food Services
    "cooking",
    "cooking_filipino",
    "cooking_western",
    "baking",
    "kitchen_helper",
    "grocery_shopping",
    "market_buying",

    // Property & Outdoor
    "gardening",
    "pool_cleaning",
    "house_watching",
    "security",
    "guarding",

    // Specialized
    "tutoring",
    "tutor_math",
    "tutor_english",
    "sewing",
    "tailoring",
    "driving",
    "driving_manual",
    "driving_automatic",
    "massage",
    "manicure",
    "pedicure",

    // Traditional/Additional
    "hilot",
    "caregiver_basic",
    "caregiver_certified",
    "pet_care",
    "pet_sitting",
    "pet_grooming",
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

  const onSubmit = async (extra: ExtraForm) => {
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

    // Build availability schedule and store into Zustand
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
        timeSlot: "Evening", // Default time slot, actual availability controlled by morning/evening checkboxes
        morning: slotMorning,
        evening: slotEvening,
      };
    });

    const dataToSave = {
      skills,
      availabilitySchedule: availabilitySchedule as any,
      languages: languages as string[],
    };

    console.log("SkillsAvailabilityClient: Saving data to store", dataToSave);
    setSkillsAvailability(dataToSave);

    setIsSaving(false);
    onNext?.();
  };

  return (
    <>
      <div className="max-w-4xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Skills & Availability
          </h1>
          <p className="text-gray-600 text-lg">
            Tell us about your skills and when you're available to work. This
            helps us match you with the right job opportunities.
          </p>
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600 text-sm">
              <strong>Required:</strong> You must add at least one skill and
              select your available days to proceed.
            </p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Skills</label>
          <div className="rounded-xl border border-[#DFDFDF] p-2 flex flex-wrap gap-2">
            {/* Skills Dropdown - Always at the leftmost position */}
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
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DFDFDF] rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto"
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

            {/* Selected Skills - Always appended to the right */}
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DFDFDF] px-3 py-1 stepsSkills bg-[#DFDFDF]"
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
          </div>
          {/* Quick add suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "housekeeping",
              "laundry",
              "ironing",
              "babysitting",
              "cooking_filipino",
              "cooking_western",
              "baking",
              "elderly_care",
              "pet_care",
              "driving",
              "tutor_english",
              "tutor_math",
              "nanny",
              "yaya",
              "kasambahay",
              "gardening",
              "cleaning",
              "handyman",
              "plumbing",
              "painting",
              "massage",
              "hilot",
            ]
              .filter((suggestion) => !skills.includes(suggestion)) // Remove already selected skills
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  className="text-xs cursor-pointer rounded-full border border-[#DFDFDF] px-3 py-1 bg-white hover:bg-[#F8F8F8]"
                >
                  + {capitalizeSkill(suggestion)}
                </button>
              ))}
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
              className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 flex items-center justify-between"
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
        w-full max-w-full
        rounded-xl bg-[#EDEDED] border border-[#EDEDED]
        p-4 shadow-sm
      "
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ">
                  {allDays.map((d) => {
                    const checked = selectedDays.includes(d);
                    return (
                      <label key={d} className="inline-flex items-center gap-2">
                        {/* custom checkbox */}
                        <span
                          className={[
                            "inline-flex items-center justify-center",
                            "w-5 h-5 rounded-[4px] border shrink-0",
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
          <label className="block mb-2 stepsLabel">Available Time Slots</label>
          <p className="text-sm text-gray-600 mb-3">
            Select the time periods you're available to work
          </p>

          <div className="flex gap-3">
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

        {/* Languages */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Languages</label>
          <div className="rounded-xl border border-[#DFDFDF] p-2 flex flex-wrap gap-2">
            {(languages as string[]).map((lng, idx) => (
              <span
                key={`${lng}-${idx}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DFDFDF] px-3 py-1 stepsSkills bg-[#DFDFDF]"
              >
                {lng}
                <button
                  type="button"
                  onClick={() =>
                    setValue(
                      "languages",
                      (languages as string[]).filter((l) => l !== lng)
                    )
                  }
                  className="rounded-sm -mt-1 leading-none"
                  aria-label={`Remove ${lng}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Type a language and press Enter"
              className="flex-1 min-w-[160px] outline-none"
              onKeyDown={(e) => {
                const input = (e.target as HTMLInputElement).value.trim();
                if (e.key === "Enter" && input) {
                  e.preventDefault();
                  if (!(languages as string[]).includes(input)) {
                    setValue("languages", [...(languages as string[]), input]);
                  }
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>
          {errors.languages && (
            <p className="text-xs text-red-600 mt-1">Invalid languages</p>
          )}
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        )}

        {/* Loading State */}
        {isSaving && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <p className="text-blue-600 text-sm">
              Saving your skills & availability...
            </p>
          </div>
        )}

        <StepperFooter
          onBack={onBack ? onBack : () => router.push("/kindtao-onboarding")}
          onNext={isSaving ? undefined : handleSubmit(onSubmit)}
          nextLabel={isSaving ? "Saving..." : "Next"}
        />
      </div>
    </>
  );
}
