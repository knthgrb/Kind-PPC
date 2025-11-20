"use server";

import { logger } from "@/utils/logger";
import { AuthService } from "@/services/AuthService";

export async function resetPassword(email: string) {
  try {
    const { error } = await AuthService.resetPassword(email);

    if (error) {
      logger.error("Error sending password reset email:", error);
      return {
        success: false,
        error: error.message || "Failed to send password reset email",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error sending password reset email:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
