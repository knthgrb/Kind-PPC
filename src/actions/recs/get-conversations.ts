"use server";

import { getServerActionContext, type ServerActionContext } from "@/utils/server-action-context";
import { ChatService } from "@/services/ChatService";
import { MatchService } from "@/services/MatchService";
import { logger } from "@/utils/logger";

export async function getConversations(
  limit: number = 20,
  offset: number = 0,
  context?: ServerActionContext & { error: "NOT_AUTHENTICATED" | null }
) {
  try {
    // Use provided context or fetch new one
    const ctx = context || (await getServerActionContext({ requireUser: true }));
    const { convex, user, error } = ctx;

    if (error || !user || !convex) {
      return { conversations: [], hasMore: false, error: "NOT_AUTHENTICATED" };
    }

    const userId = user.id || user.userId || user._id;
    if (!userId) {
      return {
        conversations: [],
        hasMore: false,
        error: "USER_ID_NOT_FOUND",
      };
    }

    const role = user.role;
    if (!role || role === "admin") {
      return { conversations: [], hasMore: false };
    }

    // Get all conversations
    const allConversations = await ChatService.getUserConversations(
      convex,
      userId
    );

    // Get all matches to check opened status
    const allMatches = await MatchService.getUserMatches(
      convex,
      userId,
      role as "kindtao" | "kindbossing",
      { filterOpenedWithConversation: true }
    );

    // Create a map of match IDs to match data for quick lookup
    const matchMap = new Map<string, any>();
    for (const match of allMatches) {
      const matchId = String(match._id || "");
      matchMap.set(matchId, match);
    }

    // Filter out conversations where the match is unopened by the current user
    // If a match has a conversation but is unopened, it should stay in matches list, not messages list
    const filteredConversations = allConversations.filter((conv) => {
      if (!conv.match_id) {
        // Conversation without match_id should still be shown
        return true;
      }

      const matchId = String(conv.match_id);
      const match = matchMap.get(matchId);

      if (!match) {
        // Match not found, show conversation anyway
        return true;
      }

      // Check if match is opened by current user
      // Use === true to handle undefined/null/false as unopened
      const isOpened = role === "kindtao"
        ? match.is_opened_by_kindtao === true
        : match.is_opened_by_kindbossing === true;

      // Only include conversation if match is opened by current user
      // If match is unopened, the conversation should NOT appear in messages list
      // (it should stay in matches list with a red dot badge)
      return isOpened === true;
    });

    // Sort by last_message_at or created_at (most recent first)
    const sorted = filteredConversations.sort((a, b) => {
      const aTime =
        (a.last_message_at ? new Date(a.last_message_at).getTime() : 0) ||
        (a.created_at ? new Date(a.created_at).getTime() : 0);
      const bTime =
        (b.last_message_at ? new Date(b.last_message_at).getTime() : 0) ||
        (b.created_at ? new Date(b.created_at).getTime() : 0);
      return bTime - aTime;
    });

    // Apply pagination
    const paginated = sorted.slice(offset, offset + limit);
    const hasMore = sorted.length > offset + limit;

    return {
      conversations: paginated,
      hasMore,
      total: sorted.length,
    };
  } catch (error) {
    logger.error("Error in getConversations server action:", error);
    return {
      conversations: [],
      hasMore: false,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}

