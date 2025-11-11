"use server";

import { USER_SETTINGS_KEYS, UserSettingsService } from "@/services/server/UserSettingsService";
import { Role } from "@/types/user";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/utils/logger";

type UpdateNotificationPreferenceResult = {
  success: boolean;
  error?: string;
};

export async function updateNotificationPreference(
  receiveNotification: boolean
): Promise<UpdateNotificationPreferenceResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("Error fetching current user for updating notification preference", authError);
      return { success: false, error: "User not found" };
    }

    const roleFromMetadata = user.user_metadata?.role as Role | undefined;
    let role = roleFromMetadata;

    if (!role) {
      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (roleError) {
        logger.error(
          "Error fetching user role for updating notification preference",
          roleError
        );
      }

      role = (roleData?.role as Role | undefined) || "kindtao";
    }

    const { success, error } = await UserSettingsService.updateUserSetting(
      user.id,
      USER_SETTINGS_KEYS.NOTIFICATIONS,
      receiveNotification,
      role,
      supabase
    );

    if (!success) {
      if (error) {
        logger.error("Error updating notification preference", error);
      }
      return { success: false, error: error || "Failed to update preference" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error updating notification preference", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

