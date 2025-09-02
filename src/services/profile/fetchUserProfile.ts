import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "@/types/userProfile";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Auth error:", userError);
    return null;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(
      `
      id, email, first_name, last_name, phone, profile_image_url,
      address, city, province, postal_code
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile as UserProfile;
}
