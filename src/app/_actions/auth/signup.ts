"use server";

import { AuthService } from "@/services/AuthService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
    role: formData.get("role") as "kindbossing" | "kindtao",
    businessName: formData.get("businessName") as string | undefined,
  };

  const { error } = await AuthService.signup(data);

  if (error) {
    // You might want to handle different types of errors differently
    console.error("Signup error:", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/signup/otp-verification");
}
