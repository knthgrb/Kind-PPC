"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { JobService } from "@/services/JobService";
import { logger } from "@/utils/logger";

export async function getMyJobs(): Promise<{
  success: boolean;
  jobs?: any[];
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

    const jobs = await JobService.fetchMyJobs(convex, userId);

    logger.info("Fetched user jobs:", { userId, count: jobs.length });

    return { success: true, jobs };
  } catch (err) {
    logger.error("Failed to get my jobs:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get jobs",
    };
  }
}

