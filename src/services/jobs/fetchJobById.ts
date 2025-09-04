import { createClient } from "@/utils/supabase/server";

export async function fetchJobById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_posts")
    .select(
      "id, family_id, title, description, job_type, location, salary_min, salary_max, salary_rate, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching job:", error);
    return null;
  }

  return data ? JSON.parse(JSON.stringify(data)) : null;
}
