import { OnboardingProgress } from "@/services/client/OnboardingService";

export const kindTaoOnboardingHelpers = {
  /**
   * Check if personal info is complete
   */
  checkPersonalInfoComplete(userInfo: any): boolean {
    // Align with the current Personal Info form which collects
    // date_of_birth and gender only. Treat other fields as optional
    // for completion to avoid false negatives during redirects.
    console.log("userInfo", userInfo);
    return !!(
      userInfo?.first_name &&
      userInfo?.last_name &&
      userInfo?.phone &&
      userInfo?.date_of_birth &&
      userInfo?.gender
    );
  },

  /**
   * Get default progress state
   */
  getDefaultProgress(): OnboardingProgress {
    return {
      personalInfoComplete: false,
      skillsAvailability: false,
      workHistory: false,
      documentUpload: false,
      isComplete: false,
      nextStage: "/kindtao-onboarding/personal-info",
    };
  },

  /**
   * Get onboarding progress percentage
   */
  getProgressPercentage(progress: OnboardingProgress): number {
    const stages = [
      progress.personalInfoComplete,
      progress.skillsAvailability,
      progress.workHistory,
      progress.documentUpload,
    ];
    const completedStages = stages.filter((stage) => stage).length;
    return Math.round((completedStages / stages.length) * 100);
  },
};
