"use server";

import { createClient } from "@/utils/supabase/server";
import { FamilyProfileFormData } from "@/types/familyProfile";

export async function upsertFamilyProfile(
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
