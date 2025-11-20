import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  USER_SETTINGS_DEFAULTS,
  USER_SETTINGS_KEYS,
  type UserSettings,
  type UserSettingsKey,
} from "@/constants/userSettings";
import { Role } from "@/types/user";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export const UserSettingsService = {
  async getUserSettings(
    convex: ConvexClient,
    userId: string,
    role: Role
  ): Promise<{
    settings: UserSettings | null;
    error?: string;
  }> {
    try {
      const record = await convex.query(api.userSettings.getUserSettings, {
        userId,
      });

      if (!record) {
        const defaults = USER_SETTINGS_DEFAULTS[role];
        await convex.mutation(api.userSettings.ensureDefaultSettings, {
          user_id: userId,
          defaultSettings: defaults,
        });

        return { settings: defaults };
      }

      return {
        settings: (record.settings as UserSettings) ?? null,
      };
    } catch (error) {
      logger.error("Error fetching user settings:", error);
      return {
        settings: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user settings",
      };
    }
  },

  async updateUserSetting(
    convex: ConvexClient,
    userId: string,
    key: UserSettingsKey,
    value: boolean,
    role: Role
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const current = await convex.query(api.userSettings.getUserSettings, {
        userId,
      });

      const settings: UserSettings = {
        ...(USER_SETTINGS_DEFAULTS[role] || {}),
        ...(current?.settings as UserSettings | undefined),
      };

      settings[key] = value;

      await convex.mutation(api.userSettings.upsertUserSettings, {
        user_id: userId,
        settings,
      });

      return { success: true };
    } catch (error) {
      logger.error("Error updating user settings:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update user settings",
      };
    }
  },
};

export { USER_SETTINGS_KEYS };
