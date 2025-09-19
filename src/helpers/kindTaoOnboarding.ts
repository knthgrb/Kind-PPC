import { OnboardingProgress } from "@/services/client/OnboardingService";

export const kindTaoOnboardingHelpers = {
  /**
   * Check if personal info is complete
   */
  checkPersonalInfoComplete(userMetadata: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    full_address?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
  }): boolean {
    // Align with the current Personal Info form which collects
    // date_of_birth and gender only. Treat other fields as optional
    // for completion to avoid false negatives during redirects.
    return !!(
      userMetadata?.first_name &&
      userMetadata?.last_name &&
      userMetadata?.phone &&
      userMetadata?.date_of_birth &&
      userMetadata?.gender &&
      userMetadata?.full_address &&
      userMetadata?.city &&
      userMetadata?.province &&
      userMetadata?.postal_code
    );
  },

  /**
   * Get default progress state
   */
  getDefaultProgress(): OnboardingProgress {
    return {
      personalInfo: false,
      skillsAvailability: false,
      workHistory: false,
      documentUpload: false,
      isComplete: false,
      nextStage: "/onboarding/personal-info",
    };
  },

  /**
   * Get onboarding progress percentage
   */
  getProgressPercentage(progress: OnboardingProgress): number {
    const stages = [
      progress.personalInfo,
      progress.skillsAvailability,
      progress.workHistory,
      progress.documentUpload,
    ];
    const completedStages = stages.filter((stage) => stage).length;
    return Math.round((completedStages / stages.length) * 100);
  },
};
