"use server";

import { JobService } from "@/services/server/JobService";
import { createClient } from "@/utils/supabase/server";

export async function getJobMatches(limit: number = 20): Promise<{
  success: boolean;
  data: any[];
  count: number;
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
        data: [],
        count: 0,
        error: "Unauthorized",
      };
    }

    // Get matching jobs
    const matches = await JobService.fetchMatchedJobs(user.id, limit);

    return {
      success: true,
      data: matches,
      count: matches.length,
    };
  } catch (error) {
    console.error("Error fetching job matches:", error);
    return {
      success: false,
      data: [],
      count: 0,
      error: "Failed to fetch job matches",
    };
  }
}
