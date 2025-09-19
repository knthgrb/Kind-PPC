"use server";

import { UserService } from "@/services/server/UserService";

export async function getMultipleUsers(userIds: string[]) {
  if (userIds.length === 0) return { data: [], error: null };

  try {
    const userPromises = userIds.map(async (userId) => {
      const { data, error } = await UserService.getUserDetailsById(userId);
      return { id: userId, user: data, error };
    });

    const results = await Promise.all(userPromises);

    // Filter out users with errors and return successful ones
    const successfulUsers = results
      .filter((result) => !result.error && result.user)
      .map((result) => ({
        id: result.id,
        user: result.user,
      }));

    return { data: successfulUsers, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}
