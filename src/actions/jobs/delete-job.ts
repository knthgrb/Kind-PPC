"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function deleteJob(
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
      return { success: false, error: "Unauthorized to delete this job" };
    }

    await convex.mutation(api.jobs.deleteJob, {
      jobId: existingJob._id,
    });

    logger.info("Job deleted successfully:", { jobId, userId });

    return { success: true };
  } catch (err) {
    logger.error("Failed to delete job:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete job",
    };
  }
}

