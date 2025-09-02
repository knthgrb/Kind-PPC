"use server";

import { createClient } from "@/utils/supabase/server";
import { User } from "@/types/user";

export async function fetchCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  // Get auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, role, first_name, last_name, profile_image_url")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("Error fetching current user:", error?.message);
    return null;
  }

  const mappedUser: User = {
    id: data.id,
    role: data.role as User["role"],
    first_name: data.first_name,
    last_name: data.last_name,
    image: data.profile_image_url || "/profile/profile_placeholder.png",
  };

  return mappedUser;
}
