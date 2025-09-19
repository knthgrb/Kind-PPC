"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Server-side utility to broadcast notifications via Supabase broadcast
 * This is used from server actions to send real-time notifications
 */
export async function broadcastNotification(
  notification: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const userId = notification.user_id as string;

    // Create a temporary channel to broadcast the notification
    const channel = supabase.channel(`notifications:${userId}`);

    await channel.send({
      type: "broadcast",
      event: "notification",
      payload: notification,
    });

    // Clean up the temporary channel
    await channel.unsubscribe();
  } catch (error) {
    // Silent error handling for broadcast failures
  }
}
