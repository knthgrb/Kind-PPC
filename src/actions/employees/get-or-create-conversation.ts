"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function getOrCreateConversation(
  kindtaoUserId: string
): Promise<{
  success: boolean;
  conversationId?: string;
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

    // Check if conversation already exists
    const conversations = await convex.query(
      api.conversations.getConversationsByUser,
      {
        userId,
      }
    );

    // Find existing conversation with this kindtao user
    const existingConversation = (conversations as any[]).find(
      (conv) =>
        (conv.kindbossing_user_id === userId &&
          conv.kindtao_user_id === kindtaoUserId) ||
        (conv.kindtao_user_id === userId &&
          conv.kindbossing_user_id === kindtaoUserId)
    );

    if (existingConversation) {
      return {
        success: true,
        conversationId: String(existingConversation._id),
      };
    }

    // Find match for this employee (if exists)
    const matches = await convex.query(api.matches.getMatchesByKindBossing, {
      userId,
    });

    const match = (matches as any[]).find(
      (m) => m.kindtao_user_id === kindtaoUserId
    );

    // Create new conversation
    const conversationId = await convex.mutation(
      api.conversations.createConversation,
      {
        match_id: match ? String(match._id) : undefined,
        kindbossing_user_id: userId,
        kindtao_user_id: kindtaoUserId,
        status: "active",
      }
    );

    logger.info("Conversation created successfully:", {
      conversationId: String(conversationId),
      userId,
      kindtaoUserId,
    });

    return { success: true, conversationId: String(conversationId) };
  } catch (err) {
    logger.error("Failed to get or create conversation:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to get or create conversation",
    };
  }
}

