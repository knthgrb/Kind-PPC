"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepperFooter from "@/components/StepperFooter";
import { saveWorkEnvironment } from "@/actions/kindbossing-onboarding/save-work-environment";

interface InitialFormData {
  household_description: string;
  work_environment_description: string;
  special_requirements: string;
}

interface WorkEnvironmentFormProps {
  initialData: InitialFormData;
}

export default function WorkEnvironmentForm({
  initialData,
}: WorkEnvironmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialData);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const result = await saveWorkEnvironment(formData);

      if (!result.success) {
        setSaveError(result.error || "Failed to save data");
        return;
      }

      // Navigate to next step
      router.push("/kindbossing-onboarding/preferences");
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
        <label
          htmlFor="household_description"
          className="block mb-2 stepsLabel"
        >
          Describe your household
        </label>
        <p className="mb-1 text-sm text-gray-500">
          This helps helpers understand your family dynamics and daily life.
        </p>
        <textarea
          id="household_description"
          name="household_description"
          value={formData.household_description}
          onChange={handleInputChange}
          rows={4}
          placeholder="Tell us about your family, daily routines, and what makes your household unique..."
          className="w-full px-3 py-2 border border-[#DFDFDF] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="work_environment_description"
          className="block mb-2 stepsLabel"
        >
          Work environment description
        </label>
        <p className="mb-1 text-sm text-gray-500">
          Help potential helpers understand what to expect when working with
          your family.
        </p>
        <textarea
          id="work_environment_description"
          name="work_environment_description"
          value={formData.work_environment_description}
          onChange={handleInputChange}
          rows={4}
          placeholder="Describe what it's like to work in your home. What are the working conditions, schedule expectations, and general atmosphere?"
          className="w-full px-3 py-2 border border-[#DFDFDF] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="special_requirements" className="block mb-2 stepsLabel">
          Special requirements or considerations (optional)
        </label>
        <p className="mb-1 text-sm text-gray-500">
          This information helps us match you with helpers who can meet your
          specific needs. Leave blank if none.
        </p>
        <textarea
          id="special_requirements"
          name="special_requirements"
          value={formData.special_requirements}
          onChange={handleInputChange}
          rows={3}
          placeholder="Any special needs, dietary restrictions, allergies, or other important considerations for helpers to know about..."
          className="w-full px-3 py-2 border border-[#DFDFDF] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
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
          <p className="text-blue-600 text-sm">Saving your data...</p>
        </div>
      )}

      <StepperFooter
        onBack={() => router.push("/kindbossing-onboarding/household-info")}
        onNext={isSubmitting ? undefined : () => {}}
        nextLabel={isSubmitting ? "Saving..." : "Next"}
        isSubmit={true}
      />
    </form>
  );
}
