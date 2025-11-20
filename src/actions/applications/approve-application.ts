"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { ApplicationService } from "@/services/ApplicationService";
import { logger } from "@/utils/logger";

interface ApproveApplicationInput {
  applicationId: string;
  jobId: string;
  applicantId: string;
  kindbossingUserId?: string | null;
}

export async function approveApplicationAction({
  applicationId,
  jobId,
  applicantId,
  kindbossingUserId,
}: ApproveApplicationInput) {
  if (!applicationId || !jobId || !applicantId) {
    logger.warn("approveApplicationAction called with invalid input", {
      applicationId,
      jobId,
      applicantId,
    });
    return {
      success: false,
      error: "INVALID_INPUT",
    };
  }

  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !convex || !user) {
      logger.warn("approveApplicationAction blocked: missing auth context", {
        error,
      });
      return {
        success: false,
        error: "NOT_AUTHENTICATED",
      };
    }

    const currentUserId = user.id || user.userId || user._id;

    if (!currentUserId) {
      logger.warn("approveApplicationAction blocked: missing userId");
      return {
        success: false,
        error: "USER_ID_NOT_FOUND",
      };
    }

    if (kindbossingUserId && kindbossingUserId !== currentUserId) {
      logger.warn("approveApplicationAction blocked: unauthorized user", {
        currentUserId,
        kindbossingUserId,
      });
      return {
        success: false,
        error: "UNAUTHORIZED",
      };
    }

    const resolvedKindbossingId = kindbossingUserId || currentUserId;

    return await ApplicationService.approveApplication(
      convex,
      applicationId,
      jobId,
      applicantId,
      resolvedKindbossingId
    );
  } catch (error) {
    logger.error("approveApplicationAction failed:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
    };
  }
}


