"use server";

import { AuthService } from "@/services/AuthService";
import { logger } from "@/utils/logger";
import { getServerActionContext } from "@/utils/server-action-context";

export async function resendConfirmationEmail(email: string) {
  try {
    const { convex, token } = await getServerActionContext();

    if (!convex) {
      logger.error("Cannot resend verification email without Convex client");
      return {
        success: false,
        error: "Unable to send verification email right now. Please try again.",
      };
    }

    const { error } = await AuthService.sendVerificationEmail(
      convex,
      token,
      email.trim().toLowerCase()
    );

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
