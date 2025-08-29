import { createClient } from "@/utils/supabase/server";

export interface OnboardingProgress {
  personalInfo: boolean;
  skillsAvailability: boolean;
  workHistory: boolean;
  documentUpload: boolean;
  isComplete: boolean;
  nextStage: string | null;
}

export class OnboardingService {
  /**
   * Check the onboarding progress for a kindtao user
   */
  static async checkOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const supabase = await createClient();
    
    try {
      // Check personal info completion (basic user data)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("first_name, last_name, phone, date_of_birth, gender, address, city, province")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error checking user data:", userError);
        return this.getDefaultProgress();
      }

      const personalInfo = this.checkPersonalInfoComplete(userData);

      // Check skills and availability
      const { data: skillsData, error: skillsError } = await supabase
        .from("helper_profiles")
        .select("skills, experience_years, preferred_job_types, availability_schedule")
        .eq("user_id", userId)
        .single();

      const skillsAvailability = !skillsError && skillsData && 
        skillsData.skills && 
        skillsData.skills.length > 0 && 
        skillsData.availability_schedule;

      // Check work history
      const { data: workData, error: workError } = await supabase
        .from("helper_profiles")
        .select("work_experience")
        .eq("user_id", userId)
        .single();

      const workHistory = !workError && workData && 
        workData.work_experience && 
        Array.isArray(workData.work_experience) && 
        workData.work_experience.length > 0;

      // Check document upload
      const { data: docsData, error: docsError } = await supabase
        .from("user_verifications")
        .select("valid_id_url, barangay_clearance_url, clinic_certificate_url")
        .eq("user_id", userId)
        .single();

      const documentUpload = !docsError && docsData && 
        (docsData.valid_id_url || docsData.barangay_clearance_url || docsData.clinic_certificate_url);

      // Determine next stage
      let nextStage: string | null = null;
      if (!personalInfo) {
        nextStage = "/onboarding/personal-info";
      } else if (!skillsAvailability) {
        nextStage = "/onboarding/skills-availability";
      } else if (!workHistory) {
        nextStage = "/onboarding/work-history";
      } else if (!documentUpload) {
        nextStage = "/onboarding/document-upload";
      }

      const isComplete = personalInfo && skillsAvailability && workHistory && documentUpload;

      return {
        personalInfo,
        skillsAvailability,
        workHistory,
        documentUpload,
        isComplete,
        nextStage
      };

    } catch (error) {
      console.error("Error checking onboarding progress:", error);
      return this.getDefaultProgress();
    }
  }

  /**
   * Check if personal info is complete
   */
  private static checkPersonalInfoComplete(userData: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
  }): boolean {
    return !!(
      userData.first_name &&
      userData.last_name &&
      userData.phone &&
      userData.date_of_birth &&
      userData.gender &&
      userData.address &&
      userData.city &&
      userData.province
    );
  }

  /**
   * Get default progress state
   */
  private static getDefaultProgress(): OnboardingProgress {
    return {
      personalInfo: false,
      skillsAvailability: false,
      workHistory: false,
      documentUpload: false,
      isComplete: false,
      nextStage: "/onboarding/personal-info"
    };
  }

  /**
   * Get onboarding progress percentage
   */
  static getProgressPercentage(progress: OnboardingProgress): number {
    const stages = [progress.personalInfo, progress.skillsAvailability, progress.workHistory, progress.documentUpload];
    const completedStages = stages.filter(stage => stage).length;
    return Math.round((completedStages / stages.length) * 100);
  }

  /**
   * Get current stage name
   */
  static getCurrentStageName(progress: OnboardingProgress): string {
    if (!progress.personalInfo) return "Personal Information";
    if (!progress.skillsAvailability) return "Skills & Availability";
    if (!progress.workHistory) return "Work History";
    if (!progress.documentUpload) return "Document Upload";
    return "Complete";
  }
}
