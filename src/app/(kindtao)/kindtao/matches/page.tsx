import MatchesPageClient from "./_components/MatchesPageClient";
import { getServerActionContext } from "@/utils/server-action-context";
import { getMatchedJobs } from "@/actions/recs/get-matched-jobs";
import { getMatches } from "@/actions/recs/get-matches";
import { getConversations } from "@/actions/recs/get-conversations";
import { SwipeService } from "@/services/SwipeService";
import { logger } from "@/utils/logger";

/**
 * Server-side data fetching for Matches page
 * Implements progressive loading strategy:
 * - Fetch only essential data initially (matches, conversations list)
 * - Jobs and swipe limit can be loaded progressively
 * - Client-side caching handles subsequent navigation
 */
export async function getMatchesPageData() {
  const { convex, token, user, error } = await getServerActionContext();

  if (!convex || !user || error) {
    return {
      initialJobs: undefined,
      initialMatches: undefined,
      initialConversations: undefined,
      initialSwipeLimit: undefined,
    };
  }

  const sharedContext = {
    convex,
    token,
    user,
    error,
  };

  const userId = user.id || user.userId || user._id;

  try {
    // Parallel fetch for optimal performance
    // Only fetch essential data - client will handle caching
    const [jobsResult, matchesResult, conversationsResult, swipeLimit] =
      await Promise.all([
        getMatchedJobs(10, 0, sharedContext),
        getMatches(sharedContext),
        getConversations(20, 0, sharedContext),
        userId ? SwipeService.getSwipeLimitStatus(convex, userId) : null,
      ]);

    return {
      initialJobs: jobsResult?.jobs,
      initialMatches: matchesResult?.matches,
      initialConversations: conversationsResult?.conversations,
      initialSwipeLimit: swipeLimit || undefined,
    };
  } catch (error) {
    logger.error("Error fetching matches page data:", error);
    return {
      initialJobs: undefined,
      initialMatches: undefined,
      initialConversations: undefined,
      initialSwipeLimit: undefined,
    };
  }
}

export default async function MatchesPage() {
  const data = await getMatchesPageData();

  return (
    <MatchesPageClient
      initialJobs={data.initialJobs}
      initialMatches={data.initialMatches}
      initialConversations={data.initialConversations}
      initialSwipeLimit={data.initialSwipeLimit}
    />
  );
}
