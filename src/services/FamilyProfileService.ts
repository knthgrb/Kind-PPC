import { createClient } from "@/utils/supabase/server";
import {
  FamilyProfile,
  FamilyProfileFormData,
  FamilyOnboardingProgress,
} from "@/types/familyProfile";

export class FamilyProfileService {
  /**
   * Check if a family profile exists for the user
   */
  static async checkFamilyProfileExists(userId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("family_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    return !error && !!data;
  }

  /**
   * Fetches the family_id for a given user ID.
   * @param userId - The user's ID.
   * @returns The family_id as a string, or null if not found.
   */
  static async fetchFamilyIdByUserId(userId: string): Promise<string | null> {
    const supabase = await createClient();

    // Get the family profile directly from family_profiles table using user_id
    const { data, error } = await supabase
      .from("family_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.id) {
      console.error("Error fetching family_id:", error);
      return null;
    }

    return data.id as string;
  }

  /**
   * Fetches the family profile for a given user ID using family_id.
   * @param userId - The user's ID.
   * @returns The family profile object, or null if not found.
   */
  static async fetchFamilyProfileByUserId(
    userId: string
  ): Promise<FamilyProfile | null> {
    const supabase = await createClient();

    // First, get the family_id for the user
    const familyId = await this.fetchFamilyIdByUserId(userId);
    if (!familyId) return null;

    // Now, fetch the family profile using the family_id
    const { data, error } = await supabase
      .from("family_profiles")
      .select("*")
      .eq("id", familyId)
      .maybeSingle();

    if (error || !data) {
      console.error("Error fetching family profile:", error);
      return null;
    }

    return data as FamilyProfile;
  }

  /**
   * Get family profile by user ID
   */
  static async getFamilyProfile(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("family_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // Handle "no rows" case - this is normal for new users
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      console.error("Error fetching family profile:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Create or update family profile
   */
  static async upsertFamilyProfile(
    userId: string,
    profileData: Partial<FamilyProfileFormData>
  ) {
    const supabase = await createClient();

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("family_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from("family_profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      return { data, error };
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("family_profiles")
        .insert({
          user_id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    }
  }

  /**
   * Check family onboarding progress
   */
  static async checkFamilyOnboardingProgress(
    userId: string
  ): Promise<FamilyOnboardingProgress> {
    const { data: profile, error } = await this.getFamilyProfile(userId);

    if (error || !profile) {
      return this.getDefaultProgress();
    }

    const stages = this.checkStagesComplete(profile);
    const completedStages = stages.filter((stage) => stage.completed);
    const missingStages = stages.filter((stage) => !stage.completed);

    return {
      isComplete: completedStages.length === stages.length,
      nextStage:
        missingStages.length > 0
          ? `/family-profile/${missingStages[0].stage}`
          : undefined,
      completedStages: completedStages.map((s) => s.stage),
      missingStages: missingStages.map((s) => s.stage),
    };
  }

  /**
   * Check which stages are complete
   */
  private static checkStagesComplete(profile: FamilyProfile) {
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
  }

  /**
   * Get default progress when no profile exists
   */
  private static getDefaultProgress(): FamilyOnboardingProgress {
    return {
      isComplete: false,
      nextStage: "/family-profile/household-info",
      completedStages: [],
      missingStages: ["household-info", "work-environment", "preferences"],
    };
  }
}
