"use server";

import { AuthService } from "@/services/server/AuthService";
import { logger } from "@/utils/logger";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const role = formData.get("role")!.toString() as "kindbossing" | "kindtao";

  const data = {
    email: (formData.get("email") as string).trim(),
    password: formData.get("password") as string,
    firstName: (formData.get("firstName") as string).trim(),
    lastName: (formData.get("lastName") as string).trim(),
    role: role,
    businessName: formData.get("businessName")?.toString().trim() || undefined,
  };

  const result = await AuthService.signup(data);

  if (result?.error) {
    logger.info("Signup error:", result?.error);

    // Handle specific error cases
    if (
      result?.error &&
      "code" in result.error &&
      result.error.code === "EMAIL_EXISTS"
    ) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    if (
      result?.error &&
      "code" in result.error &&
      result.error.code === "PHONE_EXISTS"
    ) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    if (result?.error?.message?.includes("Database error finding user")) {
      return {
        success: false,
        error:
          "There was a database error. Please try again or contact support.",
      };
    }

    if (result?.error?.message?.includes("User already registered")) {
      return {
        success: false,
        error:
          "An account with this email already exists. Please use a different email.",
      };
    }

    // Handle Supabase auth errors
    if (result?.error?.message?.includes("Password should be at least")) {
      return {
        success: false,
        error: "Password must be at least 8 characters long.",
      };
    }

    if (result?.error?.message?.includes("Invalid email")) {
      return {
        success: false,
        error: "Please enter a valid email address.",
      };
    }

    return {
      success: false,
      error:
        result?.error?.message ||
        "An unexpected error occurred. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/email-confirmation?email=" + data.email);
}
