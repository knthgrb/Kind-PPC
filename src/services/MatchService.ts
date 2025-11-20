import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export interface Match {
  id: string;
  kindbossing_user_id: string;
  kindtao_user_id: string;
  job_post_id: string;
  matched_at: string;
  created_at: string;
  is_opened_by_kindbossing?: boolean;
  is_opened_by_kindtao?: boolean;
}

export interface MatchResult {
  success: boolean;
  matchId?: string;
  error?: string;
}

export const MatchService = {
  /**
   * Create a match when job application is approved
   */
  async createMatch(
    convex: ConvexClient,
    jobId: string,
    kindbossingId: string,
    kindtaoId: string
  ): Promise<MatchResult> {
    try {
      // Check if match already exists by querying matches
      // Note: This would need a query to check for existing matches
      // For now, we'll try to create and handle the error if it exists

      const matchId = await convex.mutation(api.matches.createMatch, {
        kindtao_user_id: kindtaoId,
        kindbossing_user_id: kindbossingId,
        job_post_id: jobId,
      });

      return {
        success: true,
        matchId: String(matchId),
      };
    } catch (error) {
      logger.error("Error creating match:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create match",
      };
    }
  },

  /**
   * Get user's matches
   */
  async getUserMatches(
    convex: ConvexClient,
    userId: string,
    userRole: "kindtao" | "kindbossing",
    options?: { filterOpenedWithConversation?: boolean }
  ): Promise<any[]> {
    try {
      const filterOpenedWithConversation =
        options?.filterOpenedWithConversation === true;
      if (userRole === "kindtao") {
        const matches = await convex.query(api.matches.getMatchesByKindTao, {
          userId,
          filterOpenedWithConversation,
        });
        return matches;
      } else {
        const matches = await convex.query(
          api.matches.getMatchesByKindBossing,
          {
            userId,
            filterOpenedWithConversation,
          }
        );
        return matches;
      }
    } catch (error) {
      logger.error("Error fetching user matches:", error);
      return [];
    }
  },

  /**
   * Get match by ID
   */
  async getMatchById(
    convex: ConvexClient,
    matchId: string
  ): Promise<Match | null> {
    try {
      // Note: We'd need a getMatchById query in convex/matches.ts
      // For now, return null
      return null;
    } catch (error) {
      logger.error("Error fetching match:", error);
      return null;
    }
  },

  /**
   * Get match with other user details
   */
  async getMatchWithOtherUser(
    convex: ConvexClient,
    matchId: string,
    currentUserId: string
  ): Promise<{ match: Match | null; otherUser: any | null }> {
    try {
      // Get user's matches to find the one with this matchId
      // This is a simplified version - ideally we'd have a getMatchById query
      const kindtaoMatches = await convex.query(
        api.matches.getMatchesByKindTao,
        {
          userId: currentUserId,
        }
      );
      const kindbossingMatches = await convex.query(
        api.matches.getMatchesByKindBossing,
        {
          userId: currentUserId,
        }
      );

      const allMatches = [...kindtaoMatches, ...kindbossingMatches];
      const match = allMatches.find((m: any) => String(m._id) === matchId);

      if (!match) {
        return { match: null, otherUser: null };
      }

      // Determine other user ID
      const otherUserId =
        match.kindbossing_user_id === currentUserId
          ? match.kindtao_user_id
          : match.kindbossing_user_id;

      // Get other user details
      const otherUser = await convex.query(api.users.getUserById, {
        userId: otherUserId,
      });

      return {
        match: {
          id: String(match._id),
          kindbossing_user_id: match.kindbossing_user_id,
          kindtao_user_id: match.kindtao_user_id,
          job_post_id: match.job_post_id,
          matched_at: new Date(match.matched_at).toISOString(),
          created_at: new Date(match.created_at).toISOString(),
          is_opened_by_kindbossing: match.is_opened_by_kindbossing,
          is_opened_by_kindtao: match.is_opened_by_kindtao,
        },
        otherUser: otherUser
          ? {
              id: otherUser.id,
              first_name: otherUser.first_name,
              last_name: otherUser.last_name,
              profile_image_url: otherUser.profile_image_url,
              role: otherUser.role,
            }
          : null,
      };
    } catch (error) {
      logger.error("Error fetching match with other user:", error);
      return { match: null, otherUser: null };
    }
  },

  /**
   * Mark match as opened by a specific user
   */
  async markMatchAsOpened(
    convex: ConvexClient,
    matchId: string,
    userRole: "kindbossing" | "kindtao"
  ): Promise<boolean> {
    try {
      await convex.mutation(api.matches.updateMatchOpened, {
        matchId: matchId as any,
        openedBy: userRole,
      });
      return true;
    } catch (error) {
      logger.error("Error marking match as opened:", error);
      return false;
    }
  },

  /**
   * Update match last message timestamp (client-side localStorage)
   */
  async updateMatchLastMessage(matchId: string): Promise<boolean> {
    try {
      if (typeof window === "undefined") return false;

      const matches = JSON.parse(localStorage.getItem("matches") || "[]");
      const matchIndex = matches.findIndex(
        (match: any) => match.id === matchId
      );

      if (matchIndex !== -1) {
        matches[matchIndex].last_message_at = new Date().toISOString();
        localStorage.setItem("matches", JSON.stringify(matches));
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error updating match last message:", error);
      return false;
    }
  },
};
