import { USER_SETTINGS_DEFAULTS, USER_SETTINGS_KEYS, UserSettings, UserSettingsKey } from "@/constants/userSettings";
import { Role } from "@/types/user";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/utils/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

type SettingsRow = {
  settings: Record<string, any> | null;
};

type DatabaseClient = SupabaseClient<any, any, any>;

const TABLE_NAME = "user_settings";

function getDefaultSettings(role: Role): UserSettings {
  return { ...USER_SETTINGS_DEFAULTS[role] };
}

function mergeSettingsWithDefaults(
  existing: Record<string, any> | null,
  defaults: UserSettings
): UserSettings {
  return {
    ...defaults,
    ...(existing || {}),
  } as UserSettings;
}

export class UserSettingsService {
  private static async getClient(provided?: DatabaseClient) {
    if (provided) return provided;
    return createClient();
  }

  static async ensureDefaultSettingsForUser(
    userId: string,
    role: Role,
    client?: DatabaseClient
  ): Promise<{ settings: UserSettings | null; error?: string }> {
    try {
      const supabase = await this.getClient(client);
      const defaults = getDefaultSettings(role);

      const { data: existingRow, error } = await supabase
        .from(TABLE_NAME)
        .select("settings")
        .eq("user_id", userId)
        .maybeSingle<SettingsRow>();

      if (error && (error as any)?.code !== "PGRST116") {
        logger.error("Error fetching user settings:", error);
        return { settings: null, error: error.message };
      }

      const currentSettings = existingRow?.settings ?? null;

      if (!existingRow) {
        const { error: insertError } = await supabase.from(TABLE_NAME).insert({
          user_id: userId,
          settings: defaults,
        });

        if (insertError) {
          logger.error("Error inserting default user settings:", insertError);
          return { settings: null, error: insertError.message };
        }

        return { settings: defaults };
      }

      const merged = mergeSettingsWithDefaults(currentSettings, defaults);

      const needsUpdate =
        !currentSettings ||
        JSON.stringify(currentSettings) !== JSON.stringify(merged);

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update({ settings: merged })
          .eq("user_id", userId);

        if (updateError) {
          logger.error("Error updating user settings with defaults:", updateError);
          return { settings: null, error: updateError.message };
        }
      }

      return { settings: merged };
    } catch (error) {
      logger.error("Unexpected error ensuring user settings:", error);
      return { settings: null, error: "Failed to ensure user settings" };
    }
  }

  static async getUserSettings(
    userId: string,
    role: Role,
    client?: DatabaseClient
  ): Promise<{ settings: UserSettings | null; error?: string }> {
    const ensured = await this.ensureDefaultSettingsForUser(userId, role, client);
    if (ensured.error) {
      return { settings: null, error: ensured.error };
    }
    return ensured;
  }

  static async updateUserSetting(
    userId: string,
    key: UserSettingsKey,
    value: boolean,
    role: Role,
    client?: DatabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getClient(client);
      const current = await this.ensureDefaultSettingsForUser(
        userId,
        role,
        supabase
      );

      if (current.error) {
        return { success: false, error: current.error };
      }

      const baseSettings = current.settings ?? getDefaultSettings(role);
      const updatedSettings: UserSettings = {
        ...baseSettings,
        [key]: value,
      } as UserSettings;

      const { data: updatedRow, error } = await supabase
        .from(TABLE_NAME)
        .update({ settings: updatedSettings })
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        logger.error("Error updating user setting:", error);
        return { success: false, error: error.message };
      }

      if (!updatedRow) {
        const { error: insertError } = await supabase.from(TABLE_NAME).insert({
          user_id: userId,
          settings: updatedSettings,
        });

        if (insertError) {
          logger.error(
            "Error inserting user setting after missing update row:",
            insertError
          );
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Unexpected error updating user setting:", error);
      return { success: false, error: "Failed to update user settings" };
    }
  }
}

export { USER_SETTINGS_KEYS };

