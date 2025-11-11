import { getNotificationPreference } from "@/actions/notifications/get-notification-preference";
import { updateNotificationPreference } from "@/actions/notifications/update-notification-preference";
import { logger } from "@/utils/logger";

type NotificationPreferenceData = {
  receiveNotification: boolean;
};

export class NotificationPreferencesService {
  static async getPreference(): Promise<{
    data: NotificationPreferenceData | null;
    error?: string;
  }> {
    try {
      return await getNotificationPreference();
    } catch (error) {
      logger.error("Error calling getNotificationPreference", error);
      return { data: null, error: "Failed to fetch notification preference" };
    }
  }

  static async updatePreference(
    receiveNotification: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await updateNotificationPreference(receiveNotification);
    } catch (error) {
      logger.error("Error calling updateNotificationPreference", error);
      return { success: false, error: "Failed to update notification preference" };
    }
  }
}

