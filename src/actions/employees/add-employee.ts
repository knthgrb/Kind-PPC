"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function addEmployee(data: {
  kindbossing_user_id: string;
  kindtao_user_id: string;
  job_post_id: string;
  status: "active" | "inactive";
}): Promise<{ success: boolean; error?: string }> {
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
    const job = await convex.query(api.jobs.getJobById, {
      jobId: data.job_post_id,
    }) as any;

    if (!job || job.kindbossing_user_id !== userId) {
      return { success: false, error: "Job not found or unauthorized" };
    }

    // Check if employee already exists
    const existingEmployee = await convex.query(
      api.employees.getEmployeeByCompositeKey,
      {
        kindbossingUserId: userId,
        kindtaoUserId: data.kindtao_user_id,
        jobPostId: data.job_post_id,
      }
    );

    if (existingEmployee) {
      return {
        success: false,
        error: "This employee is already associated with this job post",
      };
    }

    // Create employee
    await convex.mutation(api.employees.createEmployee, {
      kindbossing_user_id: userId,
      kindtao_user_id: data.kindtao_user_id,
      job_post_id: data.job_post_id,
      status: data.status,
    });

    logger.info("Employee added successfully:", {
      kindbossingUserId: userId,
      kindtaoUserId: data.kindtao_user_id,
      jobPostId: data.job_post_id,
    });

    return { success: true };
  } catch (err) {
    logger.error("Failed to add employee:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add employee",
    };
  }
}

