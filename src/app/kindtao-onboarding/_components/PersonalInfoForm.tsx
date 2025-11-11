"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, getMonths, generateYears } from "@/utils/dateUtils";
import {
  GENDER_OPTIONS,
  EDUCATIONAL_ATTAINMENT_OPTIONS,
} from "@/constants/onboarding";
import { PersonalInfoForm } from "@/types/onboarding";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/common/StepperFooter";
// Saving to DB is deferred to finalization; no client DB calls here
import { useKindTaoOnboardingStore } from "@/stores/useKindTaoOnboardingStore";

type PersonalInfoProps = {
  onNext?: () => void;
};

export default function PersonalInfoClient({ onNext }: PersonalInfoProps) {
  const router = useRouter();
  const months = getMonths();
  const years = generateYears(100);
  const { setPersonalInfo, personalInfo } = useKindTaoOnboardingStore();

  const [form, setForm] = useState<PersonalInfoForm>({
    day: "",
    month: "",
    year: "",
    gender: "Male",
    location: "Philippines",
    barangay: "",
    municipality: "",
    province: "",
    zipCode: "",
  });

  const [highestEducationalAttainment, setHighestEducationalAttainment] =
    useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const daysInMonth = useMemo(
    () => getDaysInMonth(form.month, form.year),
    [form.month, form.year]
  );

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // Prefill from onboarding store if available
        if (personalInfo) {
          setForm((prev) => ({
            ...prev,
            day: personalInfo.day || prev.day,
            month: personalInfo.month || prev.month,
            year: personalInfo.year || prev.year,
            gender: (personalInfo.gender as typeof prev.gender) || prev.gender,
            barangay: personalInfo.barangay || prev.barangay,
            municipality: personalInfo.municipality || prev.municipality,
            province: personalInfo.province || prev.province,
            zipCode: personalInfo.zipCode || prev.zipCode,
          }));
          if (personalInfo.phone) {
            setPhoneNumber(personalInfo.phone);
          }
          if (personalInfo.highestEducationalAttainment) {
            setHighestEducationalAttainment(
              personalInfo.highestEducationalAttainment
            );
          }
        }

        // Load basic profile from server can be added here if needed later
        const userData = null as any;

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

        // Optional: prefill phone from any cached source in future
      } catch (error) {
        console.error("Error loading existing data:", error);
      }
    };

    loadExistingData();
  }, [personalInfo]);

  useEffect(() => {
    if (form.day && Number(form.day) > daysInMonth) {
      setForm((prev) => ({ ...prev, day: "" }));
    }
  }, [form.day, form.month, form.year, daysInMonth]);

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

  const handleNext = async () => {
    const errors: Record<string, string> = {};

    // Validate Date of Birth as a single field
    if (!form.day || !form.month || !form.year) {
      errors.dob = "Date of birth is required";
    } else {
      const maxDays = getDaysInMonth(form.month, form.year);
      const dNum = Number(form.day);
      if (isNaN(dNum) || dNum < 1 || dNum > maxDays) {
        errors.dob = "Invalid date for selected month/year";
      }
    }

    if (!form.gender) errors.gender = "Required";

    if (!form.barangay) errors.barangay = "Required";
    if (!form.municipality) errors.municipality = "Required";
    if (!form.province) errors.province = "Required";
    if (!form.zipCode) errors.zipCode = "Required";

    if (!phoneNumber.trim()) errors.phone = "Required";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // No server writes here. Persist data in onboarding store and move on.
    setPersonalInfo({
      day: form.day,
      month: form.month,
      year: form.year,
      gender: form.gender,
      location: "Philippines",
      barangay: form.barangay.trim(),
      municipality: form.municipality.trim(),
      province: form.province.trim(),
      zipCode: form.zipCode.trim(),
      phone: formatPhoneNumber(phoneNumber.trim()),
      highestEducationalAttainment: highestEducationalAttainment.trim(),
    });

    if (onNext) {
      onNext();
    } else {
      router.push("/kindtao-onboarding");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Personal Information
        </h1>
        <p className="text-gray-600 text-lg">
          Let's start with your basic information. This helps us create your
          profile and verify your identity.
        </p>
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm">
            <strong>Required:</strong> All fields are required to complete your
            profile setup.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Phone Number */}
        <div>
          <label className="block mb-2 stepsLabel">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 09123456789 or +639123456789"
            className="w-full px-4 py-3 border border-[#DFDFDF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your phone number with or without +63 prefix
          </p>
          {fieldErrors.phone && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
          )}
        </div>

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
            {/* Single DoB error shown below the three inputs */}

            {/* Month */}
            <Dropdown
              value={form.month}
              options={months}
              onChange={(month) => setForm({ ...form, month })}
              placeholder="Month"
              className="rounded-lg border border-[#DFDFDF]"
            />
            {/* Single DoB error shown below the three inputs */}

            {/* Year */}
            <Dropdown
              value={form.year}
              options={years.map(String)}
              onChange={(year) => setForm({ ...form, year })}
              placeholder="Year"
              className="rounded-lg border border-[#DFDFDF]"
            />
            {/* Single DoB error shown below the three inputs */}
          </div>
          {fieldErrors.dob && (
            <span className="text-xs text-red-600">{fieldErrors.dob}</span>
          )}
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
            {fieldErrors.gender && (
              <span className="text-xs text-red-600">{fieldErrors.gender}</span>
            )}
          </div>
          {/* Spacer */}
          <div className="sm:col-span-2" />
        </div>

        {/* Highest Educational Attainment */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">
            Highest Educational Attainment
          </label>
          <Dropdown
            value={highestEducationalAttainment}
            options={[...EDUCATIONAL_ATTAINMENT_OPTIONS]}
            onChange={setHighestEducationalAttainment}
            placeholder="Select your highest educational attainment"
            className="rounded-lg border border-[#DFDFDF]"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block mb-2 stepsLabel">Address</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                value={form.barangay}
                onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                placeholder="Barangay"
                className="w-full rounded-lg border border-[#DFDFDF] px-3 py-2"
              />
              {fieldErrors.barangay && (
                <span className="text-xs text-red-600">
                  {fieldErrors.barangay}
                </span>
              )}
            </div>
            <div>
              <input
                value={form.municipality}
                onChange={(e) =>
                  setForm({ ...form, municipality: e.target.value })
                }
                placeholder="Municipality/City"
                className="w-full rounded-lg border border-[#DFDFDF] px-3 py-2"
              />
              {fieldErrors.municipality && (
                <span className="text-xs text-red-600">
                  {fieldErrors.municipality}
                </span>
              )}
            </div>
            <div>
              <input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="Province"
                className="w-full rounded-lg border border-[#DFDFDF] px-3 py-2"
              />
              {fieldErrors.province && (
                <span className="text-xs text-red-600">
                  {fieldErrors.province}
                </span>
              )}
            </div>
            <div>
              <input
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                placeholder="ZIP Code"
                className="w-full rounded-lg border border-[#DFDFDF] px-3 py-2"
              />
              {fieldErrors.zipCode && (
                <span className="text-xs text-red-600">
                  {fieldErrors.zipCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        )}

        {/* No loading state; proceed instantly to next step */}

        {/* Stepper Footer */}
        <StepperFooter onNext={handleNext} nextLabel="Next" showBack={false} />
      </div>
    </div>
  );
}
