import { logger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

export const FamilyService = {
  async getFamilyProfile(userId: string) {
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
      logger.error("Error fetching family profile:", error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  async fetchFamilyIdByUserId(userId: string): Promise<string | null> {
    const supabase = await createClient();

    // Get the family profile directly from family_profiles table using user_id
    const { data, error } = await supabase
      .from("family_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.id) {
      logger.error("Error fetching family_id:", error);
      return null;
    }

    return data.id as string;
  },
};
