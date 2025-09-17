"use server";

import { AuthService } from "@/services/server/AuthService";
import { logger } from "@/utils/logger";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const role = formData.get("role")!.toString() as "kindbossing" | "kindtao";

  // Get phone and format it properly with +63 prefix
  const phoneNumber = (formData.get("phone") as string).trim();
  const formattedPhone = phoneNumber ? `+63${phoneNumber}` : "";

  const data = {
    email: (formData.get("email") as string).trim(),
    password: formData.get("password") as string,
    firstName: (formData.get("firstName") as string).trim(),
    lastName: (formData.get("lastName") as string).trim(),
    phone: formattedPhone,
    role: role,
    businessName: formData.get("businessName")?.toString().trim() || undefined,
  };

  const result = await AuthService.signup(data);

  if (result?.error) {
    logger.info("Signup error:", result?.error);

    // Handle specific error cases
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
