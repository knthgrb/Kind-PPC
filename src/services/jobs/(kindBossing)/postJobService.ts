"use server";

import { createClient } from "@/utils/supabase/server";
import { JobPostInput } from "@/types/jobPosts";

export async function postJob(job: JobPostInput) {
  const supabase = await createClient();

  const payload = {
    family_id: job.family_id,
    title: job.title,
    description: job.description,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_rate: job.salary_rate,
    location: job.location,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("job_posts")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    console.error("Error posting job:", error.message);
    throw error;
  }

  return data;
}
