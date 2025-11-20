"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  zip_code?: number;
  business_name?: string;
}): Promise<{ success: boolean; error?: string }> {
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

    // Separate user and kindbossing data
    const { business_name, ...userData } = data;

    // Update user profile
    if (Object.keys(userData).length > 0) {
      await convex.mutation(api.profiles.updateUserProfile, {
        userId,
        profileData: userData,
      });
    }

    // Update kindbossing profile if business_name is provided
    if (business_name !== undefined) {
      await convex.mutation(api.kindbossings.upsertKindBossing, {
        user_id: userId,
        business_name: business_name || undefined,
      });
    }

    logger.info("Profile updated successfully:", { userId });

    return { success: true };
  } catch (err) {
    logger.error("Failed to update profile:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}

