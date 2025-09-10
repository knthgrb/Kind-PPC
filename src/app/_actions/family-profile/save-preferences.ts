"use server";

import { upsertFamilyProfile } from "./upsert-family-profile";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function savePreferences(formData: FormData) {
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
    const preferredLanguages = JSON.parse(
      (formData.get("preferred_languages") as string) || "[]"
    );

    // Validate data
    if (!preferredLanguages || preferredLanguages.length === 0) {
      return {
        success: false,
        error: "Please select at least one language preference",
        validationErrors: ["preferred_languages"],
      };
    }

    // Save to database
    const { error } = await upsertFamilyProfile(user.id, {
      preferred_languages: preferredLanguages,
    });

    if (error) {
      return { success: false, error: error.message || "Failed to save data" };
    }

    return { success: true, message: "Preferences saved successfully" };
  } catch (error) {
    console.error("Unexpected error in savePreferences:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
