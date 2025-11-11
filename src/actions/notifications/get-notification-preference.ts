"use server";

import { USER_SETTINGS_KEYS, UserSettingsService } from "@/services/server/UserSettingsService";
import { Role } from "@/types/user";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/utils/logger";

type GetNotificationPreferenceResult = {
  data: {
    receiveNotification: boolean;
  } | null;
  error?: string;
};

export async function getNotificationPreference(): Promise<GetNotificationPreferenceResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error(
        "Error fetching current user for notification preference",
        authError
      );
      return { data: null, error: "User not found" };
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
          "Error fetching user role for notification preference",
          roleError
        );
      }

      role = (roleData?.role as Role | undefined) || "kindtao";
    }

    const { settings, error } = await UserSettingsService.getUserSettings(
      user.id,
      role,
      supabase
    );

    if (error) {
      logger.error("Error fetching notification preference", error);
      return { data: null, error };
    }

    return {
      data: {
        receiveNotification: Boolean(
          settings?.[USER_SETTINGS_KEYS.NOTIFICATIONS]
        ),
      },
    };
  } catch (error) {
    logger.error("Unexpected error fetching notification preference", error);
    return { data: null, error: "An unexpected error occurred" };
  }
}

