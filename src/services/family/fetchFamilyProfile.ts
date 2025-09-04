import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "@/types/userProfile";

/**
 * Fetches the family_id for a given user ID.
 * @param userId - The user's ID.
 * @returns The family_id as a string, or null if not found.
 */
export async function fetchFamilyIdByUserId(
  userId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.family_id) {
    console.error("Error fetching family_id:", error);
    return null;
  }

  return data.family_id as string;
}

/**
 * Fetches the family profile for a given user ID.
 * @param userId - The user's ID.
 * @returns The family profile object, or null if not found.
 */
export async function fetchFamilyProfileByUserId(
  userId: string
): Promise<any | null> {
  const supabase = await createClient();

  // First, get the family_id for the user
  const familyId = await fetchFamilyIdByUserId(userId);
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

  return data;
}
