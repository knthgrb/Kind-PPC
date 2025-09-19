"use server";

import {
  OnboardingDataService,
  PersonalInfoData,
} from "@/services/OnboardingDataService";
import { createClient } from "@/utils/supabase/server";
import { createFormDataExtractor } from "@/utils/formDataExtractor";
import { redirect } from "next/navigation";

export async function savePersonalInfo(formData: FormData) {
  console.log("🚀 savePersonalInfo server action called!");
  console.log("📝 Form data received:", Object.fromEntries(formData.entries()));

  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ User authentication error:", userError);
      return { success: false, error: "User not authenticated" };
    }

    // Extract form data using utility
    const extractor = createFormDataExtractor(formData);

    const data: PersonalInfoData = {
      first_name: extractor.getString("first_name") || "",
      last_name: extractor.getString("last_name") || "",
      phone: extractor.getString("phone") || "",
      date_of_birth: extractor.getDate("date_of_birth") || "",
      gender: extractor.getString("gender") || "",
      address: extractor.getString("address") || "",
      city: extractor.getString("city") || "",
      province: extractor.getString("province") || "",
      postal_code: extractor.getString("postal_code"),
    };

    console.log("📊 Extracted data:", data);

    // Validate data
    const validation = OnboardingDataService.validatePersonalInfo(data);
    if (!validation.isValid) {
      console.log("❌ Validation failed:", validation.errors);
      return {
        success: false,
        error: "Validation failed",
        validationErrors: validation.errors,
      };
    }

    console.log("✅ Data validation passed");

    // Save to database
    console.log("💾 Saving to database...");
    const result = await OnboardingDataService.savePersonalInfo(user.id, data);

    console.log("💾 Database save result:", result);

    if (result.success) {
      console.log("✅ Success! Redirecting to next stage...");

      // Update onboarding progress
      try {
        const { OnboardingService } = await import(
          "@/services/client/OnboardingService"
        );
        await OnboardingService.checkOnboardingProgress(user);
      } catch (progressError) {
        console.warn("Warning: Could not update progress:", progressError);
      }

      // Redirect to next stage
      redirect("/onboarding/skills-availability");
    } else {
      console.error("❌ Database save failed:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("💥 Unexpected error in savePersonalInfo:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// New function for auto-save (no redirect)
export async function autoSavePersonalInfo(data: PersonalInfoData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate data
    const validation = OnboardingDataService.validatePersonalInfo(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: "Validation failed",
        validationErrors: validation.errors,
      };
    }

    // Save to database
    const result = await OnboardingDataService.savePersonalInfo(user.id, data);

    if (result.success) {
      return { success: true, message: "Data auto-saved successfully" };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error auto-saving personal info:", error);
    return { success: false, error: "Auto-save failed" };
  }
}
