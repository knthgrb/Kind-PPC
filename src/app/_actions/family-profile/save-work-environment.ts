"use server";

import { FamilyProfileService } from "@/services/FamilyProfileService";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function saveWorkEnvironment(formData: FormData) {
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
      household_description:
        (formData.get("household_description") as string) || "",
      work_environment_description:
        (formData.get("work_environment_description") as string) || "",
      special_requirements:
        (formData.get("special_requirements") as string) || "",
    };

    // Validate data
    if (!data.household_description.trim()) {
      return {
        success: false,
        error: "Please provide a household description",
        validationErrors: ["household_description"],
      };
    }

    if (!data.work_environment_description.trim()) {
      return {
        success: false,
        error: "Please provide a work environment description",
        validationErrors: ["work_environment_description"],
      };
    }

    // Special requirements is optional for now - allow empty string

    // Save to database
    const { error } = await FamilyProfileService.upsertFamilyProfile(
      user.id,
      data
    );

    if (error) {
      return { success: false, error: error.message || "Failed to save data" };
    }

    return { success: true, message: "Work environment saved successfully" };
  } catch (error) {
    // Check if this is a redirect error (which is expected and good)
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        error.message.includes("NEXT_REDIRECT"))
    ) {
      return { success: true };
    }

    console.error("Unexpected error in saveWorkEnvironment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
