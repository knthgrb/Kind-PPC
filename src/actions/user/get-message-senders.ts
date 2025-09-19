"use server";

import { UserService } from "@/services/server/UserService";

export async function getMessageSenders(senderIds: string[]) {
  if (senderIds.length === 0) return { data: new Map(), error: null };

  try {
    const userPromises = senderIds.map(async (senderId) => {
      const { data, error } = await UserService.getUserDetailsById(senderId);
      return { id: senderId, user: data, error };
    });

    const results = await Promise.all(userPromises);
    const userMap = new Map();

    results.forEach(({ id, user, error }) => {
      if (!error && user) {
        userMap.set(id, {
          id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          profile_image_url: user.user_metadata?.profile_image_url || null,
          role: user.user_metadata?.role || "kindtao",
        });
      }
    });

    return { data: userMap, error: null };
  } catch (error) {
    return { data: new Map(), error: error as Error };
  }
}
