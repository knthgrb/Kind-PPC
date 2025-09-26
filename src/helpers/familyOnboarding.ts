import { FamilyOnboardingProgress, FamilyProfile } from "@/types/familyProfile";

export const familyOnboardingHelpers = {
  /**
   * Check which stages are complete
   */
  checkStagesComplete(profile: FamilyProfile, phone: string) {
    return [
      {
        stage: "business-info" as const,
        completed: !!(profile.business_name && phone),
      },
      {
        stage: "household-info" as const,
        completed: !!(
          profile.household_size &&
          profile.children_count !== null &&
          profile.elderly_count !== null &&
          profile.pets_count !== null
        ),
      },
      {
        stage: "work-environment" as const,
        completed: !!(
          profile.household_description && profile.work_environment_description
        ),
      },
      {
        stage: "preferences" as const,
        completed: !!(
          profile.preferred_languages && profile.preferred_languages.length > 0
        ),
      },
    ];
  },
  /**
   * Get default progress when no profile exists
   */
  getDefaultProgress(): FamilyOnboardingProgress {
    return {
      isComplete: false,
      nextStage: "/kindbossing-onboarding/business-info",
      completedStages: [],
      missingStages: [
        "business-info",
        "household-info",
        "work-environment",
        "preferences",
      ],
    };
  },
};
