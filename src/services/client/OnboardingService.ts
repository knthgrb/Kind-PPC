import { kindTaoOnboardingHelpers } from "@/helpers/kindTaoOnboarding";
import { logger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export interface OnboardingProgress {
  personalInfoComplete: boolean;
  skillsAvailability: boolean;
  workHistory: boolean;
  documentUpload: boolean;
  isComplete: boolean;
  nextStage: string | null;
}

export const OnboardingService = {
  /**
   * Check the onboarding progress for a kindtao user
   */
  async checkOnboardingProgress(user: User): Promise<OnboardingProgress> {
    const supabase = createClient();

    try {
      // Then fetch the rest of the data in parallel
      const [
        personalInfoResponse,
        skillsResponse,
        workResponse,
        userDocsResponse,
        verificationResponse,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("first_name, last_name, phone, date_of_birth, gender")
          .eq("id", user.id)
          .single(),
        supabase
          .from("helper_profiles")
          .select(
            "skills, experience_years, preferred_job_types, availability_schedule"
          )
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("helper_profiles")
          .select("work_experience")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("user_documents")
          .select("id")
          .eq("user_id", user.id)
          .limit(1),
        supabase
          .from("user_verifications")
          .select(
            "valid_id_url, barangay_clearance_url, clinic_certificate_url"
          )
          .eq("user_id", user.id)
          .single(),
      ]);

      const personalInfoComplete =
        kindTaoOnboardingHelpers.checkPersonalInfoComplete(user.user_metadata);

      // Check skills and availability
      const { data: skillsData, error: skillsError } = skillsResponse;
      const skillsAvailability =
        !skillsError &&
        skillsData &&
        skillsData.skills &&
        skillsData.skills.length > 0 &&
        skillsData.availability_schedule;

      // Check work history
      const { data: workData, error: workError } = workResponse;
      const workHistory =
        !workError &&
        workData &&
        workData.work_experience &&
        Array.isArray(workData.work_experience) &&
        workData.work_experience.length > 0;

      // Check document upload
      const { data: userDocs, error: userDocsError } = userDocsResponse;
      const { data: docsData, error: docsError } = verificationResponse;

      let documentUpload = false;
      if (!userDocsError && Array.isArray(userDocs) && userDocs.length > 0) {
        documentUpload = true;
      } else {
        documentUpload =
          !docsError &&
          !!docsData &&
          (docsData.valid_id_url ||
            docsData.barangay_clearance_url ||
            docsData.clinic_certificate_url);
      }

      // Determine next stage
      let nextStage: string | null = null;
      if (!personalInfoComplete) {
        nextStage = "/kindtao-onboarding/personal-info";
      }
      if (!skillsAvailability && nextStage === null) {
        nextStage = "/kindtao-onboarding/skills-availability";
      }
      if (!workHistory && nextStage === null) {
        nextStage = "/kindtao-onboarding/work-history";
      }
      if (!documentUpload && nextStage === null) {
        nextStage = "/kindtao-onboarding/document-upload";
      }

      return {
        personalInfoComplete,
        skillsAvailability,
        workHistory,
        documentUpload,
        isComplete:
          personalInfoComplete &&
          skillsAvailability &&
          workHistory &&
          documentUpload,
        nextStage,
      };
    } catch (error) {
      logger.error("Error checking onboarding progress:", error);
      return kindTaoOnboardingHelpers.getDefaultProgress();
    }
  },
};
