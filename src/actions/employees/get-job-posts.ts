"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";
import { JobService } from "@/services/JobService";

export async function getJobPostsForEmployeeSelection(): Promise<{
  success: boolean;
  jobPosts?: any[];
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

    // Get all active job posts for this user
    const jobs = await JobService.fetchMyJobs(convex, userId);

    // Filter to only active jobs
    const activeJobs = jobs.filter(
      (job) => job.status === "active" || job.status === "paused"
    );

    return { success: true, jobPosts: activeJobs };
  } catch (err) {
    logger.error("Failed to get job posts:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get job posts",
    };
  }
}

