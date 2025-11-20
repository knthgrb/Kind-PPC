"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export type MatchedUserOption = {
  id: string;
  name: string;
  email: string;
  profile_image_url?: string | null;
};

export async function getMatchedUsersForJob(
  jobId: string
): Promise<{
  success: boolean;
  users?: MatchedUserOption[];
  error?: string;
}> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Verify the job belongs to the user
    let job;
    try {
      job = await convex.query(api.jobs.getJobById, { jobId }) as any;
    } catch (err) {
      // Invalid ID format - return empty result instead of error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Invalid ID")) {
        return { success: true, users: [] };
      }
      throw err; // Re-throw if it's a different error
    }
    
    if (!job || job.kindbossing_user_id !== userId) {
      // Job not found or unauthorized - return empty result (not an error)
      return { success: true, users: [] };
    }

    // Get all matches for this job
    const matches = await convex.query(api.matches.getMatchesByKindBossing, {
      userId,
    });

    // Filter matches for this specific job
    const jobMatches = (matches as any[]).filter(
      (match) => match.job_post_id === jobId
    );

    // Get unique kindtao users from matches
    const kindtaoUserIds = [
      ...new Set(jobMatches.map((match) => match.kindtao_user_id)),
    ];

    // Get user details for each matched kindtao user
    const matchedUsers: MatchedUserOption[] = [];
    for (const kindtaoUserId of kindtaoUserIds) {
      const kindtaoUser = await convex.query(api.users.getUserById, {
        userId: kindtaoUserId,
      });

      if (kindtaoUser) {
        const firstName = kindtaoUser.first_name || "";
        const lastName = kindtaoUser.last_name || "";
        const name =
          firstName && lastName
            ? `${firstName} ${lastName}`
            : kindtaoUser.email || "Unknown User";

        matchedUsers.push({
          id: kindtaoUser.id,
          name,
          email: kindtaoUser.email,
          profile_image_url: kindtaoUser.profile_image_url || null,
        });
      }
    }

    return { success: true, users: matchedUsers };
  } catch (err) {
    // Only log unexpected errors, not "no matches" scenarios
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (!errorMessage.includes("Invalid ID")) {
      logger.error("Failed to get matched users for job:", err);
    }
    // Return empty result instead of error for invalid IDs
    if (errorMessage.includes("Invalid ID")) {
      return { success: true, users: [] };
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to get matched users for job",
    };
  }
}

