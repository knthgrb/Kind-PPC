"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function getUserInfo(): Promise<{
  success: boolean;
  user?: any;
  kindbossing?: any;
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

    // Get user profile
    const userProfile = await convex.query(api.profiles.getKindBossingProfile, {
      userId,
    });

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    return {
      success: true,
      user: userProfile,
      kindbossing: userProfile.kindbossing_profile,
    };
  } catch (err) {
    logger.error("Failed to get user info:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get user info",
    };
  }
}

