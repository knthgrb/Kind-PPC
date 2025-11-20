import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export interface SwipeLimitStatus {
  remainingSwipes: number;
  dailyLimit: number;
  canSwipe: boolean;
}

export interface SwipeResult {
  canSwipe: boolean;
  remainingSwipes: number;
  dailyLimit: number;
}

export const SwipeService = {
  /**
   * Get user's current swipe credits status
   */
  async getSwipeLimitStatus(
    convex: ConvexClient,
    userId: string
  ): Promise<SwipeLimitStatus> {
    try {
      const user = await convex.query(api.users.getUserById, {
        userId,
      });

      if (!user) {
        return { remainingSwipes: 0, dailyLimit: 10, canSwipe: false };
      }

      const swipeCredits = user.swipe_credits || 0;
      const isUnlimited = swipeCredits >= 999999;
      const remainingSwipes = isUnlimited ? 999999 : Math.max(0, swipeCredits);

      return {
        remainingSwipes,
        dailyLimit: isUnlimited ? 999999 : 10,
        canSwipe: isUnlimited || remainingSwipes > 0,
      };
    } catch (error) {
      logger.error("Error fetching swipe credits:", error);
      return { remainingSwipes: 0, dailyLimit: 10, canSwipe: false };
    }
  },

  /**
   * Consume a swipe credit
   */
  async consumeSwipeCredit(
    convex: ConvexClient,
    userId: string
  ): Promise<SwipeResult> {
    try {
      const status = await this.getSwipeLimitStatus(convex, userId);

      if (!status.canSwipe) {
        return {
          canSwipe: false,
          remainingSwipes: status.remainingSwipes,
          dailyLimit: status.dailyLimit,
        };
      }

      // Consume a credit (only if not unlimited)
      if (status.remainingSwipes < 999999) {
        await convex.mutation(api.users.updateUser, {
          userId,
          updates: {
            swipe_credits: status.remainingSwipes - 1,
          },
        });
      }

      return {
        canSwipe: true,
        remainingSwipes:
          status.remainingSwipes >= 999999
            ? 999999
            : status.remainingSwipes - 1,
        dailyLimit: status.dailyLimit,
      };
    } catch (error) {
      logger.error("Error consuming swipe credit:", error);
      return {
        canSwipe: false,
        remainingSwipes: 0,
        dailyLimit: 10,
      };
    }
  },

  /**
   * Record a swipe action
   * Returns the interaction ID if successful, null otherwise
   */
  async recordSwipe(
    convex: ConvexClient,
    userId: string,
    jobId: string,
    action: "apply" | "skip"
  ): Promise<string | null> {
    try {
      // Check if already interacted
      const hasInteracted = await convex.query(
        api.swipes.hasInteractedWithJob,
        {
          userId,
          jobId,
        }
      );

      if (hasInteracted) {
        // Update existing interaction
        // Note: We'd need an update mutation for this
        logger.warn("User already interacted with job", { userId, jobId });
        return null;
      }

      // Create new interaction and return the ID
      const interactionId = await convex.mutation(
        api.swipes.createJobInteraction,
        {
          kindtao_user_id: userId,
          job_post_id: jobId,
          action: action === "apply" ? "swipe_right" : "swipe_left",
        }
      );

      return interactionId;
    } catch (error) {
      logger.error("Error recording swipe:", error);
      return null;
    }
  },

  /**
   * Check if user has interacted with a job
   */
  async hasInteractedWithJob(
    convex: ConvexClient,
    userId: string,
    jobId: string
  ): Promise<boolean> {
    try {
      return await convex.query(api.swipes.hasInteractedWithJob, {
        userId,
        jobId,
      });
    } catch (error) {
      logger.error("Error checking interaction:", error);
      return false;
    }
  },

  /**
   * Check if user has already swiped on a job
   */
  async hasSwipedOnJob(
    convex: ConvexClient,
    userId: string,
    jobId: string
  ): Promise<boolean> {
    return this.hasInteractedWithJob(convex, userId, jobId);
  },

  /**
   * Get jobs that user has already swiped on
   */
  async getSwipedJobIds(
    convex: ConvexClient,
    userId: string
  ): Promise<string[]> {
    try {
      const interactions = await convex.query(
        api.swipes.getJobInteractionsByUser,
        {
          userId,
        }
      );
      return interactions.map((interaction: any) => interaction.job_post_id);
    } catch (error) {
      logger.error("Error fetching swiped jobs:", error);
      return [];
    }
  },

  /**
   * Check if user has any swiped jobs (for enabling rewind button)
   */
  async hasSwipedJobs(
    convex: ConvexClient,
    userId: string
  ): Promise<boolean> {
    try {
      const mostRecent = await convex.query(
        api.swipes.getMostRecentInteraction,
        { userId }
      );
      return mostRecent !== null;
    } catch (error) {
      logger.error("Error checking swiped jobs:", error);
      return false;
    }
  },

  /**
   * Rewind the most recent interaction
   */
  async rewindMostRecent(
    convex: ConvexClient,
    userId: string
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const result = await convex.mutation(
        api.swipes.rewindMostRecentInteraction,
        { userId }
      );
      return result;
    } catch (error) {
      logger.error("Error rewinding interaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
