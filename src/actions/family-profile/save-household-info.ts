"use server";

import { upsertFamilyProfile } from "./upsert-family-profile";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function saveHouseholdInfo(formData: FormData) {
  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Extract form data
    const data = {
      household_size: parseInt(formData.get("household_size") as string) || 0,
      children_count: parseInt(formData.get("children_count") as string) || 0,
      children_ages: JSON.parse(
        (formData.get("children_ages") as string) || "[]"
      ),
      elderly_count: parseInt(formData.get("elderly_count") as string) || 0,
      pets_count: parseInt(formData.get("pets_count") as string) || 0,
      pet_types: JSON.parse((formData.get("pet_types") as string) || "[]"),
    };

    // Validate data
    if (!data.household_size || data.household_size < 1) {
      return {
        success: false,
        error: "Please enter a valid household size",
        validationErrors: ["household_size"],
      };
    }

    // Save to database
    const { error } = await upsertFamilyProfile(user.id, data);

    if (error) {
      return { success: false, error: error.message || "Failed to save data" };
    }

    return { success: true, message: "Household info saved successfully" };
  } catch (error) {
    // Check if this is a redirect error (which is expected and good)
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        error.message.includes("NEXT_REDIRECT"))
    ) {
      return { success: true };
    }

    console.error("Unexpected error in saveHouseholdInfo:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
