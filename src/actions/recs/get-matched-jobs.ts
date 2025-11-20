"use server";

import { getServerActionContext, type ServerActionContext } from "@/utils/server-action-context";
import { JobMatchingService } from "@/services/JobMatchingService";
import { logger } from "@/utils/logger";
import { cache, getMatchedJobsCacheKey } from "@/utils/cache";

// Cache TTL: 3 minutes (180000ms)
// This balances freshness with reducing backend load
const CACHE_TTL = 3 * 60 * 1000;

export async function getMatchedJobs(
  limit: number = 20,
  offset: number = 0,
  context?: ServerActionContext & { error: "NOT_AUTHENTICATED" | null }
) {
  try {
    // Use provided context or fetch new one
    const ctx = context || (await getServerActionContext({ requireUser: true }));
    const { convex, user, error } = ctx;

    if (error || !user || !convex) {
      return { jobs: [], error: "NOT_AUTHENTICATED" };
    }

    const userId = user.id || user.userId || user._id;
    if (!userId) {
      return { jobs: [], error: "USER_ID_NOT_FOUND" };
    }

    // Check cache first
    const cacheKey = getMatchedJobsCacheKey(userId, limit, offset);
    const cachedResult = cache.get<{ jobs: any[]; error?: string }>(cacheKey);

    if (cachedResult) {
      logger.debug("Returning cached matched jobs:", { userId, limit, offset });
      return cachedResult;
    }

    // Cache miss - fetch from service
    const result = await JobMatchingService.getMatchedJobs(
      convex,
      userId,
      limit,
      offset
    );

    // Store in cache
    cache.set(cacheKey, result, CACHE_TTL);

    return result;
  } catch (error) {
    logger.error("Error in getMatchedJobs server action:", error);
    return {
      jobs: [],
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}

