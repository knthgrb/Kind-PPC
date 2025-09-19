"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OnboardingService } from "@/services/client/OnboardingService";
import { FamilyOnboardingService } from "@/services/client/FamilyOnboardingService";
import { AuthService } from "@/services/server/AuthService";
import { UserService } from "@/services/server/UserService";
import { logger } from "@/utils/logger";

export async function login(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await AuthService.login(data.email, data.password);
  if (error) {
    // Return error information instead of redirecting
    return {
      success: false,
      error: error.message,
      errorType:
        error.message === "Email not confirmed"
          ? "email_not_confirmed"
          : error.message === "Invalid login credentials"
          ? "invalid_credentials"
          : "general_error",
    };
  }

  // Get the current user to check their role and onboarding status
  const { data: user, error: userError } = await UserService.getCurrentUser();

  if (userError) {
    return {
      success: false,
      error:
        "An error occurred while retrieving user information. Please try again.",
      errorType: "general_error",
    };
  }

  if (user) {
    // Check if user is from Google OAuth
    if (user?.app_metadata?.provider === "google") {
      // Handle Google OAuth user
      const role = user.user_metadata?.role;

      if (!role) {
        // Redirect to role selection
        redirect("/oauth/google/select-role");
      }

      // Continue with existing role-based routing...
    }

    // Get user metadata to check role
    const { role } = await UserService.getCurrentUserRole();

    if (!role) {
      return {
        success: false,
        error: "Unable to determine user role. Please try again.",
        errorType: "general_error",
      };
    }

    // Handle different user roles
    // * Let the middleware handle the redirect
    if (role === "kindtao") {
      revalidatePath("/", "layout");
      redirect("/jobs");
    } else if (role === "kindbossing") {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    } else if (role === "admin") {
      // Admin users go to admin dashboard
      revalidatePath("/", "layout");
      redirect("/admin-dashboard");
    }
  }

  // Fallback redirect
  logger.debug("Fallback redirect to home...");
  revalidatePath("/", "layout");
  redirect("/");
}
