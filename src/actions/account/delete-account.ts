"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";
import { AuthService } from "@/services/AuthService";
import { redirect } from "next/navigation";

export async function deleteAccount(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { convex, token, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID and email
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Get user email from Convex
    const userData = await convex.query(api.users.getUserById, {
      userId,
    });

    if (!userData || !userData.email) {
      return { success: false, error: "User email not found" };
    }

    // Verify password by attempting to sign in
    // This ensures the password is correct before deleting
    const { data: authData, error: signInError } = await AuthService.signIn(
      convex,
      token,
      userData.email,
      password
    );

    if (signInError || !authData) {
      logger.warn("Password verification failed for account deletion", {
        userId,
        email: userData.email,
      });
      return {
        success: false,
        error: "Invalid password. Please try again.",
      };
    }

    // Password verified, proceed with account deletion
    logger.info("Password verified, proceeding with account deletion", {
      userId,
      email: userData.email,
    });

    // Delete user data from Convex
    await convex.mutation(api.users.deleteUser, {
      userId,
    });

    logger.info("User account deleted successfully", {
      userId,
      email: userData.email,
    });

    // Sign out the user (this will be handled client-side after redirect)
    // We can't call client-side signOut from server action, so we'll handle it in the component

    // Redirect to home page
    redirect("/");
  } catch (err) {
    logger.error("Failed to delete account:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to delete account. Please try again.",
    };
  }
}

