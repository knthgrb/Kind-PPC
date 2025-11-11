import { Role } from "@/types/user";

export const USER_SETTINGS_KEYS = {
  NOTIFICATIONS: "notifications",
} as const;

export type UserSettingsKey =
  (typeof USER_SETTINGS_KEYS)[keyof typeof USER_SETTINGS_KEYS];

export type UserSettings = Record<UserSettingsKey, boolean>;

export const USER_SETTINGS_DEFAULTS: Record<Role, UserSettings> = {
  kindtao: {
    [USER_SETTINGS_KEYS.NOTIFICATIONS]: true,
  },
  kindbossing: {
    [USER_SETTINGS_KEYS.NOTIFICATIONS]: true,
  },
};
