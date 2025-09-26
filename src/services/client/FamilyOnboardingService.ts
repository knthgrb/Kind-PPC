import {
  FamilyProfile,
  FamilyProfileFormData,
  FamilyOnboardingProgress,
} from "@/types/familyProfile";
import { FamilyService } from "./FamilyService";
import { familyOnboardingHelpers } from "@/helpers/familyOnboarding";
import { UserService } from "@/services/client/UserService";

export class FamilyOnboardingService {
  /**
   * Check family onboarding progress
   */
  static async checkFamilyOnboardingProgress(
    userId: string
  ): Promise<FamilyOnboardingProgress> {
    const { data: profile, error } = await FamilyService.getFamilyProfile(
      userId
    );

    const phone = await UserService.getUserPhone(userId);

    if (error || !profile) {
      return familyOnboardingHelpers.getDefaultProgress();
    }

    const stages = familyOnboardingHelpers.checkStagesComplete(profile, phone);
    const completedStages = stages.filter((stage) => stage.completed);
    const missingStages = stages.filter((stage) => !stage.completed);

    return {
      isComplete: completedStages.length === stages.length,
      nextStage:
        missingStages.length > 0
          ? `/kindbossing-onboarding/${missingStages[0].stage}`
          : undefined,
      completedStages: completedStages.map((s) => s.stage),
      missingStages: missingStages.map((s) => s.stage),
    };
  }
}
