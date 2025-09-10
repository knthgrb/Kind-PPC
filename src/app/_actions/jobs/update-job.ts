"use server";

import { createClient } from "@/utils/supabase/server";
import { JobPost } from "@/types/jobPosts";

export async function updateJobPost(
  jobId: string,
  updates: Partial<JobPost>
): Promise<JobPost | null> {
  const allowed = [
    "title",
    "description",
    "job_type",
    "location",
    "salary_min",
    "salary_max",
    "salary_rate",
  ] as const;

  type AllowedKey = (typeof allowed)[number];

  const payload: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      payload[key] = updates[key as AllowedKey];
    }
  }
  payload["updated_at"] = new Date().toISOString();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_posts")
    .update(payload)
    .eq("id", jobId)
    .select(
      "id, family_id, title, description, job_type, location, salary_min, salary_max, salary_rate, created_at, updated_at"
    )
    .single();

  if (error) {
    console.error("Error updating job:", error);
    return null;
  }

  return data ? JSON.parse(JSON.stringify(data)) : null;
}
