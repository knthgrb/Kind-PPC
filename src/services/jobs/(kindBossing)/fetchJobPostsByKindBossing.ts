import { createClient } from "@/utils/supabase/server";

export async function fetchJobPostsByKindBossing(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("active_job_posts")
    .select("*")
    .eq("family_id", userId);

  if (error) {
    console.error("Error fetching job posts:", error);
    return [];
  }

  return data ?? [];
}
