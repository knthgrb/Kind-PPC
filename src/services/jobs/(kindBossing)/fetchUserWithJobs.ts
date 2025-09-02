"use server";

import { createClient } from "@/utils/supabase/server";
import { JobPost } from "@/types/jobPosts";

interface UserWithJobs {
  user: any;
  jobs: JobPost[];
}

export async function fetchUserWithJobs(): Promise<UserWithJobs | null> {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error:", authError?.message);
    return null;
  }

  // Fetch user row
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userError || !userRow) {
    console.error("User fetch error:", userError?.message);
    return null;
  }

  // Fetch jobs by this user
  const { data: jobs, error: jobsError } = await supabase
    .from("job_posts")
    .select("*")
    .eq("family_id", user.id)
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Jobs fetch error:", jobsError.message);
    return { user: userRow, jobs: [] };
  }

  return {
    user: userRow,
    jobs: jobs as JobPost[],
  };
}
