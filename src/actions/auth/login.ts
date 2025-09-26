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

  const { data: authData, error } = await AuthService.login(
    data.email,
    data.password
  );
  if (error) {
    if (error.message === "Email not confirmed") {
      redirect("/email-not-confirmed");
    }

    // Return error information instead of redirecting
    return {
      success: false,
      error: error.message,
      errorType:
        error.message === "Invalid login credentials"
          ? "Invalid login credentials"
          : "A server error occurred. Please try again.",
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
        // Return redirect info instead of redirecting
        return {
          success: true,
          data: authData,
          user: user,
          redirectTo: "/oauth/google/select-role",
        };
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

    // Handle different user roles - return redirect info instead of redirecting
    revalidatePath("/", "layout");

    let redirectTo = "/";
    if (role === "kindtao") {
      redirectTo = "/find-work";
    } else if (role === "kindbossing") {
      redirectTo = "/dashboard";
    } else if (role === "admin") {
      redirectTo = "/dashboard";
    }

    return {
      success: true,
      data: authData,
      user: user,
      role: role,
      redirectTo: redirectTo,
    };
  }

  // Fallback - return success with redirect to home
  logger.debug("Fallback redirect to home...");
  revalidatePath("/", "layout");
  return {
    success: true,
    data: authData,
    redirectTo: "/",
  };
}
