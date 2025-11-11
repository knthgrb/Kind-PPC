"use server";

import { createClient } from "@/utils/supabase/server";

export interface KindTaoUserOption {
  id: string;
  name: string;
  email: string;
}

export async function getKindTaoUsersForJob(
  jobPostId: string
): Promise<{
  success: boolean;
  users: KindTaoUserOption[];
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
        users: [],
        error: "Not authenticated",
      };
    }

    // Verify the job post belongs to the user
    const { data: jobPost, error: jobError } = await supabase
      .from("job_posts")
      .select("id, kindbossing_user_id")
      .eq("id", jobPostId)
      .single();

    if (jobError || !jobPost) {
      return {
        success: false,
        users: [],
        error: "Job post not found",
      };
    }

    if (jobPost.kindbossing_user_id !== user.id) {
      return {
        success: false,
        users: [],
        error: "Unauthorized to access this job",
      };
    }

    // Get only matched KindTao users for this KindBossing user and job (from matches table)
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("kindtao_user_id")
      .eq("kindbossing_user_id", user.id)
      .eq("job_post_id", jobPostId)
      .eq("is_active", true);

    if (matchesError) {
      console.error("Error fetching matches:", matchesError);
      return {
        success: false,
        users: [],
        error: "Failed to fetch matches",
      };
    }

    // Get unique user IDs from matches
    const userIds = new Set<string>();
    matches?.forEach((match) => {
      if (match.kindtao_user_id) userIds.add(match.kindtao_user_id);
    });

    if (userIds.size === 0) {
      return {
        success: true,
        users: [],
      };
    }

    // Fetch user details
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", Array.from(userIds))
      .eq("role", "kindtao");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return {
        success: false,
        users: [],
        error: "Failed to fetch users",
      };
    }

    // Transform to options
    const userOptions: KindTaoUserOption[] = (users || []).map((u) => ({
      id: u.id,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown",
      email: u.email || "",
    }));

    return {
      success: true,
      users: userOptions,
    };
  } catch (error) {
    console.error("Error in getKindTaoUsersForJob:", error);
    return {
      success: false,
      users: [],
      error: "An unexpected error occurred",
    };
  }
}

