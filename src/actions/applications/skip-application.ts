"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { ApplicationService } from "@/services/ApplicationService";
import { logger } from "@/utils/logger";

interface SkipApplicationInput {
  applicationId: string;
}

export async function skipApplicationAction({
  applicationId,
}: SkipApplicationInput) {
  if (!applicationId) {
    logger.warn("skipApplicationAction called without applicationId");
    return {
      success: false,
      error: "INVALID_APPLICATION_ID",
    };
  }

  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !convex || !user) {
      logger.warn("skipApplicationAction blocked: missing auth context", {
        error,
      });
      return {
        success: false,
        error: "NOT_AUTHENTICATED",
      };
    }

    return await ApplicationService.skipApplication(convex, applicationId);
  } catch (error) {
    logger.error("skipApplicationAction failed:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
    };
  }
}


