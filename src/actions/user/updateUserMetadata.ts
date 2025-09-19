"use server";

import { UserService } from "@/services/server/UserService";

export async function updateUserMetadata(data: any) {
  const { data: user, error } = await UserService.updateUserMetadata(data);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: user };
}
