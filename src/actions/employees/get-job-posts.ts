"use server";

import { createClient } from "@/utils/supabase/server";
import { JobPost } from "@/types/jobPosts";

export async function getJobPostsForEmployeeSelection(): Promise<{
  success: boolean;
  jobPosts: JobPost[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        jobPosts: [],
        error: "Not authenticated",
      };
    }

    // Fetch only active job posts for the user
    const { data, error } = await supabase
      .from("job_posts")
      .select("id, job_title, job_type, status")
      .eq("kindbossing_user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching job posts:", error);
      return {
        success: false,
        jobPosts: [],
        error: "Failed to fetch job posts",
      };
    }

    return {
      success: true,
      jobPosts: (data || []) as JobPost[],
    };
  } catch (error) {
    console.error("Error in getJobPostsForEmployeeSelection:", error);
    return {
      success: false,
      jobPosts: [],
      error: "An unexpected error occurred",
    };
  }
}

