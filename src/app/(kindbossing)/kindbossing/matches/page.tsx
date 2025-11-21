import KindBossingMatchesPageClient from "./_components/KindBossingMatchesPageClient";
import { getServerActionContext } from "@/utils/server-action-context";
import { getMatches } from "@/actions/recs/get-matches";
import { getConversations } from "@/actions/recs/get-conversations";
import { logger } from "@/utils/logger";

/**
 * Server-side data fetching for KindBossing Matches page
 * Implements progressive loading strategy:
 * - Fetch only essential data initially (matches, conversations list)
 * - Client-side caching handles subsequent navigation
 */
export async function getMatchesPageData() {
  const { convex, token, user, error } = await getServerActionContext();

  if (!convex || !user || error) {
    return {
      initialMatches: undefined,
      initialConversations: undefined,
    };
  }

  const sharedContext = {
    convex,
    token,
    user,
    error,
  };

  try {
    // Parallel fetch for optimal performance
    // Only fetch essential data - client will handle caching
    const [matchesResult, conversationsResult] = await Promise.all([
      getMatches(sharedContext),
      getConversations(20, 0, sharedContext),
    ]);

    return {
      initialMatches: matchesResult?.matches,
      initialConversations: conversationsResult?.conversations,
    };
  } catch (error) {
    logger.error("Error fetching kindbossing matches page data:", error);
    return {
      initialMatches: undefined,
      initialConversations: undefined,
    };
  }
}

export default async function MatchesPage() {
  const data = await getMatchesPageData();

  return (
    <KindBossingMatchesPageClient
      initialMatches={data.initialMatches}
      initialConversations={data.initialConversations}
    />
  );
}
