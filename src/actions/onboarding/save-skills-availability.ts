"use server";

import { OnboardingDataService, SkillsAvailabilityData } from "@/services/OnboardingDataService";
import { createClient } from "@/utils/supabase/server";
import { createFormDataExtractor } from "@/utils/formDataExtractor";
import { redirect } from "next/navigation";

export async function saveSkillsAvailability(formData: FormData) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Extract form data using utility
    const extractor = createFormDataExtractor(formData);
    
    const data: SkillsAvailabilityData = {
      skills: extractor.getArray("skills"),
      experience_years: extractor.getNumber("experience_years") || 0,
      preferred_job_types: extractor.getArray("preferred_job_types"),
      languages_spoken: extractor.getArray("languages_spoken"),
      salary_expectation_min: extractor.getNumber("salary_expectation_min"),
      salary_expectation_max: extractor.getNumber("salary_expectation_max"),
      availability_schedule: extractor.getAvailabilitySchedule(),
      is_available_live_in: extractor.getBoolean("is_available_live_in"),
      preferred_work_radius: extractor.getNumber("preferred_work_radius") || 20,
      bio: extractor.getString("bio"),
    };

    // Validate data
    const validation = OnboardingDataService.validateSkillsAvailability(data);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: "Validation failed", 
        validationErrors: validation.errors 
      };
    }

    // Save to database
    const result = await OnboardingDataService.saveSkillsAvailability(user.id, data);
    
    if (result.success) {
      // Redirect to next stage
      redirect("/onboarding/work-history");
    } else {
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error("Error saving skills availability:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
