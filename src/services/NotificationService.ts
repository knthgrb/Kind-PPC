import { logger } from "@/utils/logger";

const isBrowser = typeof window !== "undefined";

const ensureSupport = () => {
  if (!isBrowser || !("Notification" in window)) {
    throw new Error("Notifications are not supported in this environment.");
  }
};

export const NotificationService = {
  getPermissionStatus(): NotificationPermission {
    if (!isBrowser || !("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    try {
      ensureSupport();

      if (Notification.permission === "granted") {
        return "granted";
      }

      if (Notification.permission === "denied") {
        return "denied";
      }

      return await Notification.requestPermission();
    } catch (error) {
      logger.error("Notification permission request failed:", error);
      return "denied";
    }
  },

  async testNotification(): Promise<void> {
    try {
      ensureSupport();
      if (Notification.permission !== "granted") {
        return;
      }

      new Notification("Notifications enabled", {
        body: "You will now receive alerts for important updates.",
        icon: "/icons/icon-192x192.png",
      });
    } catch (error) {
      logger.error("Failed to show test notification:", error);
    }
  },

  async initialize(userId: string): Promise<void> {
    // No initialization needed for browser notifications
    // Push notifications are handled separately via service workers
    logger.debug("NotificationService initialized for user:", userId);
  },

  cleanup(): void {
    // No cleanup needed for browser notifications
    logger.debug("NotificationService cleanup called");
  },
};
