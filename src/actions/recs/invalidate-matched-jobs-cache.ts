"use server";

import { invalidateMatchedJobsCache } from "@/utils/cache";
import { logger } from "@/utils/logger";

/**
 * Server action to invalidate matched jobs cache for a user
 * Call this after a user swipes a job to ensure fresh results
 */
export async function invalidateMatchedJobsCacheAction(userId: string) {
  try {
    invalidateMatchedJobsCache(userId);
    logger.debug("Invalidated matched jobs cache for user:", userId);
  } catch (error) {
    logger.error("Error invalidating matched jobs cache:", error);
    // Don't throw - cache invalidation failure shouldn't break the app
  }
}

