"use server";

import { logger } from "@/utils/logger";
import { AuthService } from "@/services/server/AuthService";

export async function resendConfirmationEmail(email: string) {
  try {
    const { error } = await AuthService.resendConfirmationEmail(email);

    if (error) {
      logger.error("Error resending confirmation email:", error);
      return {
        success: false,
        error: error.message || "Failed to resend confirmation email",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error resending confirmation email:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
