import { FamilyOnboardingProgress, FamilyProfile } from "@/types/familyProfile";

export const familyOnboardingHelpers = {
  /**
   * Check if family profile is complete
   */
  checkFamilyProfileComplete(profile: FamilyProfile): boolean {
    return !!(
      profile.household_size &&
      profile.children_count &&
      profile.elderly_count &&
      profile.pets_count
    );
  },

  /**
   * Check which stages are complete
   */
  checkStagesComplete(profile: FamilyProfile) {
    return [
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
      nextStage: "/family-profile/household-info",
      completedStages: [],
      missingStages: ["household-info", "work-environment", "preferences"],
    };
  },
};
