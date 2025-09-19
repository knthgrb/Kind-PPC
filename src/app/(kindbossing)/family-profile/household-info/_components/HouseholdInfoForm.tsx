"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepperFooter from "@/components/StepperFooter";
import { saveHouseholdInfo } from "@/actions/family-profile/save-household-info";

interface InitialFormData {
  household_size: number;
  children_count: number;
  children_ages: number[];
  elderly_count: number;
  pets_count: number;
  pet_types: string[];
}

interface HouseholdInfoFormProps {
  initialData: InitialFormData;
}

export default function HouseholdInfoForm({
  initialData,
}: HouseholdInfoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialData);

  const [newChildAge, setNewChildAge] = useState("");
  const [newPetType, setNewPetType] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("count") || name.includes("size")
          ? parseInt(value) || 0
          : value,
    }));
  };

  const addChildAge = () => {
    if (newChildAge && !isNaN(Number(newChildAge))) {
      setFormData((prev) => ({
        ...prev,
        children_ages: [...prev.children_ages, Number(newChildAge)],
      }));
      setNewChildAge("");
    }
  };

  const removeChildAge = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      children_ages: prev.children_ages.filter((_, i) => i !== index),
    }));
  };

  const addPetType = () => {
    if (newPetType.trim()) {
      setFormData((prev) => ({
        ...prev,
        pet_types: [...prev.pet_types, newPetType.trim()],
      }));
      setNewPetType("");
    }
  };

  const removePetType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pet_types: prev.pet_types.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const result = await saveHouseholdInfo(formData);

      if (!result.success) {
        setSaveError(result.error || "Failed to save data");
        return;
      }

      // Navigate to next step
      router.push("/family-profile/work-environment");
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
        <label htmlFor="household_size" className="block mb-2 stepsLabel">
          Total household size (including yourself)
        </label>
        <input
          type="number"
          id="household_size"
          name="household_size"
          value={formData.household_size}
          onChange={handleInputChange}
          min="1"
          required
          className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="children_count" className="block mb-2 stepsLabel">
          Number of children
        </label>
        <input
          type="number"
          id="children_count"
          name="children_count"
          value={formData.children_count}
          onChange={handleInputChange}
          min="0"
          className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {formData.children_count > 0 && (
        <div>
          <label className="block mb-2 stepsLabel">Children's ages</label>
          <div className="space-y-2">
            {formData.children_ages.map((age, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {age} years old
                </span>
                <button
                  type="button"
                  onClick={() => removeChildAge(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="number"
                value={newChildAge}
                onChange={(e) => setNewChildAge(e.target.value)}
                placeholder="Add age"
                min="0"
                max="18"
                className="px-3 py-2 border border-[#DFDFDF] rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <button
                type="button"
                onClick={addChildAge}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="elderly_count" className="block mb-2 stepsLabel">
          Number of elderly family members (65+)
        </label>
        <input
          type="number"
          id="elderly_count"
          name="elderly_count"
          value={formData.elderly_count}
          onChange={handleInputChange}
          min="0"
          className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="pets_count" className="block mb-2 stepsLabel">
          Number of pets
        </label>
        <input
          type="number"
          id="pets_count"
          name="pets_count"
          value={formData.pets_count}
          onChange={handleInputChange}
          min="0"
          className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {formData.pets_count > 0 && (
        <div>
          <label className="block mb-2 stepsLabel">Pet types</label>
          <div className="space-y-2">
            {formData.pet_types.map((type, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {type}
                </span>
                <button
                  type="button"
                  onClick={() => removePetType(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPetType}
                onChange={(e) => setNewPetType(e.target.value)}
                placeholder="Add pet type (e.g., Dog, Cat)"
                className="px-3 py-2 border border-[#DFDFDF] rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <button
                type="button"
                onClick={addPetType}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Hidden inputs for arrays */}
      <input
        type="hidden"
        name="children_ages"
        value={JSON.stringify(formData.children_ages)}
      />
      <input
        type="hidden"
        name="pet_types"
        value={JSON.stringify(formData.pet_types)}
      />

      <StepperFooter
        onNext={isSubmitting ? undefined : () => {}}
        nextLabel={isSubmitting ? "Saving..." : "Next"}
        isSubmit={true}
      />
    </form>
  );
}
