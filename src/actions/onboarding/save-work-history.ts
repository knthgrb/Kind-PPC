"use server";

import { OnboardingDataService, WorkHistoryData } from "@/services/OnboardingDataService";
import { createClient } from "@/utils/supabase/server";
import { createFormDataExtractor } from "@/utils/formDataExtractor";
import { redirect } from "next/navigation";

export async function saveWorkHistory(formData: FormData) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Extract form data using utility
    const extractor = createFormDataExtractor(formData);
    
    const data: WorkHistoryData = {
      work_experience: extractor.getWorkExperience(),
      educational_background: extractor.getString("educational_background"),
      certifications: extractor.getArray("certifications"),
    };

    // Validate data
    const validation = OnboardingDataService.validateWorkHistory(data);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: "Validation failed", 
        validationErrors: validation.errors 
      };
    }

    // Save to database
    const result = await OnboardingDataService.saveWorkHistory(user.id, data);
    
    if (result.success) {
      // Redirect to next stage
      redirect("/onboarding/document-upload");
    } else {
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error("Error saving work history:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
