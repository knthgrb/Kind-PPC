"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { SwipeService } from "@/services/SwipeService";
import { ApplicationService } from "@/services/ApplicationService";
import { invalidateMatchedJobsCache } from "@/utils/cache";
import { logger } from "@/utils/logger";

type SwipeActionType = "like" | "skip" | "superlike";

interface PerformSwipeActionInput {
  jobId: string;
  action: SwipeActionType;
}

export async function performSwipeAction({
  jobId,
  action,
}: PerformSwipeActionInput) {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !convex || !user) {
      logger.warn("performSwipeAction blocked: missing auth context", {
        error,
      });
      return {
        success: false,
        error: "NOT_AUTHENTICATED",
      };
    }

    const userId = user.id || user.userId || user._id;

    if (!userId) {
      logger.warn("performSwipeAction blocked: missing userId");
      return {
        success: false,
        error: "USER_ID_NOT_FOUND",
      };
    }

    const swipeStatus = await SwipeService.consumeSwipeCredit(convex, userId);

    if (!swipeStatus.canSwipe) {
      logger.info("performSwipeAction blocked: no swipe credits", {
        userId,
      });
      return {
        success: false,
        error: "SWIPE_LIMIT",
        swipeStatus,
      };
    }

    const actionType = action === "skip" ? "skip" : "apply";
    const interactionId = await SwipeService.recordSwipe(
      convex,
      userId,
      jobId,
      actionType === "apply" ? "apply" : "skip"
    );

    if (actionType === "apply") {
      const applicationResult = await ApplicationService.applyForJob(
        convex,
        jobId,
        userId
      );

      if (!applicationResult.success) {
        logger.warn("Application creation failed after swipe", {
          userId,
          jobId,
          error: applicationResult.error,
        });
      }
    }

    invalidateMatchedJobsCache(userId);

    return {
      success: true,
      interactionId,
      swipeStatus,
    };
  } catch (error) {
    logger.error("performSwipeAction failed:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
    };
  }
}
