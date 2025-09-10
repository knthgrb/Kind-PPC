"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepperFooter from "@/components/StepperFooter";
import { savePreferences } from "@/app/_actions/family-profile/save-preferences";

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Filipino", label: "Filipino" },
  { value: "Tagalog", label: "Tagalog" },
  { value: "Cebuano", label: "Cebuano" },
  { value: "Ilocano", label: "Ilocano" },
  { value: "Hiligaynon", label: "Hiligaynon" },
  { value: "Waray", label: "Waray" },
  { value: "Kapampangan", label: "Kapampangan" },
  { value: "Pangasinan", label: "Pangasinan" },
  { value: "Bicolano", label: "Bicolano" },
];

interface InitialFormData {
  preferredLanguages: string[];
}

interface PreferencesFormProps {
  initialData: InitialFormData;
}

export default function PreferencesForm({ initialData }: PreferencesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(
    initialData.preferredLanguages
  );

  const handleLanguageToggle = (language: string) => {
    setPreferredLanguages((prev) => {
      if (prev.includes(language)) {
        return prev.filter((lang) => lang !== language);
      } else {
        return [...prev, language];
      }
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const result = await savePreferences(formData);

      if (!result.success) {
        setSaveError(result.error || "Failed to save data");
        return;
      }

      // Navigate to dashboard (family profile complete)
      router.push("/kindbossing-dashboard");
    } catch (error) {
      // Check if this is a redirect error (which is expected and good)
      if (
        error instanceof Error &&
        (error.message === "NEXT_REDIRECT" ||
          error.message.includes("NEXT_REDIRECT"))
      ) {
        return;
      }

      console.error("Error:", error);
      setSaveError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label className="block mb-2 stepsLabel">
          Preferred languages for communication
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Select the languages you'd prefer helpers to speak. This helps us
          match you with helpers who can communicate effectively with your
          family.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {LANGUAGE_OPTIONS.map((language) => (
            <label
              key={language.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                preferredLanguages.includes(language.value)
                  ? "border-red-500 bg-red-50"
                  : "border-[#DFDFDF] hover:border-gray-400"
              }`}
            >
              <input
                type="checkbox"
                checked={preferredLanguages.includes(language.value)}
                onChange={() => handleLanguageToggle(language.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                  preferredLanguages.includes(language.value)
                    ? "border-red-500 bg-red-500"
                    : "border-gray-300"
                }`}
              >
                {preferredLanguages.includes(language.value) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {language.label}
              </span>
            </label>
          ))}
        </div>

        {preferredLanguages.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Selected languages:</strong>{" "}
              {preferredLanguages.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      {/* Loading State */}
      {isSubmitting && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600 text-sm">Completing your profile...</p>
        </div>
      )}

      {/* Hidden input for preferred languages */}
      <input
        type="hidden"
        name="preferred_languages"
        value={JSON.stringify(preferredLanguages)}
      />

      <StepperFooter
        onBack={() => router.push("/family-profile/work-environment")}
        onNext={isSubmitting ? undefined : () => {}}
        nextLabel={isSubmitting ? "Completing..." : "Complete Profile"}
        isSubmit={true}
      />
    </form>
  );
}
