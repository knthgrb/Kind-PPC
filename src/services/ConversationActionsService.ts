import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export const ConversationActionsService = {
  /**
   * Unmatch: Delete match and conversation
   */
  async unmatch(
    convex: ConvexClient,
    matchId: string,
    conversationId: string | null,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete conversation if it exists
      if (conversationId) {
        try {
          await convex.mutation(api.conversations.deleteConversation, {
            conversationId: conversationId as any,
          });
        } catch (error) {
          logger.warn("Error deleting conversation during unmatch:", error);
          // Continue even if conversation deletion fails
        }
      }

      // Delete match
      try {
        await convex.mutation(api.matches.deleteMatch, {
          matchId: matchId as any,
        });
      } catch (error) {
        logger.error("Error deleting match:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete match",
        };
      }

      return { success: true };
    } catch (error) {
      logger.error("Error in unmatch:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unmatch",
      };
    }
  },

  /**
   * Block a user
   */
  async blockUser(
    convex: ConvexClient,
    blockerId: string,
    blockedUserId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await convex.mutation(api.adminActions.blockUser, {
        blockerId,
        blockedUserId,
        reason,
      });

      if (!result.success) {
        return result;
      }

      // Also update conversation status to blocked if exists
      // Find conversation between these users
      const conversations = await convex.query(
        api.conversations.getConversationsByUser,
        { userId: blockerId, limit: 100, offset: 0 }
      );

      const conversation = conversations.find(
        (conv: any) =>
          (conv.kindbossing_user_id === blockerId &&
            conv.kindtao_user_id === blockedUserId) ||
          (conv.kindbossing_user_id === blockedUserId &&
            conv.kindtao_user_id === blockerId)
      );

      if (conversation) {
        try {
          await convex.mutation(api.conversations.updateConversation, {
            conversationId: conversation._id,
            updates: {
              status: "blocked",
            },
          });
        } catch (error) {
          logger.warn("Error updating conversation status to blocked:", error);
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Error blocking user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to block user",
      };
    }
  },

  /**
   * Report a user
   */
  async reportUser(
    convex: ConvexClient,
    reporterId: string,
    reportedUserId: string,
    reportType: string,
    description?: string,
    evidenceUrls?: string[]
  ): Promise<{ success: boolean; error?: string; reportId?: string }> {
    try {
      const reportId = await convex.mutation(api.reports.createReport, {
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        report_type: reportType,
        description,
        evidence_urls: evidenceUrls,
      });

      return { success: true, reportId: String(reportId) };
    } catch (error) {
      logger.error("Error reporting user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to report user",
      };
    }
  },
};

