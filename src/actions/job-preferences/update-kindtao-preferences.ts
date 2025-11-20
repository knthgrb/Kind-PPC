"use server";

import { JobPreferences, JobPreferencesService } from "@/services/JobPreferencesService";
import { getServerActionContext } from "@/utils/server-action-context";
import { logger } from "@/utils/logger";

export async function updateKindTaoJobPreferences(preferences: JobPreferences) {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user || !convex) {
      return { success: false, error: "Unauthorized" };
    }

    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "Unable to determine user" };
    }

    await JobPreferencesService.updateJobPreferences(convex, userId, preferences);

    return { success: true };
  } catch (err) {
    logger.error("Failed to update KindTao job preferences", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update job preferences",
    };
  }
}


