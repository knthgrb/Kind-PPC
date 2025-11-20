"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function boostJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
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
    const existingJob = await convex.query(api.jobs.getJobById, {
      jobId,
    }) as any;

    if (!existingJob) {
      return { success: false, error: "Job not found" };
    }

    if (existingJob.kindbossing_user_id !== userId) {
      return { success: false, error: "Unauthorized to boost this job" };
    }

    // Boost expires in 7 days
    const boostExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await convex.mutation(api.jobs.boostJob, {
      jobId: existingJob._id,
      boostExpiresAt,
    });

    logger.info("Job boosted successfully:", { jobId, userId });

    return { success: true };
  } catch (err) {
    logger.error("Failed to boost job:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to boost job",
    };
  }
}

